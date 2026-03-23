import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateOption } from "@/i18n/optionTranslations";
import { toast } from "sonner";

/**
 * Configuration for each activity table type.
 * "standard" tables have: name, weekly_hours, number_weeks
 * "degree_works" has: name, number_projects, number_weeks
 * "academic_practices" has: name, number_students, number_weeks
 */
export type ActivityTableType =
  | "indirect_teaching"
  | "degree_works"
  | "academic_practices"
  | "investigations"
  | "social_projects"
  | "complementary_activities"
  | "teacher_training"
  | "administrative_activities";

interface ActivityForm {
  name: string;
  field1: string; // weekly_hours | number_projects | number_students
  number_weeks: string;
}

const emptyForm: ActivityForm = { name: "", field1: "", number_weeks: "" };

type Mode = "list" | "add" | "edit" | "delete";

interface TableConfig {
  queryKey: string;
  field1Key: string;       // DB column name
  field1Label: string;     // translation key
  field1IsNullable: boolean;
  titleKey: string;        // translation key for dialog title
}

const TABLE_CONFIGS: Record<ActivityTableType, TableConfig> = {
  indirect_teaching: {
    queryKey: "indirect_teaching",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.indirect_teaching",
  },
  degree_works: {
    queryKey: "degree_works",
    field1Key: "number_projects",
    field1Label: "field.cantidadProyectos",
    field1IsNullable: true,
    titleKey: "activity.manage.degree_works",
  },
  academic_practices: {
    queryKey: "academic_practices",
    field1Key: "number_students",
    field1Label: "field.cantidadEstudiantes",
    field1IsNullable: false,
    titleKey: "activity.manage.academic_practices",
  },
  investigations: {
    queryKey: "investigations",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.investigations",
  },
  social_projects: {
    queryKey: "social_projects",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.social_projects",
  },
  complementary_activities: {
    queryKey: "complementary_activities",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.complementary_activities",
  },
  teacher_training: {
    queryKey: "teacher_training",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.teacher_training",
  },
  administrative_activities: {
    queryKey: "administrative_activities",
    field1Key: "weekly_hours",
    field1Label: "field.horasSemana",
    field1IsNullable: false,
    titleKey: "activity.manage.administrative_activities",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableType: ActivityTableType;
  items: any[] | undefined;
}

export function ActivityManagementDialog({ open, onOpenChange, tableType, items }: Props) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const config = TABLE_CONFIGS[tableType];

  const [mode, setMode] = useState<Mode>("list");
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityForm, string>>>({});
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
    const e: Partial<Record<keyof ActivityForm, string>> = {};
    if (!form.name.trim()) e.name = t("activity.nameRequired");
    if (form.name.length > 200) e.name = t("subject.nameMax");
    
    if (!config.field1IsNullable) {
      const v = Number(form.field1);
      if (!form.field1 || !Number.isFinite(v) || v < 0) e.field1 = t("activity.fieldInvalid");
    }
    
    const nw = Number(form.number_weeks);
    if (!form.number_weeks || !Number.isInteger(nw) || nw < 1) e.number_weeks = t("subject.weeksInvalid");
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadItemIntoForm = (id: number) => {
    const item = items?.find((x: any) => x.id === id);
    if (!item) return;
    setForm({
      name: item.name,
      field1: item[config.field1Key]?.toString() || "",
      number_weeks: item.number_weeks.toString(),
    });
    setEditingId(id);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    
    const payload: any = {
      name: form.name.trim(),
      number_weeks: Number(form.number_weeks),
    };
    
    if (config.field1IsNullable) {
      payload[config.field1Key] = form.field1 ? Number(form.field1) : null;
    } else {
      payload[config.field1Key] = Number(form.field1);
    }

    let error;
    if (mode === "edit" && editingId) {
      ({ error } = await supabase.from(tableType as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from(tableType as any).insert(payload));
    }

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "edit" ? t("activity.updated") : t("activity.added"));
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    setMode("list");
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setLoading(true);
    const { error } = await supabase.from(tableType as any).delete().eq("id", editingId);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("activity.deleted"));
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    setMode("list");
    setForm(emptyForm);
    setEditingId(null);
  };

  const filteredItems = items?.filter((item: any) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderForm = (readOnly: boolean) => (
    <div className="space-y-4 pt-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("activity.name")} *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          maxLength={200}
          disabled={readOnly}
          placeholder={t("activity.name")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Field 1 (weekly_hours / number_projects / number_students) */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {t(config.field1Label)} {!config.field1IsNullable && "*"}
          </Label>
          <Input
            type="number"
            min={0}
            value={form.field1}
            onChange={(e) => setForm((f) => ({ ...f, field1: e.target.value }))}
            disabled={readOnly}
            placeholder="0"
          />
          {errors.field1 && <p className="text-xs text-destructive">{errors.field1}</p>}
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
              {mode === "edit" ? t("subject.save") : t("activity.add")}
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
            {mode === "list" && t(config.titleKey)}
            {mode === "add" && t("activity.add")}
            {mode === "edit" && t("activity.edit")}
            {mode === "delete" && t("activity.delete")}
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
                <Plus className="h-4 w-4 mr-1" /> {t("activity.add")}
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1">
                {filteredItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{translateOption(item.name, language)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(config.field1Label)}: {item[config.field1Key] ?? "—"} | {t("field.cantidadSemanas")}: {item.number_weeks}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { loadItemIntoForm(item.id); setMode("edit"); setErrors({}); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => { loadItemIntoForm(item.id); setMode("delete"); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredItems?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("activity.noItems")}</p>
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
