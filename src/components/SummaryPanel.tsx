import { useState } from "react";
import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { subfunctions } from "@/data/subfunctions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ClipboardList, Trash2, RotateCcw, ThumbsUp, Download } from "lucide-react";
import { useInsertAgendaComment, useAgendaView, useUpsertAgendaView, useUpdateAgendaViewStatus } from "@/hooks/useDatabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { translateOption } from "@/i18n/optionTranslations";
import { ConfirmSuccessDialog } from "@/components/ConfirmSuccessDialog";
import { DownloadAgendasDialog } from "@/components/DownloadAgendasDialog";
import { getDocenteFullName } from "@/types/docentePlanta";

export function SummaryPanel() {
  const { records, metricas, horasSemestreDefecto, setHorasSemestreDefecto, setActiveSubfunction, setEditingRecord, deleteRecord, selectedDocente, setSelectedDocente, docentesList, loadFromAgendaView, isAgendaReadOnly } = useAgenda();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const insertComment = useInsertAgendaComment();
  const { data: agendaView } = useAgendaView(user?.id);
  const upsertAgendaView = useUpsertAgendaView();
  const updateAgendaViewStatus = useUpdateAgendaViewStatus();

  // For subordinate review: get their agenda_view
  const isReviewingSubordinate = selectedDocente && selectedDocente.firstName !== "Yo";
  const subordinateCc = isReviewingSubordinate ? selectedDocente.id : undefined;
  const { data: subordinateAgendaView } = useAgendaView(subordinateCc);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogVariant, setDialogVariant] = useState<"success" | "pending">("success");
  const [returnObservation, setReturnObservation] = useState("");

  const grouped = subfunctions
    .filter((sf) => sf.sectionId !== "horario")
    .map((sf) => ({
      ...sf,
      records: records.filter((r) => r.subfunctionId === sf.id),
    }))
    .filter((g) => g.records.length > 0);

  const handleConfirm = async () => {
    const total = metricas.totalHorasSemestrales;
    if (total < 900 || total > 930) {
      if (total > 930) {
        const exceso = total - 930;
        toast.error(
          t("validation.exceeds", { max: 930, excess: exceso, suggestions: "" }),
          { duration: 7000 }
        );
      } else {
        const faltante = 900 - total;
        toast.error(
          t("validation.missing", { missing: faltante, max: 900 }),
          { duration: 6000 }
        );
      }
      return;
    }

    // Check if there's already a pending agenda view
    if (agendaView && agendaView.status === "pending") {
      setDialogVariant("pending");
      setDialogOpen(true);
      return;
    }

    // Save to agenda_views
    if (user?.id) {
      try {
        await upsertAgendaView.mutateAsync({
          userCc: user.id,
          records: records.map((r) => ({ ...r })),
          status: "pending",
        });
        setDialogVariant("success");
        setDialogOpen(true);
      } catch (err) {
        toast.error("Error al guardar la agenda");
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleReturn = async () => {
    if (!returnObservation.trim()) {
      toast.error(t("summary.observationRequired"));
      return;
    }
    if (!subordinateAgendaView?.id || !user?.id) return;
    try {
      await updateAgendaViewStatus.mutateAsync({
        id: subordinateAgendaView.id,
        status: "returned",
        reviewerCc: user.id,
        reviewerComment: returnObservation.trim(),
      });
      toast.success(t("summary.returnSuccess"));
      setReturnObservation("");
    } catch {
      toast.error("Error al retornar la agenda");
    }
  };

  const handleApprove = async () => {
    if (!subordinateAgendaView?.id || !user?.id) return;
    try {
      await updateAgendaViewStatus.mutateAsync({
        id: subordinateAgendaView.id,
        status: "approved",
        reviewerCc: user.id,
      });
      toast.success(t("summary.approveSuccess"));
    } catch {
      toast.error("Error al aprobar la agenda");
    }
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
    <div className="w-[420px] shrink-0 flex flex-col bg-background border-l pt-6">
      <div className="px-4 py-3 border-b bg-ucp-red">
        <h2 className="text-sm font-bold text-primary-foreground">{t("summary.title")}</h2>
        {(() => {
          const dn = selectedDocente && selectedDocente.firstName !== "Yo"
            ? [selectedDocente.firstName, selectedDocente.secondName, selectedDocente.firstLastName].filter(Boolean).join(' ')
            : user ? [user.firstName, user.firstLastName].filter(Boolean).join(' ') : '';
          return dn ? <p className="text-xs text-primary-foreground/80 mt-0.5">{dn}</p> : null;
        })()}
      </div>

      {docentesList.length > 1 && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <Select
            value={selectedDocente?.id || ""}
            onValueChange={async (val) => {
              const d = docentesList.find((doc) => doc.id === val);
              if (!d) return;
              setSelectedDocente(d);
              if (d.firstName !== "Yo") {
                setTimeout(async () => {
                  const found = await loadFromAgendaView();
                  if (!found) {
                    toast.info(`Docente ${getDocenteFullName(d)} no ha diligenciado su agenda`);
                  }
                }, 100);
              }
            }}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder={t("sidebar.docenteSection")} />
            </SelectTrigger>
            <SelectContent>
              {docentesList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.firstName === "Yo" ? "Yo" : getDocenteFullName(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ScrollArea className="flex-1 px-4 py-3 bg-white dark:bg-[#1f1f1f]">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm text-center">{t("summary.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => {
              const weeklyTotal = group.records.reduce((s, r) => s + (Number(r.data["horasSemana"]) || r.totalHoras / 18), 0);
              const semesterTotal = group.records.reduce((s, r) => s + r.totalHoras, 0);
              return (
                <div key={group.id}>
                  <div className="flex items-center mb-1">
                    <h3
                      className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-primary transition-colors"
                      onClick={() => scrollToSection(group.id)}
                    >
                      {t(group.shortTitleKey || group.shortTitle)}
                    </h3>
                    <span className="w-14 text-right text-[10px] font-semibold text-muted-foreground">{t("summary.snal")}</span>
                    <span className="w-14 text-right text-[10px] font-semibold text-muted-foreground">{t("summary.stral")}</span>
                    <span className="w-6" />
                  </div>
                  {group.records.map((record, i) => {
                    // Pick a meaningful label: asignatura > actividad > tipoTrabajo > first string
                    const data = record.data;
                    const rawLabel = data["asignatura"] || data["actividad"] || data["tipoTrabajo"] || Object.values(data).find((v) => typeof v === "string" && v !== "1" && v !== data["_auto"]) || `${t("form.record")} ${i + 1}`;
                    const label = translateOption(String(rawLabel), language);
                    const weeklyHours = Number(record.data["horasSemana"]) || record.totalHoras / 18;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center py-1 text-sm border-b border-border/50 last:border-0 rounded px-1 transition-colors group cursor-pointer hover:bg-accent/50"
                        onClick={() => handleRecordClick(record)}
                      >
                        <span className="flex-1 text-foreground break-words line-clamp-2" title={String(label)}>{String(label)}</span>
                        <span className="w-14 text-right text-muted-foreground">{weeklyHours % 1 === 0 ? weeklyHours : weeklyHours.toFixed(1)}h</span>
                        <span className="w-14 text-right font-semibold text-primary">{record.totalHoras}h</span>
                        {!isAgendaReadOnly && (
                          <button
                            className="w-6 flex justify-center p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRecord(record.id);
                            }}
                            title={t("summary.deleteRecord")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center mt-1 text-xs font-medium text-muted-foreground">
                    <span className="flex-1 text-right pr-1">Tt:</span>
                    <span className="w-14 text-right">{weeklyTotal % 1 === 0 ? weeklyTotal : weeklyTotal.toFixed(1)}h</span>
                    <span className="px-1">:</span>
                    <span className="w-14 text-right">{semesterTotal}h</span>
                    <span className="w-6" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t px-4 pt-3 pb-1 space-y-1 text-sm bg-white dark:bg-[#1f1f1f]">
        {/* Total semanal global */}
        <div className="flex justify-between pb-1 mb-1 border-b border-border">
          <span className="font-bold text-primary">Total semanal global</span>
          <span className="font-bold text-primary">
            {(() => {
              const total = records.reduce((sum, r) => sum + (Number(r.data["horasSemana"]) || r.totalHoras / 18), 0);
              return total % 1 === 0 ? total : total.toFixed(1);
            })()}h
          </span>
        </div>
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
            disabled={isAgendaReadOnly}
          />
        </div>
      </div>

      

      <div className="p-4 border-t">
        {isReviewingSubordinate ? (
          <div className="space-y-3">
            <Textarea
              placeholder={t("summary.observationPlaceholder")}
              value={returnObservation}
              onChange={(e) => setReturnObservation(e.target.value)}
              className="min-h-[60px] text-sm"
              aria-required="true"
            />
            {!returnObservation.trim() && (
              <p className="text-xs text-destructive">
                {t("summary.observationRequired")}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleReturn}
                disabled={!returnObservation.trim() || updateAgendaViewStatus.isPending}
                className="flex-1 gap-2 text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#a8822c" }}
              >
                <RotateCcw className="h-4 w-4" />
                {t("summary.return")}
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <ThumbsUp className="h-4 w-4" />
                {t("summary.approve")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConfirm}
            className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CheckCircle className="h-4 w-4" />
            {t("summary.confirm")}
          </Button>
        )}
      </div>
      <ConfirmSuccessDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        variant={dialogVariant}
      />
    </div>
  );
}
