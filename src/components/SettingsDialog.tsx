import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  useRecommendationRules,
  useUpdateRecommendationRule,
  useResetRecommendationRules,
  RecommendationRule,
} from "@/hooks/useRecommendationRules";
import { Loader2, RotateCcw, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Edits = Record<string, { hours: number; subjects: number }>;

export function SettingsDialog({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { data: rules, isLoading } = useRecommendationRules();
  const updateRule = useUpdateRecommendationRule();
  const resetRules = useResetRecommendationRules();
  const [edits, setEdits] = useState<Edits>({});

  useEffect(() => {
    if (rules) {
      const initial: Edits = {};
      rules.forEach(r => { initial[r.id] = { hours: r.hours, subjects: r.subjects }; });
      setEdits(initial);
    }
  }, [rules]);

  const grouped = {
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

  const renderRules = (list: RecommendationRule[]) => (
    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
      {list.map(rule => {
        const edit = edits[rule.id] ?? { hours: rule.hours, subjects: rule.subjects };
        return (
          <div key={rule.id} className="grid grid-cols-12 gap-3 items-end p-3 rounded-md border bg-card">
            <div className="col-span-12 md:col-span-6">
              <Label className="text-xs text-muted-foreground">{t("settings.rule")}</Label>
              <p className="text-sm font-medium leading-tight whitespace-normal break-words">{rule.label}</p>
            </div>
            <div className="col-span-6 md:col-span-3">
              <Label htmlFor={`h-${rule.id}`} className="text-xs">{t("settings.hours")}</Label>
              <Input
                id={`h-${rule.id}`}
                type="number"
                min={0}
                value={edit.hours}
                onChange={e => updateEdit(rule.id, "hours", Number(e.target.value))}
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
              />
            </div>
          </div>
        );
      })}
    </div>
  );

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
          <Tabs defaultValue="investigacion" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="investigacion">{t("settings.investigacion")}</TabsTrigger>
              <TabsTrigger value="administrativas">{t("settings.administrativas")}</TabsTrigger>
              <TabsTrigger value="formacion">{t("settings.formacion")}</TabsTrigger>
            </TabsList>
            <TabsContent value="investigacion" className="mt-4">{renderRules(grouped.investigacion)}</TabsContent>
            <TabsContent value="administrativas" className="mt-4">{renderRules(grouped.administrativas)}</TabsContent>
            <TabsContent value="formacion" className="mt-4">{renderRules(grouped.formacion)}</TabsContent>
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
