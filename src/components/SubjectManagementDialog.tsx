import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSemesters, useFaculties, useEducationLevels, useProfessionalCareers, useSubjects } from "@/hooks/useDatabase";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateOption } from "@/i18n/optionTranslations";
import { toast } from "sonner";

interface SubjectForm {
  name: string;
  id_semester: string;
  id_faculty: string;
  id_professional_career: string;
  id_education_level: string;
  id_state: string;
  weekly_hours: string;
  number_weeks: string;
}

const emptyForm: SubjectForm = {
  name: "",
  id_semester: "",
  id_faculty: "",
  id_professional_career: "",
  id_education_level: "",
  id_state: "",
  weekly_hours: "",
  number_weeks: "",
};

type Mode = "list" | "add" | "edit" | "delete";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubjectManagementDialog({ open, onOpenChange }: Props) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: subjects } = useSubjects();
  const { data: semesters } = useSemesters();
  const { data: faculties } = useFaculties();
  const { data: educationLevels } = useEducationLevels();
  const { data: careers } = useProfessionalCareers();

  const [mode, setMode] = useState<Mode>("list");
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SubjectForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (open) {
      setMode("list");
      setForm(emptyForm);
      setEditingId(null);
      setErrors({});
      setSearchFilter("");
    }
  }, [open]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof SubjectForm, string>> = {};
    if (!form.name.trim()) e.name = t("subject.nameRequired");
    if (form.name.length > 200) e.name = t("subject.nameMax");
    const wh = Number(form.weekly_hours);
    if (!form.weekly_hours || !Number.isInteger(wh) || wh < 1) e.weekly_hours = t("subject.hoursInvalid");
    const nw = Number(form.number_weeks);
    if (!form.number_weeks || !Number.isInteger(nw) || nw < 1) e.number_weeks = t("subject.weeksInvalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadSubjectIntoForm = (subjectId: number) => {
    const s = subjects?.find((x) => x.id === subjectId);
    if (!s) return;
    setForm({
      name: s.name,
      id_semester: s.id_semester?.toString() || "",
      id_faculty: s.id_faculty?.toString() || "",
      id_professional_career: s.id_professional_career?.toString() || "",
      id_education_level: s.id_education_level?.toString() || "",
      id_state: s.id_state?.toString() || "",
      weekly_hours: s.weekly_hours.toString(),
      number_weeks: s.number_weeks.toString(),
    });
    setEditingId(subjectId);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      id_semester: form.id_semester ? Number(form.id_semester) : null,
      id_faculty: form.id_faculty ? Number(form.id_faculty) : null,
      id_professional_career: form.id_professional_career ? Number(form.id_professional_career) : null,
      id_education_level: form.id_education_level ? Number(form.id_education_level) : null,
      id_state: form.id_state ? Number(form.id_state) : null,
      weekly_hours: Number(form.weekly_hours),
      number_weeks: Number(form.number_weeks),
    };

    // Check for duplicate name+faculty+career
    const duplicate = subjects?.find(
      (s) =>
        s.name.toLowerCase() === payload.name.toLowerCase() &&
        s.id_faculty === payload.id_faculty &&
        s.id_professional_career === payload.id_professional_career &&
        (mode !== "edit" || s.id !== editingId)
    );
    if (duplicate) {
      setLoading(false);
      toast.error(t("subject.alreadyExists"));
      return;
    }

    let error;
    if (mode === "edit" && editingId) {
      ({ error } = await supabase.from("subjects").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("subjects").insert(payload));
    }

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "edit" ? t("subject.updated") : t("subject.added"));
    queryClient.invalidateQueries({ queryKey: ["subjects"] });
    setMode("list");
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setLoading(true);
    const { error } = await supabase.from("subjects").delete().eq("id", editingId);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("subject.deleted"));
    queryClient.invalidateQueries({ queryKey: ["subjects"] });
    setMode("list");
    setForm(emptyForm);
    setEditingId(null);
  };

  const filteredSubjects = subjects?.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderForm = (readOnly: boolean) => (
    <div className="space-y-4 pt-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("subject.name")} *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          maxLength={200}
          disabled={readOnly}
          placeholder={t("subject.name")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Semester */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.semestre")}</Label>
          <Select
            value={form.id_semester}
            onValueChange={(v) => setForm((f) => ({ ...f, id_semester: v }))}
            disabled={readOnly}
          >
            <SelectTrigger><SelectValue placeholder={t("form.select")} /></SelectTrigger>
            <SelectContent>
              {semesters?.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Faculty */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.facultad")}</Label>
          <Select
            value={form.id_faculty}
            onValueChange={(v) => setForm((f) => ({ ...f, id_faculty: v }))}
            disabled={readOnly}
          >
            <SelectTrigger><SelectValue placeholder={t("form.select")} /></SelectTrigger>
            <SelectContent>
              {faculties?.map((f) => (
                <SelectItem key={f.id} value={f.id.toString()}>{translateOption(f.name, language)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Program */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.programa")}</Label>
          <Select
            value={form.id_professional_career}
            onValueChange={(v) => setForm((f) => ({ ...f, id_professional_career: v }))}
            disabled={readOnly}
          >
            <SelectTrigger><SelectValue placeholder={t("form.select")} /></SelectTrigger>
            <SelectContent>
              {careers?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{translateOption(c.name, language)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Education Level */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.nivel")}</Label>
          <Select
            value={form.id_education_level}
            onValueChange={(v) => setForm((f) => ({ ...f, id_education_level: v }))}
            disabled={readOnly}
          >
            <SelectTrigger><SelectValue placeholder={t("form.select")} /></SelectTrigger>
            <SelectContent>
              {educationLevels?.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>{translateOption(l.name, language)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Hours */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.horasSemana")} *</Label>
          <Input
            type="number"
            min={1}
            value={form.weekly_hours}
            onChange={(e) => setForm((f) => ({ ...f, weekly_hours: e.target.value }))}
            disabled={readOnly}
            placeholder="0"
          />
          {errors.weekly_hours && <p className="text-xs text-destructive">{errors.weekly_hours}</p>}
        </div>

        {/* Number of Weeks */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("field.cantidadSemanas")} *</Label>
          <Input
            type="number"
            min={1}
            value={form.number_weeks}
            onChange={(e) => setForm((f) => ({ ...f, number_weeks: e.target.value }))}
            disabled={readOnly}
            placeholder="0"
          />
          {errors.number_weeks && <p className="text-xs text-destructive">{errors.number_weeks}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {mode === "delete" ? (
          <>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
              {t("subject.confirmDelete")}
            </Button>
            <Button variant="outline" onClick={() => { setMode("list"); setForm(emptyForm); setEditingId(null); }} className="flex-1">
              {t("subject.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {mode === "edit" ? t("subject.save") : t("subject.add")}
            </Button>
            <Button variant="outline" onClick={() => { setMode("list"); setForm(emptyForm); setEditingId(null); setErrors({}); }} className="flex-1">
              {t("subject.cancel")}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "list" && t("subject.manage")}
            {mode === "add" && t("subject.add")}
            {mode === "edit" && t("subject.edit")}
            {mode === "delete" && t("subject.delete")}
          </DialogTitle>
        </DialogHeader>

        {mode === "list" ? (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex gap-2">
              <Input
                placeholder={t("form.filterType")}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => { setMode("add"); setForm(emptyForm); setErrors({}); }} size="sm">
                <Plus className="h-4 w-4 mr-1" /> {t("subject.add")}
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1">
                {filteredSubjects?.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{translateOption(subject.name, language)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("field.horasSemana")}: {subject.weekly_hours} | {t("field.cantidadSemanas")}: {subject.number_weeks}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { loadSubjectIntoForm(subject.id); setMode("edit"); setErrors({}); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => { loadSubjectIntoForm(subject.id); setMode("delete"); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredSubjects?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("form.noSubjects")}</p>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="max-h-[65vh]">
            {renderForm(mode === "delete")}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
