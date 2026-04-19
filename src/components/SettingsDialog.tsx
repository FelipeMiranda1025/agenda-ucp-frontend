import { useEffect, useState } from "react";
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
  useUpdateRecommendationRule,
  useResetRecommendationRules,
  useToggleRecommendationRuleActive,
  useCreateRecommendationRule,
  RecommendationRule,
} from "@/hooks/useRecommendationRules";
import { Loader2, RotateCcw, Save, Eye, EyeOff, Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Edits = Record<string, { hours: number; subjects: number }>;
type Category = RecommendationRule["category"];

export function SettingsDialog({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { data: rules, isLoading } = useRecommendationRules();
  const updateRule = useUpdateRecommendationRule();
  const resetRules = useResetRecommendationRules();
  const toggleActive = useToggleRecommendationRuleActive();
  const createRule = useCreateRecommendationRule();

  const [edits, setEdits] = useState<Edits>({});
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("investigacion");
  const [addingFor, setAddingFor] = useState<Category | null>(null);
  const [newRule, setNewRule] = useState({ label: "", hours: 0, subjects: 0 });

  useEffect(() => {
    if (rules) {
      const initial: Edits = {};
      rules.forEach(r => { initial[r.id] = { hours: r.hours, subjects: r.subjects }; });
      setEdits(initial);
    }
  }, [rules]);

  const grouped: Record<Category, RecommendationRule[]> = {
    investigacion: rules?.filter(r => r.category === "investigacion") ?? [],
    administrativas: rules?.filter(r => r.category === "administrativas") ?? [],
    formacion: rules?.filter(r => r.category === "formacion") ?? [],
  };

  const updateEdit = (id: string, field: "hours" | "subjects", value: number) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSaveAll = async () => {
    if (!rules) return;
    const changed = rules.filter(r => {
      const e = edits[r.id];
      return e && (e.hours !== r.hours || e.subjects !== r.subjects);
    });
    if (changed.length === 0) {
      toast({ title: t("settings.noChanges") });
      return;
    }
    try {
      for (const r of changed) {
        const e = edits[r.id];
        await updateRule.mutateAsync({ id: r.id, hours: e.hours, subjects: e.subjects });
      }
      toast({ title: t("settings.saved") });
    } catch {
      toast({ title: t("settings.saveError"), variant: "destructive" });
    }
  };

  const handleReset = async () => {
    if (!confirm(t("settings.resetConfirm"))) return;
    try {
      await resetRules.mutateAsync();
      toast({ title: t("settings.resetDone") });
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
        <div className="flex items-center justify-between gap-2">
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

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>

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
            <TabsContent value="investigacion" className="mt-4">{renderRules("investigacion", grouped.investigacion)}</TabsContent>
            <TabsContent value="administrativas" className="mt-4">{renderRules("administrativas", grouped.administrativas)}</TabsContent>
            <TabsContent value="formacion" className="mt-4">{renderRules("formacion", grouped.formacion)}</TabsContent>
          </Tabs>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetRules.isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t("settings.reset")}
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={updateRule.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {t("settings.saveAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
