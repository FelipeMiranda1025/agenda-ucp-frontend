import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { useAgendaView } from "@/hooks/useDatabase";
import { subfunctions } from "@/data/subfunctions";
import { ScheduleBlock } from "@/types/agenda";
import {
  blockColorStyles,
  DAYS,
  formatHour,
  getSubfunctionBlockColor,
  HOURS,
  resolveBlockColor,
} from "@/data/scheduleConstants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, User } from "lucide-react";
import ucpLogoWhite from "@/assets/ucp-logo-white.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { canAccessScheduleDistribution } from "@/lib/agendaScheduleAccess";

const SCHEDULE_BAR_COLOR = "rgb(0, 128, 78)";

interface DraggableItem {
  id: string;
  recordId: string;
  subfunctionId: string;
  label: string;
  color: string;
}

export default function ScheduleBuilder() {
  const navigate = useNavigate();
  const { records, saveSchedule, getSchedule, loadFromAgendaView } = useAgenda();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: agendaView, isLoading: loadingView } = useAgendaView(user?.id);
  const scheduleAllowed = canAccessScheduleDistribution(agendaView, user?.rolId);
  const [agendaDataReady, setAgendaDataReady] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      await loadFromAgendaView(user.id);
      if (!cancelled) setAgendaDataReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loadFromAgendaView]);

  const existingSchedule = getSchedule();

  // Build draggable items from records
  const allItems = useMemo(() => {
    const items: DraggableItem[] = [];
    for (const record of records) {
      const sf = subfunctions.find((s) => s.id === record.subfunctionId);
      if (!sf) continue;
      const horasSemana = Number(record.data["horasSemana"] || record.data["cantidadHoras"] || record.data["cantidadEstudiantes"] || 0);
      if (horasSemana <= 0) continue;
      const label = String(
        record.data["asignatura"] || record.data["actividad"] || record.data["tipoTrabajo"] || `Registro`
      );
      const color = getSubfunctionBlockColor(record.subfunctionId);
      for (let i = 0; i < horasSemana; i++) {
        items.push({
          id: `${record.id}-${i}`,
          recordId: record.id,
          subfunctionId: record.subfunctionId,
          label,
          color,
        });
      }
    }
    return items;
  }, [records]);

  const [placedBlocks, setPlacedBlocks] = useState<ScheduleBlock[]>(
    existingSchedule?.blocks || []
  );

  const placedIds = useMemo(() => new Set(placedBlocks.map((b) => b.id)), [placedBlocks]);

  const availableItems = useMemo(
    () => allItems.filter((item) => !placedIds.has(item.id)),
    [allItems, placedIds]
  );

  const groupedAvailable = useMemo(() => {
    const map = new Map<string, { label: string; color: string; items: DraggableItem[] }>();
    for (const item of availableItems) {
      const key = `${item.recordId}`;
      if (!map.has(key)) {
        map.set(key, { label: item.label, color: item.color, items: [] });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [availableItems]);

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItem(itemId);
  }, []);

  const handleDrop = useCallback((day: number, hour: number) => {
    if (!draggedItem) return;
    if (placedBlocks.some((b) => b.day === day && b.hour === hour)) {
      toast.error("Esta celda ya está ocupada");
      return;
    }
    const item = allItems.find((i) => i.id === draggedItem);
    if (!item) return;

    const block: ScheduleBlock = {
      id: item.id,
      recordId: item.recordId,
      subfunctionId: item.subfunctionId,
      label: item.label,
      color: item.color,
      day,
      hour,
    };
    setPlacedBlocks((prev) => [...prev, block]);
    setDraggedItem(null);
  }, [draggedItem, allItems, placedBlocks]);

  const handleRemoveBlock = useCallback((blockId: string) => {
    setPlacedBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleSave = () => {
    saveSchedule(placedBlocks);
    toast.success("Horario guardado exitosamente");
    navigate("/?view=agenda");
  };

  useEffect(() => {
    if (!loadingView && !scheduleAllowed) {
      navigate("/?view=agenda", { replace: true });
    }
  }, [scheduleAllowed, loadingView, navigate]);

  if (loadingView || !agendaDataReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("schedule.redirecting")}</p>
      </div>
    );
  }

  if (!agendaView || !scheduleAllowed) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header
        className="h-14 flex items-center gap-3 border-b px-4 shrink-0"
        style={{ backgroundColor: SCHEDULE_BAR_COLOR }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/?view=agenda")}
          className="h-10 px-2 hover:bg-white/10 shrink-0"
          aria-label={t("schedule.backToAgenda")}
        >
          <img src={ucpLogoWhite} alt="Universidad Católica de Pereira" className="h-8 w-auto" />
        </Button>
        <h1 className="text-white font-semibold text-lg truncate">
          {t("schedule.builderTitle")}
        </h1>
        {user && (
          <span className="text-white/70 text-sm ml-2">
            {[user.firstName, user.firstLastName].filter(Boolean).join(" ")}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="gap-2 text-white hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">{t("profile.view")}</span>
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-white text-[rgb(0,128,78)] hover:bg-white/90">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{t("schedule.save")}</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="min-w-[700px]">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-20 p-2 border bg-muted text-muted-foreground font-semibold">Hora</th>
                  {DAYS.map((day) => (
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
                    {DAYS.map((_, dayIdx) => {
                      const block = placedBlocks.find((b) => b.day === dayIdx && b.hour === hour);
                      return (
                        <td
                          key={dayIdx}
                          className="border p-0.5 h-12 align-top transition-colors hover:bg-accent/30"
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-accent/50"); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove("bg-accent/50"); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove("bg-accent/50");
                            handleDrop(dayIdx, hour);
                          }}
                        >
                          {block && (
                            <div
                              className="rounded px-1.5 py-1 text-[10px] leading-tight font-medium h-full flex items-center cursor-pointer hover:opacity-80 border-2"
                              style={blockColorStyles(resolveBlockColor(block.subfunctionId, block.color))}
                              onClick={() => handleRemoveBlock(block.id)}
                              title="Click para quitar"
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
          </div>
        </div>

        <aside className="w-72 shrink-0 border-l bg-card flex flex-col min-h-0 overflow-hidden">
            <div
              className="shrink-0 px-4 py-3 border-b"
              style={{ backgroundColor: SCHEDULE_BAR_COLOR }}
            >
              <h2 className="text-sm font-bold text-white">Bloques disponibles</h2>
              <p className="text-xs text-white/80 mt-0.5">Arrastra al horario</p>
            </div>
            <ScrollArea className="flex-1 min-h-0 h-0 overscroll-contain">
              <div className="p-3 pr-4">
              {groupedAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {allItems.length === 0
                    ? "No hay registros con horas semanales"
                    : "Todos los bloques asignados ✓"}
                </p>
              ) : (
                <div className="space-y-3">
                  {groupedAvailable.map((group, gi) => (
                    <div key={gi}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 truncate">
                        {group.label} ({group.items.length}h)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item.id)}
                            onDragEnd={() => setDraggedItem(null)}
                            className="text-[10px] font-medium px-2 py-1.5 rounded cursor-grab active:cursor-grabbing border-2 hover:opacity-90 transition-opacity select-none"
                            style={blockColorStyles(item.color)}
                          >
                            1h
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
