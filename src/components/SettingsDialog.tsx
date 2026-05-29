import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  useRecommendationRules,
  useBulkSaveRecommendationRules,
  useResetRecommendationRules,
  useToggleRecommendationRuleActive,
  useCreateRecommendationRule,
  RecommendationRule,
} from "@/hooks/useRecommendationRules";
import { Loader2, RotateCcw, Save, Eye, EyeOff, Plus, X } from "lucide-react";
import { LineamientosImportSection } from "@/components/LineamientosImportSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Edits = Record<string, { hours: number; subjects: number }>;
type Category = RecommendationRule["category"];

export function SettingsDialog({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { data: rules, isLoading, refetch } = useRecommendationRules(open);
  const bulkSave = useBulkSaveRecommendationRules();
  const resetRules = useResetRecommendationRules();
  const toggleActive = useToggleRecommendationRuleActive();
  const createRule = useCreateRecommendationRule();

  const [edits, setEdits] = useState<Edits>({});
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("investigacion");
  const [addingFor, setAddingFor] = useState<Category | null>(null);
  const [newRule, setNewRule] = useState({ label: "", hours: 0, subjects: 0 });
  const [hasValidImportContext, setHasValidImportContext] = useState(false);
  useEffect(() => {
    if (open) void refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (rules) {
      const initial: Edits = {};
      rules.forEach(r => {
        initial[r.id] = { hours: Number(r.hours), subjects: Number(r.subjects) };
      });
      setEdits(initial);
    }
  }, [rules]);

  const grouped: Record<Category, RecommendationRule[]> = {
    investigacion: rules?.filter(r => r.category === "investigacion") ?? [],
    administrativas: rules?.filter(r => r.category === "administrativas") ?? [],
    formacion: rules?.filter(r => r.category === "formacion") ?? [],
  };

  const hasManualNumericEdits = useMemo(() => {
    if (!rules?.length) return false;
    return rules.some(r => {
      const e = edits[r.id];
      if (!e) return false;
      return Number(e.hours) !== Number(r.hours) || Number(e.subjects) !== Number(r.subjects);
    });
  }, [rules, edits]);

  // Buttons must be available only after a valid import in current session
  // or when user is manually editing/adding.
  const canUsePersistenceButtons = hasValidImportContext || hasManualNumericEdits || addingFor !== null;

  const updateEdit = (id: string, field: "hours" | "subjects", value: number) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSaveAll = async () => {
    if (!rules?.length) return;

    const payload = rules.map(r => {
      const e = edits[r.id] ?? { hours: r.hours, subjects: r.subjects };
      return {
        id: r.id,
        hours: Number(e.hours),
        subjects: Number(e.subjects),
      };
    });

    const changed = rules.filter(r => {
      const e = edits[r.id];
      if (!e) return false;
      return Number(e.hours) !== Number(r.hours) || Number(e.subjects) !== Number(r.subjects);
    });

    try {
      if (changed.length === 0) {
        // Tras "Aplicar reglas" del PDF los valores ya están en BD; forzar sincronización al sistema.
        const result = await bulkSave.mutateAsync({ rules: payload, apply_to_system: true });
        toast({
          title: t("settings.syncedToSystem"),
          description: t("settings.rulesUpdated", { count: result.updated }),
        });
        await refetch();
        onOpenChange(false);
        return;
      }

      const result = await bulkSave.mutateAsync({ rules: payload });
      toast({
        title: t("settings.saved"),
        description: t("settings.rulesUpdated", { count: result.updated }),
      });
      await refetch();
      onOpenChange(false);
    } catch {
      toast({ title: t("settings.saveError"), variant: "destructive" });
    }
  };

  const handleReset = async () => {
    if (!confirm(t("settings.resetConfirm"))) return;
    try {
      await resetRules.mutateAsync();
      toast({ title: t("settings.resetDone") });
      await refetch();
    } catch {
      toast({ title: t("settings.saveError"), variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, active });
      toast({ title: t("settings.statusUpdated") });
    } catch {
      toast({ title: t("settings.saveError"), variant: "destructive" });
    }
  };

  const handleCreate = async (category: Category) => {
    if (!newRule.label.trim()) return;
    try {
      await createRule.mutateAsync({
        category,
        label: newRule.label.trim(),
        hours: newRule.hours,
        subjects: newRule.subjects,
      });
      toast({ title: t("settings.created") });
      setAddingFor(null);
      setNewRule({ label: "", hours: 0, subjects: 0 });
    } catch {
      toast({ title: t("settings.saveError"), variant: "destructive" });
    }
  };

  const renderRules = (category: Category, list: RecommendationRule[]) => {
    const visible = showInactive ? list : list.filter(r => r.active !== false);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive(v => !v)}
            className="gap-2"
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInactive ? t("settings.hideInactive") : t("settings.showInactive")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setAddingFor(category); setNewRule({ label: "", hours: 0, subjects: 0 }); }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("settings.addRule")}
          </Button>
        </div>

        {addingFor === category && (
          <div className="grid grid-cols-12 gap-3 items-end p-3 rounded-md border-2 border-dashed border-primary/40 bg-primary/5">
            <div className="col-span-12 md:col-span-6">
              <Label className="text-xs">{t("settings.newRuleLabel")}</Label>
              <Input
                value={newRule.label}
                onChange={e => setNewRule(p => ({ ...p, label: e.target.value }))}
                placeholder={t("settings.newRulePlaceholder")}
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label className="text-xs">{t("settings.hours")}</Label>
              <Input
                type="number"
                min={0}
                value={newRule.hours}
                onChange={e => setNewRule(p => ({ ...p, hours: Number(e.target.value) }))}
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label className="text-xs">{t("settings.subjects")}</Label>
              <Input
                type="number"
                min={0}
                value={newRule.subjects}
                onChange={e => setNewRule(p => ({ ...p, subjects: Number(e.target.value) }))}
              />
            </div>
            <div className="col-span-12 md:col-span-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCreate(category)}
                disabled={!newRule.label.trim() || createRule.isPending}
                className="flex-1"
              >
                {t("settings.create")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAddingFor(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {visible.map(rule => {
            const edit = edits[rule.id] ?? { hours: rule.hours, subjects: rule.subjects };
            const isInactive = rule.active === false;
            return (
              <div
                key={rule.id}
                className={`grid grid-cols-12 gap-3 items-end p-3 rounded-md border bg-card ${isInactive ? "opacity-60" : ""}`}
              >
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-xs text-muted-foreground">{t("settings.rule")}</Label>
                  <p className="text-sm font-medium leading-tight whitespace-normal break-words">{rule.label}</p>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label htmlFor={`h-${rule.id}`} className="text-xs">{t("settings.hours")}</Label>
                  <Input
                    id={`h-${rule.id}`}
                    type="number"
                    min={0}
                    value={edit.hours}
                    onChange={e => updateEdit(rule.id, "hours", Number(e.target.value))}
                    disabled={isInactive}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Label htmlFor={`s-${rule.id}`} className="text-xs">{t("settings.subjects")}</Label>
                  <Input
                    id={`s-${rule.id}`}
                    type="number"
                    min={0}
                    value={edit.subjects}
                    onChange={e => updateEdit(rule.id, "subjects", Number(e.target.value))}
                    disabled={isInactive}
                  />
                </div>
                <div className="col-span-12 md:col-span-2 flex flex-col items-start md:items-center gap-1">
                  <Label className="text-xs">{rule.active === false ? t("settings.inactive") : t("settings.active")}</Label>
                  <Switch
                    checked={rule.active !== false}
                    onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
                    disabled={toggleActive.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-6 pb-28">
            <LineamientosImportSection onValidImportContextChange={setHasValidImportContext} />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t("settings.manualEditTitle")}</h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Category)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="investigacion">{t("settings.investigacion")}</TabsTrigger>
                    <TabsTrigger value="administrativas">{t("settings.administrativas")}</TabsTrigger>
                    <TabsTrigger value="formacion">{t("settings.formacion")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="investigacion" className="mt-4 focus-visible:outline-none">
                    {renderRules("investigacion", grouped.investigacion)}
                  </TabsContent>
                  <TabsContent value="administrativas" className="mt-4 focus-visible:outline-none">
                    {renderRules("administrativas", grouped.administrativas)}
                  </TabsContent>
                  <TabsContent value="formacion" className="mt-4 focus-visible:outline-none">
                    {renderRules("formacion", grouped.formacion)}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-2 border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!canUsePersistenceButtons || resetRules.isPending || bulkSave.isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t("settings.reset")}
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={!canUsePersistenceButtons || bulkSave.isPending}
            className="gap-2"
          >
            {bulkSave.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("settings.saveAll")}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}
