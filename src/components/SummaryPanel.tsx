import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { subfunctions } from "@/data/subfunctions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CheckCircle, ClipboardList, Trash2 } from "lucide-react";
import { AgendaComments } from "@/components/AgendaComments";
import { useAgendas } from "@/hooks/useDatabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { translateOption } from "@/i18n/optionTranslations";

export function SummaryPanel() {
  const { records, metricas, horasSemestreDefecto, setHorasSemestreDefecto, setActiveSubfunction, setEditingRecord, deleteRecord } = useAgenda();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { data: savedAgendas = [] } = useAgendas(user?.id);

  const grouped = subfunctions
    .filter((sf) => sf.sectionId !== "horario")
    .map((sf) => ({
      ...sf,
      records: records.filter((r) => r.subfunctionId === sf.id),
    }))
    .filter((g) => g.records.length > 0);

  const handleConfirm = () => {
    const tieneInvestigacion = records.some(r => r.subfunctionId === "investigacion");

    if (!tieneInvestigacion) {
      const docDirectaRecords = records.filter(r => r.subfunctionId === "docencia-directa");
      const horasSemanalesDocDirecta = docDirectaRecords.reduce(
        (sum, r) => sum + (Number(r.data["horasSemana"]) || 0), 0
      );
      if (horasSemanalesDocDirecta !== 16) {
        toast.error(
          t("validation.16hours", { hours: horasSemanalesDocDirecta }),
          { duration: 6000 }
        );
        return;
      }
    }

    const total = metricas.totalHorasSemestrales;
    if (total > horasSemestreDefecto) {
      const exceso = total - horasSemestreDefecto;
      const sugerencias = [...grouped]
        .sort((a, b) =>
          b.records.reduce((s, r) => s + r.totalHoras, 0) -
          a.records.reduce((s, r) => s + r.totalHoras, 0)
        )
        .slice(0, 2)
        .map(g => g.shortTitle);
      toast.error(
        t("validation.exceeds", { max: horasSemestreDefecto, excess: exceso, suggestions: sugerencias.join(", ") }),
        { duration: 7000 }
      );
      return;
    }
    if (total < horasSemestreDefecto) {
      toast.error(
        t("validation.missing", { missing: horasSemestreDefecto - total, max: horasSemestreDefecto }),
        { duration: 6000 }
      );
      return;
    }

    navigate("/schedule");
  };

  const scrollToSection = (subfunctionId: string) => {
    setActiveSubfunction(subfunctionId);
    const el = document.getElementById(`section-${subfunctionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRecordClick = (record: typeof records[0]) => {
    setEditingRecord(record);
    scrollToSection(record.subfunctionId);
  };

  return (
    <div className="w-96 shrink-0 flex flex-col bg-background border-l pt-6">
      <div className="px-4 py-3 border-b bg-ucp-red">
        <h2 className="text-sm font-bold text-primary-foreground">{t("summary.title")}</h2>
        {user && (
          <p className="text-xs text-primary-foreground/80 mt-0.5">
            {[user.firstName, user.firstLastName].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-3 bg-white dark:bg-[#1f1f1f]">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm text-center">{t("summary.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.id}>
                <h3
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => scrollToSection(group.id)}
                >
                  {t(group.shortTitleKey || group.shortTitle)}
                </h3>
                {group.records.map((record, i) => {
                  const rawLabel = Object.values(record.data).find((v) => typeof v === "string") || `${t("form.record")} ${i + 1}`;
                  const label = translateOption(String(rawLabel), language);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-1 text-sm border-b border-border/50 last:border-0 cursor-pointer hover:bg-accent/50 rounded px-1 transition-colors group"
                      onClick={() => handleRecordClick(record)}
                    >
                      <span className="flex-1 text-foreground break-words line-clamp-2" title={String(label)}>{String(label)}</span>
                      <span className="font-semibold text-primary ml-2">{record.totalHoras}h</span>
                      <button
                        className="ml-1 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecord(record.id);
                        }}
                        title={t("summary.deleteRecord")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                <div className="text-right text-xs font-medium text-muted-foreground mt-1">
                  {t("summary.subtotal")}: {group.records.reduce((s, r) => s + r.totalHoras, 0)}h
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t px-4 pt-3 pb-1 space-y-1 text-sm bg-white dark:bg-[#1f1f1f]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("summary.totalSemestral")}</span>
          <span className="font-bold">{metricas.totalHorasSemestrales}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("summary.avgWeek")}</span>
          <span className="font-bold">{metricas.promedioHorasSemana.toFixed(1)}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("summary.missing")}</span>
          <span className={`font-bold ${metricas.horasFaltantes > 0 ? 'text-destructive' : metricas.horasFaltantes < 0 ? 'text-yellow-500' : 'text-primary'}`}>{metricas.horasFaltantes}h</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-muted-foreground">{t("summary.defaultHours")}</span>
          <Input
            type="number"
            min={1}
            className="w-20 h-7 text-sm"
            value={horasSemestreDefecto}
            onChange={(e) => setHorasSemestreDefecto(Number(e.target.value) || 920)}
          />
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleConfirm}
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <CheckCircle className="h-4 w-4" />
          {t("summary.confirm")}
        </Button>
      </div>
    </div>
  );
}
