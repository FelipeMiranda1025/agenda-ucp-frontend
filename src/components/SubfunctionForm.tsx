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
import { Plus, CalendarX, Eraser, ChevronsUpDown, Check, Pencil, Lock } from "lucide-react";
import { SubjectManagementDialog } from "@/components/SubjectManagementDialog";
import { ActivityManagementDialog, type ActivityTableType } from "@/components/ActivityManagementDialog";
import { cn } from "@/lib/utils";
import { translateOption } from "@/i18n/optionTranslations";
import { toast } from "sonner";
import { blockColorStyles, HOURS, formatHour, getTranslatedDays, resolveBlockColor } from "@/data/scheduleConstants";
import { useNavigate } from "react-router-dom";
import { canAccessScheduleDistribution } from "@/lib/agendaScheduleAccess";
import { DocentePlanta } from "@/types/docentePlanta";
import { useSubjects, useSemesters, useFaculties, useEducationLevels, useProfessionalCareers, useDegreeWorks, useAcademicPractices, useInvestigations, useSocialProjects, useComplementaryActivities, useTeacherTraining, useAdministrativeActivities, useIndirectTeaching, useAgendaView } from "@/hooks/useDatabase";
import { useRecommendations, getBlockedInvestigationActivities, getBlockedAdminActivities, getBlockedFormacionActivities, isFormBlockedByDoctorado } from "@/hooks/useRecommendations";
import { useActiveLineamientos } from "@/hooks/useActiveLineamientos";

// Persistent form data across subfunctions
const formDataStore: { [subfunctionId: string]: { [key: string]: string | number } } = {};

function ScheduleReadOnlyView({
  hasSchedule,
  getSchedule,
  displayName,
  canOpenBuilder,
}: {
  hasSchedule: boolean;
  getSchedule: () => ScheduleData | null;
  displayName: string;
  canOpenBuilder: boolean;
}) {
  const { t } = useLanguage();
  const { data: lineamientos } = useActiveLineamientos();
  const navigate = useNavigate();

  if (!hasSchedule) {
    return (
      <div className="space-y-6">
        <div 
          className="px-6 py-4 rounded-lg"
          style={{ backgroundColor: lineamientos?.visualSettings?.form_bg_color || "#00804E" }}
        >
           <h1 className="text-xl font-bold text-primary-foreground">{t("schedule.title")}</h1>
          {displayName && (
            <p className="text-sm text-primary-foreground/80 mt-1">
              {t("form.docente")}: {displayName}
            </p>
          )}
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarX className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {canOpenBuilder ? t("schedule.unlockedHint") : t("schedule.noSchedule")}
            </p>
            {canOpenBuilder && (
              <Button onClick={() => navigate("/schedule")} className="gap-2">
                {t("schedule.openBuilder")}
              </Button>
            )}
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
        {displayName && (
          <p className="text-sm text-primary-foreground/80 mt-1">
            {t("form.docente")}: {displayName}
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
                          <div
                            className="rounded px-1.5 py-1 text-[10px] leading-tight font-medium h-full flex items-center border-2"
                            style={blockColorStyles(resolveBlockColor(block.subfunctionId, block.color))}
                          >
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
  const { activeSubfunction, records, dropdownOptions, addDropdownOption, addRecord, upsertRecord, updateRecord, getRecordsBySubfunction, hasSchedule, getSchedule, editingRecord, setEditingRecord, selectedDocente, isAgendaReadOnly, canAccessScheduleDistribution: scheduleUnlocked } = useAgenda();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { data: lineamientos } = useActiveLineamientos();
  const isOwnAgenda = selectedDocente?.id === user?.id;
  const { data: ownAgendaView } = useAgendaView(isOwnAgenda ? user?.id : undefined);
  const readOnlyBannerText = useMemo(() => {
    if (!isAgendaReadOnly) return "";
    if (
      isOwnAgenda &&
      (ownAgendaView?.status === "approved" || ownAgendaView?.status === "pending")
    ) {
      return t("form.readOnlyOwnLocked");
    }
    return t("form.readOnlyBanner");
  }, [isAgendaReadOnly, isOwnAgenda, ownAgendaView?.status, t]);

  const displayName = selectedDocente && selectedDocente.firstName !== "Yo"
    ? [selectedDocente.firstName, selectedDocente.secondName, selectedDocente.firstLastName].filter(Boolean).join(' ')
    : user ? [user.firstName, user.firstLastName].filter(Boolean).join(' ') : '';
  const resolvedId = subfunctionId || activeSubfunction;
  const [formData, setFormData] = useState<{ [key: string]: string | number }>(() => {
    return formDataStore[resolvedId] || {};
  });
  const [newOptionCategory, setNewOptionCategory] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastUpsertRef = useRef<string>("");
  const lastProcessedSubjectRef = useRef<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [activityComboboxOpen, setActivityComboboxOpen] = useState<string | null>(null);
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

  // Dynamic recommendations based on records
  const recommendation = useRecommendations(records, user?.rolId);

  // Check if this form is blocked by "Estudios doctorado"
  const formBlocked = isFormBlockedByDoctorado(records, resolvedId);

  // Get blocked activities for filtering dropdowns
  const blockedActivities = useMemo(() => {
    if (resolvedId === "investigacion") return getBlockedInvestigationActivities(records);
    if (resolvedId === "administrativas") return getBlockedAdminActivities(records);
    if (resolvedId === "formacion-docentes") return getBlockedFormacionActivities(records);
    return new Set<string>();
  }, [records, resolvedId]);

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

    const hasMultiple = subjects.length > 1;
    const subjectChanged = selectedSubjectName !== lastProcessedSubjectRef.current;

    // If the subject just changed and has multiple variants, ALWAYS clear program and derived
    // fields so the user must explicitly pick a program ("Seleccionar...").
    if (subjectChanged && hasMultiple) {
      lastProcessedSubjectRef.current = selectedSubjectName;
      setFormData((prev) => ({
        ...prev,
        programa: "",
        facultad: "",
        semestre: "",
        nivel: "",
        horasSemana: "",
        cantidadSemanas: "",
      }));
      return;
    }

    // Mark as processed (single-variant case, or multi-variant with program already chosen)
    lastProcessedSubjectRef.current = selectedSubjectName;


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
      if (!isAgendaReadOnly) {
        setEditingRecordId(editingRecord.id);
        lastUpsertRef.current = JSON.stringify({ resolvedId, data: editingRecord.data, total: editingRecord.totalHoras });
      }
      setEditingRecord(null);
    }
  }, [editingRecord, resolvedId, setEditingRecord, isAgendaReadOnly]);

  // Auto-upsert when all fields are filled; instant for docencia-directa, debounced for others
  useEffect(() => {
    if (!config || resolvedId === "distribucion-horaria") return;
    if (isAgendaReadOnly) return;

    const allFilled = inputFields.every((f) => {
      if (f.type === "number") return Number(formData[f.name]) > 0;
      if (f.type === "dropdown") return !!formData[f.name];
      return true;
    });

    if (!allFilled) return;

    const total = computeTotal(formData);
    const sig = JSON.stringify({ resolvedId, data: formData, total });
    if (sig === lastUpsertRef.current) return;

    const doSave = () => {
      lastUpsertRef.current = "";

      if (editingRecordId) {
        updateRecord(editingRecordId, { ...formData }, total);
        toast.success(t("form.updatedRecord"));
      } else {
        const allowDuplicates = ["investigacion", "administrativas"];
        if (allowDuplicates.includes(resolvedId)) {
          addRecord({ subfunctionId: resolvedId, data: { ...formData }, totalHoras: total });
          toast.success(t("form.savedRecord"));
        } else {
          const existingRecords = getRecordsBySubfunction(resolvedId);
          const stringValues = Object.entries(formData)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => `${k}=${v}`);
            
          const isDuplicate = stringValues.length > 0 && existingRecords.some((r) => {
            const rStringValues = Object.entries(r.data)
              .filter(([, v]) => typeof v === "string")
              .map(([k, v]) => `${k}=${v}`);
            return stringValues.length === rStringValues.length && stringValues.every((sv) => rStringValues.includes(sv));
          });

          upsertRecord(resolvedId, { ...formData }, total);
          
          if (isDuplicate) {
            toast.error(t("form.duplicateRecord"));
          } else {
            toast.success(t("form.savedRecord"));
          }
        }
      }

      setFormData({});
      formDataStore[resolvedId] = {};
      setEditingRecordId(null);
    };

    // Docencia directa: instant save (no debounce)
    const TRIGGER_FIELDS = ["horasSemana", "cantidadEstudiantes", "cantidadProyectos"];
    const hasMultiDigit = inputFields.some(
      (f) =>
        f.type === "number" &&
        TRIGGER_FIELDS.includes(f.name) &&
        String(formData[f.name] ?? "").length >= 2
    );

    if (resolvedId === "docencia-directa" || hasMultiDigit) {
      doSave();
      return;
    }

    // Other forms: 800ms debounce for single-digit typing
    const timer = setTimeout(doSave, 800);
    return () => clearTimeout(timer);
  }, [formData, resolvedId, config, inputFields, computeTotal, addRecord, upsertRecord, updateRecord, editingRecordId]);

  const handleClearForm = () => {
    setFormData({});
    formDataStore[resolvedId] = {};
    setEditingRecordId(null);
    lastUpsertRef.current = "";
  };

  if (!config) return null;

  if (resolvedId === "distribucion-horaria") {
    const canOpenBuilder =
      isOwnAgenda && scheduleUnlocked && canAccessScheduleDistribution(ownAgendaView, user?.rolId);
    return (
      <ScheduleReadOnlyView
        hasSchedule={hasSchedule}
        getSchedule={getSchedule}
        displayName={displayName}
        canOpenBuilder={!!canOpenBuilder}
      />
    );
  }

  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    addDropdownOption(newOptionCategory, newOptionValue.trim());
    setNewOptionValue("");
    setDialogOpen(false);
    toast.success(t("form.optionAdded"));
  };

  // If form is blocked by Estudios doctorado, show blocked message
  if (formBlocked) {
    return (
      <div className="space-y-6">
        <div 
          className="px-6 py-4 rounded-lg"
          style={{ backgroundColor: lineamientos?.visualSettings?.form_bg_color || "#00804E" }}
        >
          <h1 className="text-xl font-bold text-primary-foreground">{t(config.titleKey || config.title)}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lock className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center font-medium">
              Este formulario está bloqueado porque se ha registrado "Estudios doctorado" en Formación de docentes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div 
        className="px-6 py-4 rounded-lg flex items-center justify-between"
        style={{ backgroundColor: lineamientos?.visualSettings?.form_bg_color || "#00804E" }}
      >
        <div>
          <h1 className="text-xl font-bold text-primary-foreground">{t(config.titleKey || config.title)}</h1>
          {displayName && (
            <p className="text-sm text-primary-foreground/80 mt-1">
              {t("form.docente")}: {displayName}
            </p>
          )}
        </div>
        {!isAgendaReadOnly && (
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
        )}
      </div>

      {isAgendaReadOnly && (
        <div className="px-4 py-2 rounded-md bg-muted border border-border text-xs text-muted-foreground flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          {readOnlyBannerText}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAgendaReadOnly ? t("form.viewing") : (editingRecordId ? t("form.editing") : t("form.record"))}
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
              const isReadOnly = readOnlyFields.includes(field.name) || isAgendaReadOnly;

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
                                disabled={isAgendaReadOnly}
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
                          {!isAgendaReadOnly && (
                            <>
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
                          )}
                        </>
                      ) : (
                        <>
                          {(() => {
                            const SEARCHABLE_CATEGORIES = new Set([
                              "tipo_trabajo",
                              "actividad_practicas",
                              "actividad_indirecta",
                              "actividad_investigacion",
                              "actividad_proyeccion",
                              "actividad_complementaria",
                              "actividad_formacion",
                              "actividad_administrativa",
                            ]);
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

                            // Searchable activity/work-type combobox
                            if (SEARCHABLE_CATEGORIES.has(field.category!)) {
                              const dbData = DB_CATEGORY_MAP[field.category!] || [];
                              const shouldFilter = ["actividad_investigacion", "actividad_administrativa", "actividad_formacion"].includes(field.category!);
                              const filtered = shouldFilter
                                ? dbData.filter((item: any) => !blockedActivities.has(item.name))
                                : dbData;
                              const isOpen = activityComboboxOpen === field.name;
                              return (
                                <Popover open={isOpen} onOpenChange={(o) => setActivityComboboxOpen(o ? field.name : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={isOpen}
                                      disabled={isAgendaReadOnly}
                                      className="flex-1 justify-between font-normal h-auto min-h-10 whitespace-normal text-left"
                                    >
                                      {formData[field.name]
                                        ? translateOption(String(formData[field.name]), language)
                                        : t("form.select")}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder={t("form.filterType")} />
                                      <CommandList>
                                        <CommandEmpty>{t("form.noSubjects")}</CommandEmpty>
                                        <CommandGroup>
                                          {filtered.map((item: any) => (
                                            <CommandItem
                                              key={item.id}
                                              value={item.name}
                                              onSelect={(value) => {
                                                setFormData((p) => ({ ...p, [field.name]: value }));
                                                setActivityComboboxOpen(null);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  String(formData[field.name]).toLowerCase() === item.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {translateOption(item.name, language)}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );
                            }

                            // Searchable combobox for "programa" category (carreras profesionales)
                            if (field.category === "programa") {
                              const allCareers = dbProfessionalCareers || [];
                              const careerOptions = (hasMultipleVariants && resolvedId === "docencia-directa")
                                ? allCareers.filter((c) => filteredCareerIds.has(c.id))
                                : allCareers;
                              const isOpen = activityComboboxOpen === field.name;
                              return (
                                <Popover open={isOpen} onOpenChange={(o) => setActivityComboboxOpen(o ? field.name : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={isOpen}
                                      disabled={isAgendaReadOnly}
                                      className="flex-1 justify-between font-normal h-auto min-h-10 whitespace-normal text-left"
                                    >
                                      {formData[field.name]
                                        ? translateOption(String(formData[field.name]), language)
                                        : t("form.select")}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder={t("form.filterType")} />
                                      <CommandList>
                                        <CommandEmpty>{t("form.noSubjects")}</CommandEmpty>
                                        <CommandGroup>
                                          {careerOptions.map((c) => (
                                            <CommandItem
                                              key={c.id}
                                              value={c.name}
                                              onSelect={(value) => {
                                                setFormData((p) => ({ ...p, [field.name]: value }));
                                                setActivityComboboxOpen(null);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  String(formData[field.name]).toLowerCase() === c.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {translateOption(c.name, language)}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );
                            }

                            // Default: plain Select for facultad/semestre/jornada/nivel and custom dropdowns
                            return (
                              <Select
                                value={String(formData[field.name] || "")}
                                onValueChange={(v) => setFormData((p) => ({ ...p, [field.name]: v }))}
                                disabled={isAgendaReadOnly}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder={t("form.select")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const dbData = DB_CATEGORY_MAP[field.category!];
                                    if (dbData) {
                                      return dbData.map((item: any) => (
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
                            );
                          })()}
                          {(() => {
                            if (isAgendaReadOnly) return null;
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
                      disabled={isAgendaReadOnly}
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

      {/* Mensajes recomendativos dinámicos - docencia directa */}
      {resolvedId === "docencia-directa" && (
        <div className="space-y-1 px-2">
          <div className="flex justify-end">
            <p className="text-sm text-muted-foreground font-medium">
              {t("recommendation.hours", { hours: recommendation.hours })}
            </p>
          </div>
          <div className="flex justify-end">
            <p className="text-sm text-muted-foreground font-medium">
              {t("recommendation.subjects", { hours: recommendation.subjects })}
            </p>
          </div>
        </div>
      )}

      {/* Mensaje recomendativo de asesorías para trabajos de grado y prácticas académicas */}
      {(resolvedId === "trabajos-grado" || resolvedId === "practicas-academicas") && (
        <div className="flex justify-end px-2">
          <p className="text-sm text-muted-foreground font-medium">
            {t("recommendation.advisories", { 
              count: Math.max(0, (lineamientos?.docenciaIndirecta?.maxTrabajosGrado || 4) - (getRecordsBySubfunction("trabajos-grado").length + getRecordsBySubfunction("practicas-academicas").length)) 
            })}
          </p>
        </div>
      )}
    </div>
  );
}
