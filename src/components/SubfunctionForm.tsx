import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { subfunctions } from "@/data/subfunctions";
import { ScheduleData } from "@/types/agenda";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, CalendarX, Eraser, ChevronsUpDown, Check, Pencil } from "lucide-react";
import { SubjectManagementDialog } from "@/components/SubjectManagementDialog";
import { ActivityManagementDialog, type ActivityTableType } from "@/components/ActivityManagementDialog";
import { cn } from "@/lib/utils";
import { translateOption } from "@/i18n/optionTranslations";
import { toast } from "sonner";
import { SUBFUNCTION_COLORS, HOURS, formatHour, getTranslatedDays } from "@/data/scheduleConstants";
import { DocentePlanta } from "@/types/docentePlanta";
import { useSubjects, useSemesters, useFaculties, useEducationLevels, useProfessionalCareers, useDegreeWorks, useAcademicPractices, useInvestigations, useSocialProjects, useComplementaryActivities, useTeacherTraining, useAdministrativeActivities, useIndirectTeaching } from "@/hooks/useDatabase";
import { useDocenteConfig, calculateHours } from "@/hooks/useDocenteConfig";
import { DocenteResponses, DEFAULT_RESPONSES } from "@/types/docenteConfig";

// Persistent form data across subfunctions
const formDataStore: { [subfunctionId: string]: { [key: string]: string | number } } = {};

function ScheduleReadOnlyView({ hasSchedule, getSchedule }: { hasSchedule: boolean; getSchedule: () => ScheduleData | null }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!hasSchedule) {
    return (
      <div className="space-y-6">
        <div className="bg-ucp-red px-6 py-4 rounded-lg">
           <h1 className="text-xl font-bold text-primary-foreground">{t("schedule.title")}</h1>
          {user && (
            <p className="text-sm text-primary-foreground/80 mt-1">
              {t("form.docente")}: {[user.firstName, user.firstLastName].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarX className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center">
              {t("schedule.noSchedule")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const schedule = getSchedule()!;
  return (
    <div className="space-y-6">
      <div className="bg-ucp-red px-6 py-4 rounded-lg">
        <h1 className="text-xl font-bold text-primary-foreground">{t("schedule.title")}</h1>
        {user && (
          <p className="text-sm text-primary-foreground/80 mt-1">
            {t("form.docente")}: {[user.firstName, user.firstLastName].filter(Boolean).join(' ')}
          </p>
        )}
        <p className="text-xs text-primary-foreground/60 mt-1">
          {t("schedule.lastModified")}: {new Date(schedule.lastModified).toLocaleString("es-CO")}
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-20 p-2 border bg-muted text-muted-foreground font-semibold">{t("schedule.hour")}</th>
                {getTranslatedDays(t).map((day) => (
                  <th key={day} className="p-2 border bg-muted text-muted-foreground font-semibold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="p-2 border bg-muted/50 text-muted-foreground font-medium text-center whitespace-nowrap">
                    {formatHour(hour)}
                  </td>
                  {getTranslatedDays(t).map((_, dayIdx) => {
                    const block = schedule.blocks.find((b) => b.day === dayIdx && b.hour === hour);
                    return (
                      <td key={dayIdx} className="border p-0.5 h-10">
                        {block && (
                          <div className={`${SUBFUNCTION_COLORS[block.subfunctionId] || "bg-gray-500"} text-white rounded px-1.5 py-1 text-[10px] leading-tight font-medium h-full flex items-center`}>
                            <span className="truncate">{block.label}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SubfunctionForm({ subfunctionId }: { subfunctionId?: string }) {
  const { activeSubfunction, dropdownOptions, addDropdownOption, upsertRecord, updateRecord, getRecordsBySubfunction, hasSchedule, getSchedule, editingRecord, setEditingRecord } = useAgenda();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const resolvedId = subfunctionId || activeSubfunction;
  const [formData, setFormData] = useState<{ [key: string]: string | number }>(() => {
    return formDataStore[resolvedId] || {};
  });
  const [newOptionCategory, setNewOptionCategory] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastUpsertRef = useRef<string>("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState<ActivityTableType | null>(null);
  // DB hooks for auto-fill (only used for docencia-directa)
  const { data: dbSubjects } = useSubjects();
  const { data: dbSemesters } = useSemesters();
  const { data: dbFaculties } = useFaculties();
  const { data: dbEducationLevels } = useEducationLevels();
  const { data: dbProfessionalCareers } = useProfessionalCareers();
  const { data: dbDegreeWorks } = useDegreeWorks();
  const { data: dbAcademicPractices } = useAcademicPractices();
  const { data: dbInvestigations } = useInvestigations();
  const { data: dbSocialProjects } = useSocialProjects();
  const { data: dbComplementaryActivities } = useComplementaryActivities();
  const { data: dbTeacherTraining } = useTeacherTraining();
  const { data: dbAdministrativeActivities } = useAdministrativeActivities();
  const { data: dbIndirectTeaching } = useIndirectTeaching();

  const config = subfunctions.find((s) => s.id === resolvedId);

  const calculatedFields = config?.fields.filter((f) => f.type === "calculated") || [];
  const inputFields = config?.fields.filter((f) => f.type !== "calculated") || [];

  const computeTotal = useCallback((data: { [key: string]: string | number }) => {
    const calc = calculatedFields[0];
    if (!calc?.calculatedFrom) return 0;
    const v1 = Number(data[calc.calculatedFrom.field1]) || 0;
    const v2 = Number(data[calc.calculatedFrom.field2]) || 0;
    return v1 * v2;
  }, [calculatedFields]);

  const currentTotal = computeTotal(formData);

  // Calculate total weekly hours for all records in this subfunction
  const totalWeeklyHours = useMemo(() => {
    const records = getRecordsBySubfunction(resolvedId);
    // Determine which field holds "weekly hours" based on subfunction
    const weeklyField = resolvedId === "trabajos-grado" || resolvedId === "practicas-academicas"
      ? null // These don't have a direct weekly hours concept
      : "horasSemana";
    
    if (!weeklyField) return null;
    
    return records.reduce((sum, r) => sum + (Number(r.data[weeklyField]) || 0), 0);
  }, [getRecordsBySubfunction, resolvedId]);

  const { data: docenteConfig } = useDocenteConfig(user?.id);
  const dynamicRequirement = useMemo(() => {
    if (resolvedId !== "docencia-directa") return null;
    if (docenteConfig?.responses) {
      const responses = docenteConfig.responses as unknown as DocenteResponses;
      const calc = calculateHours(responses);
      return calc.finalDirectHours;
    }
    return 16;
  }, [resolvedId, docenteConfig]);

  const requirement = dynamicRequirement;

  const weeklyHoursColor = useMemo(() => {
    if (totalWeeklyHours === null || requirement === null) return "text-muted-foreground";
    if (totalWeeklyHours < requirement) return "text-destructive";
    if (totalWeeklyHours === requirement) return "text-primary";
    return "text-yellow-600";
  }, [totalWeeklyHours, requirement]);

  // Persist formData to store
  useEffect(() => {
    formDataStore[resolvedId] = formData;
  }, [formData, resolvedId]);

  // Deduplicated subject names for combobox
  const uniqueSubjectNames = useMemo(() => {
    if (!dbSubjects) return [];
    const seen = new Set<string>();
    return dbSubjects.filter((s) => {
      const lower = s.name.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [dbSubjects]);

  // Subjects matching the currently selected name
  const matchingSubjects = useMemo(() => {
    const name = formData["asignatura"];
    if (!name || typeof name !== "string" || !dbSubjects) return [];
    return dbSubjects.filter((s) => s.name.toLowerCase() === String(name).toLowerCase());
  }, [formData["asignatura"], dbSubjects]);

  // Filtered faculties/careers for subjects with selected name
  const filteredFacultyIds = useMemo(() => new Set(matchingSubjects.map((s) => s.id_faculty).filter(Boolean)), [matchingSubjects]);
  const filteredCareerIds = useMemo(() => new Set(matchingSubjects.map((s) => s.id_professional_career).filter(Boolean)), [matchingSubjects]);

  const hasMultipleVariants = matchingSubjects.length > 1;

  // Resolve the exact subject record based on name + faculty + career selection
  const resolveSubjectRecord = useCallback((subjects: typeof matchingSubjects, facultyName?: string, careerName?: string) => {
    if (subjects.length === 0) return null;
    if (subjects.length === 1) return subjects[0];
    // Try to find exact match by faculty+career
    const fac = facultyName ? dbFaculties?.find((f) => f.name === facultyName) : null;
    const car = careerName ? dbProfessionalCareers?.find((c) => c.name === careerName) : null;
    return subjects.find((s) =>
      (!fac || s.id_faculty === fac.id) && (!car || s.id_professional_career === car.id)
    ) || subjects[0];
  }, [dbFaculties, dbProfessionalCareers]);

  // Auto-fill fields when selecting a subject in docencia-directa
  useEffect(() => {
    if (resolvedId !== "docencia-directa") return;
    const selectedSubjectName = formData["asignatura"];
    if (!selectedSubjectName || typeof selectedSubjectName !== "string") return;
    if (!dbSubjects) return;

    const subjects = dbSubjects.filter((s) => s.name.toLowerCase() === String(selectedSubjectName).toLowerCase());
    if (subjects.length === 0) return;

    const subject = resolveSubjectRecord(subjects, formData["facultad"] as string, formData["programa"] as string);
    if (!subject) return;

    const semesterName = subject.id_semester
      ? dbSemesters?.find((s) => s.id === subject.id_semester)?.number?.toString()
      : undefined;
    const careerName = subject.id_professional_career
      ? dbProfessionalCareers?.find((c) => c.id === subject.id_professional_career)?.name
      : undefined;
    // Derive faculty from the career's id_faculty relationship
    const career = subject.id_professional_career
      ? dbProfessionalCareers?.find((c) => c.id === subject.id_professional_career)
      : null;
    const facultyName = career?.id_faculty
      ? dbFaculties?.find((f) => f.id === career.id_faculty)?.name
      : undefined;
    const levelName = subject.id_education_level
      ? dbEducationLevels?.find((l) => l.id === subject.id_education_level)?.name
      : undefined;

    setFormData((prev) => {
      const updated = { ...prev };
      if (semesterName) updated["semestre"] = semesterName;
      if (facultyName) updated["facultad"] = facultyName;
      if (careerName) updated["programa"] = careerName;
      if (levelName) updated["nivel"] = levelName;
      if (subject.weekly_hours) updated["horasSemana"] = subject.weekly_hours;
      if (subject.number_weeks) updated["cantidadSemanas"] = subject.number_weeks;
      return updated;
    });
  }, [formData["asignatura"], resolvedId, dbSubjects, dbSemesters, dbFaculties, dbEducationLevels, dbProfessionalCareers, resolveSubjectRecord]);

  // When program changes and there are multiple variants, resolve the correct subject and derive faculty
  useEffect(() => {
    if (resolvedId !== "docencia-directa" || !hasMultipleVariants) return;
    const subject = resolveSubjectRecord(matchingSubjects, formData["facultad"] as string, formData["programa"] as string);
    if (!subject) return;

    const semesterName = subject.id_semester
      ? dbSemesters?.find((s) => s.id === subject.id_semester)?.number?.toString()
      : undefined;
    const levelName = subject.id_education_level
      ? dbEducationLevels?.find((l) => l.id === subject.id_education_level)?.name
      : undefined;
    // Derive faculty from the selected career
    const career = subject.id_professional_career
      ? dbProfessionalCareers?.find((c) => c.id === subject.id_professional_career)
      : null;
    const facultyName = career?.id_faculty
      ? dbFaculties?.find((f) => f.id === career.id_faculty)?.name
      : undefined;

    setFormData((prev) => {
      const updated = { ...prev };
      if (semesterName) updated["semestre"] = semesterName;
      if (facultyName) updated["facultad"] = facultyName;
      if (levelName) updated["nivel"] = levelName;
      if (subject.weekly_hours) updated["horasSemana"] = subject.weekly_hours;
      if (subject.number_weeks) updated["cantidadSemanas"] = subject.number_weeks;
      return updated;
    });
  }, [formData["programa"], resolvedId, hasMultipleVariants, matchingSubjects, resolveSubjectRecord, dbSemesters, dbEducationLevels, dbProfessionalCareers, dbFaculties]);

  // Auto-fill fields when selecting an activity in other subfunctions
  useEffect(() => {
    if (resolvedId === "docencia-directa" || resolvedId === "distribucion-horaria") return;

    const AUTOFILL_MAP: { [subfId: string]: { dropdownField: string; data: any[] | undefined; targetField: string; weeklyHoursField?: string } } = {
      "trabajos-grado": { dropdownField: "tipoTrabajo", data: dbDegreeWorks, targetField: "cantidadHoras" },
      "practicas-academicas": { dropdownField: "actividad", data: dbAcademicPractices, targetField: "cantidadHoras" },
      "docencia-indirecta": { dropdownField: "actividad", data: dbIndirectTeaching, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
      "investigacion": { dropdownField: "actividad", data: dbInvestigations, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
      "proyeccion-social": { dropdownField: "actividad", data: dbSocialProjects, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
      "complementarias": { dropdownField: "actividad", data: dbComplementaryActivities, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
      "formacion-docentes": { dropdownField: "actividad", data: dbTeacherTraining, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
      "administrativas": { dropdownField: "actividad", data: dbAdministrativeActivities, targetField: "cantidadSemanas", weeklyHoursField: "horasSemana" },
    };

    const mapping = AUTOFILL_MAP[resolvedId];
    if (!mapping || !mapping.data) return;

    const selectedName = formData[mapping.dropdownField];
    if (!selectedName || typeof selectedName !== "string") return;

    const record = mapping.data.find((r: any) => r.name === selectedName);
    if (!record) return;

    setFormData((prev) => {
      const updated = { ...prev };
      updated[mapping.targetField] = record.number_weeks;
      if (mapping.weeklyHoursField && record.weekly_hours !== undefined) {
        updated[mapping.weeklyHoursField] = record.weekly_hours;
      }
      if (resolvedId === "practicas-academicas" && record.number_students !== undefined) {
        updated["cantidadEstudiantes"] = record.number_students;
      }
      return updated;
    });
  }, [
    formData["tipoTrabajo"], formData["actividad"], resolvedId,
    dbDegreeWorks, dbAcademicPractices, dbIndirectTeaching, dbInvestigations,
    dbSocialProjects, dbComplementaryActivities, dbTeacherTraining, dbAdministrativeActivities,
  ]);

  // Listen for editingRecord from context (click on summary panel record)
  useEffect(() => {
    if (editingRecord && editingRecord.subfunctionId === resolvedId) {
      setFormData({ ...editingRecord.data });
      formDataStore[resolvedId] = { ...editingRecord.data };
      setEditingRecordId(editingRecord.id);
      lastUpsertRef.current = JSON.stringify({ resolvedId, data: editingRecord.data, total: editingRecord.totalHoras });
      setEditingRecord(null);
    }
  }, [editingRecord, resolvedId, setEditingRecord]);

  // Auto-upsert when all fields are filled, then clear form
  useEffect(() => {
    if (!config || resolvedId === "distribucion-horaria") return;

    const allFilled = inputFields.every((f) => {
      if (f.type === "number") return Number(formData[f.name]) > 0;
      if (f.type === "dropdown") return !!formData[f.name];
      return true;
    });

    if (!allFilled) return;

    const total = computeTotal(formData);
    const sig = JSON.stringify({ resolvedId, data: formData, total });
    if (sig === lastUpsertRef.current) return;
    lastUpsertRef.current = "";

    if (editingRecordId) {
      updateRecord(editingRecordId, { ...formData }, total);
      toast.success(t("form.updatedRecord"));
    } else {
      upsertRecord(resolvedId, { ...formData }, total);
      toast.success(t("form.savedRecord"));
    }
    
    // Clear form after saving
    setFormData({});
    formDataStore[resolvedId] = {};
    setEditingRecordId(null);
  }, [formData, resolvedId, config, inputFields, computeTotal, upsertRecord, updateRecord, editingRecordId]);

  const handleClearForm = () => {
    setFormData({});
    formDataStore[resolvedId] = {};
    setEditingRecordId(null);
    lastUpsertRef.current = "";
  };

  if (!config) return null;

  if (resolvedId === "distribucion-horaria") {
    return <ScheduleReadOnlyView hasSchedule={hasSchedule} getSchedule={getSchedule} />;
  }

  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    addDropdownOption(newOptionCategory, newOptionValue.trim());
    setNewOptionValue("");
    setDialogOpen(false);
    toast.success(t("form.optionAdded"));
  };

  return (
    <div className="space-y-6">
      <div className="bg-ucp-red px-6 py-4 rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary-foreground">{t(config.titleKey || config.title)}</h1>
          {user && (
            <p className="text-sm text-primary-foreground/80 mt-1">
              {t("form.docente")}: {[user.firstName, user.firstLastName].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearForm}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title={t("form.clearFields")}
        >
          <Eraser className="h-4 w-4 mr-1" />
          {t("form.clear")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingRecordId ? t("form.editing") : t("form.record")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inputFields.map((field) => {
              const readOnlyFields = (() => {
                switch (resolvedId) {
                   case "docencia-directa": {
                    const base = ["semestre", "nivel", "horasSemana", "cantidadSemanas", "facultad"];
                    // If multiple variants exist, allow program editing
                    if (!hasMultipleVariants) {
                      base.push("programa");
                    }
                    return base;
                  }
                  case "docencia-indirecta": return ["horasSemana", "cantidadSemanas"];
                  case "trabajos-grado": return ["cantidadHoras"];
                  case "practicas-academicas": return ["cantidadHoras"];
                  case "investigacion":
                  case "complementarias":
                  case "formacion-docentes":
                  case "administrativas": return ["cantidadSemanas"];
                  default: return [];
                }
              })();
              const isReadOnly = readOnlyFields.includes(field.name);

              return (
                <div key={field.name} className="space-y-1.5">
                  <Label className="text-sm font-medium">{t(field.labelKey || field.label)}</Label>
                  {isReadOnly ? (
                     <div className="min-h-10 h-auto px-3 py-2 rounded-md bg-muted text-sm font-semibold flex items-center whitespace-normal text-left">
                      {translateOption(formData[field.name] || "—", language)}
                    </div>
                  ) : field.type === "dropdown" ? (
                    <div className="flex gap-1">
                      {field.category === "asignatura" && resolvedId === "docencia-directa" ? (
                        <>
                          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={comboboxOpen}
                                className="flex-1 justify-between font-normal h-auto min-h-10 whitespace-normal text-left"
                              >
                                {formData[field.name]
                                  ? translateOption(String(formData[field.name]), language)
                                  : t("form.searchSubject")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t("form.filterType")} />
                                <CommandList>
                                  <CommandEmpty>{t("form.noSubjects")}</CommandEmpty>
                                  <CommandGroup>
                                    {uniqueSubjectNames.map((subject) => (
                                      <CommandItem
                                        key={subject.id}
                                        value={subject.name}
                                        onSelect={(value) => {
                                          setFormData((p) => {
                                            // Clear faculty/program so auto-fill picks fresh values
                                            const { facultad, programa, ...rest } = p;
                                            return { ...rest, [field.name]: value };
                                          });
                                          setComboboxOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            String(formData[field.name]).toLowerCase() === subject.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {translateOption(subject.name, language)}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setSubjectDialogOpen(true)}
                            title={t("subject.manage")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <SubjectManagementDialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen} />
                        </>
                      ) : (
                        <>
                          <Select
                            value={String(formData[field.name] || "")}
                            onValueChange={(v) => setFormData((p) => ({ ...p, [field.name]: v }))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t("form.select")} />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                // When multiple subject variants exist, filter faculty/program options
                                if (hasMultipleVariants && resolvedId === "docencia-directa") {
                                  if (field.category === "programa") {
                                    return dbProfessionalCareers?.filter((c) => filteredCareerIds.has(c.id)).map((c) => (
                                      <SelectItem key={c.id} value={c.name}>{translateOption(c.name, language)}</SelectItem>
                                    ));
                                  }
                                }
                                const DB_CATEGORY_MAP: { [cat: string]: any[] | undefined } = {
                                  "asignatura": resolvedId === "docencia-directa" ? dbSubjects : undefined,
                                  "tipo_trabajo": dbDegreeWorks,
                                  "actividad_practicas": dbAcademicPractices,
                                  "actividad_indirecta": dbIndirectTeaching,
                                  "actividad_investigacion": dbInvestigations,
                                  "actividad_proyeccion": dbSocialProjects,
                                  "actividad_complementaria": dbComplementaryActivities,
                                  "actividad_formacion": dbTeacherTraining,
                                  "actividad_administrativa": dbAdministrativeActivities,
                                };
                                const dbData = DB_CATEGORY_MAP[field.category!];
                                if (dbData) {
                                  return dbData.map((item) => (
                                    <SelectItem key={item.id} value={item.name}>
                                      {translateOption(item.name, language)}
                                    </SelectItem>
                                  ));
                                }
                                return dropdownOptions
                                  .filter((o) => o.category === field.category)
                                  .map((o) => (
                                    <SelectItem key={o.id} value={o.value}>
                                      {translateOption(o.value, language)}
                                    </SelectItem>
                                  ));
                              })()}
                            </SelectContent>
                          </Select>
                          {(() => {
                            const CATEGORY_TO_TABLE: Record<string, ActivityTableType> = {
                              "actividad_indirecta": "indirect_teaching",
                              "tipo_trabajo": "degree_works",
                              "actividad_practicas": "academic_practices",
                              "actividad_investigacion": "investigations",
                              "actividad_proyeccion": "social_projects",
                              "actividad_complementaria": "complementary_activities",
                              "actividad_formacion": "teacher_training",
                              "actividad_administrativa": "administrative_activities",
                            };
                            const CATEGORY_TO_DATA: Record<string, any[] | undefined> = {
                              "actividad_indirecta": dbIndirectTeaching,
                              "tipo_trabajo": dbDegreeWorks,
                              "actividad_practicas": dbAcademicPractices,
                              "actividad_investigacion": dbInvestigations,
                              "actividad_proyeccion": dbSocialProjects,
                              "actividad_complementaria": dbComplementaryActivities,
                              "actividad_formacion": dbTeacherTraining,
                              "actividad_administrativa": dbAdministrativeActivities,
                            };
                            const actTable = CATEGORY_TO_TABLE[field.category!];
                            if (actTable) {
                              return (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => setActivityDialogOpen(actTable)}
                                    title={t("activity.manage")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <ActivityManagementDialog
                                    open={activityDialogOpen === actTable}
                                    onOpenChange={(open) => setActivityDialogOpen(open ? actTable : null)}
                                    tableType={actTable}
                                    items={CATEGORY_TO_DATA[field.category!]}
                                  />
                                </>
                              );
                            }
                            // No button for catalog-only categories
                            const NO_BUTTON_CATEGORIES = ["facultad", "programa", "semestre", "jornada", "nivel"];
                            if (NO_BUTTON_CATEGORIES.includes(field.category!)) {
                              return null;
                            }
                            return (
                              <Dialog open={dialogOpen && newOptionCategory === field.category} onOpenChange={(open) => { setDialogOpen(open); if (open) setNewOptionCategory(field.category!); }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => setNewOptionCategory(field.category!)}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{t("form.addOption")}: {t(field.labelKey || field.label)}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3 pt-2">
                                    <Input
                                      placeholder={t("form.newOption")}
                                      value={newOptionValue}
                                      onChange={(e) => setNewOptionValue(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                                    />
                                    <Button onClick={handleAddOption} className="w-full">{t("form.add")}</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={1}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, [field.name]: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  )}
                </div>
              );
            })}
            {calculatedFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-medium">{t(field.labelKey || field.label)}</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-muted text-sm font-semibold flex items-center">
                  {currentTotal}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total de horas semanales por todas las actividades */}
      {totalWeeklyHours !== null && (
        <div className="flex justify-end px-2">
          <p className={`text-sm font-semibold ${weeklyHoursColor}`}>
            {t("form.totalWeeklyHours")}: {totalWeeklyHours}h
            {requirement !== null && (
              <span className="text-muted-foreground font-normal"> / {requirement}h {t("form.required")}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
