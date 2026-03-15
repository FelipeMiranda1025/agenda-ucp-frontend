import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { subfunctions } from "@/data/subfunctions";
import { ScheduleBlock } from "@/types/agenda";
import { SUBFUNCTION_COLORS, SUBFUNCTION_BORDER_COLORS, DAYS, HOURS, formatHour } from "@/data/scheduleConstants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface DraggableItem {
  id: string;
  recordId: string;
  subfunctionId: string;
  label: string;
  color: string;
  borderColor: string;
}

export default function ScheduleBuilder() {
  const navigate = useNavigate();
  const { records, saveSchedule, getSchedule } = useAgenda();
  const { user } = useAuth();

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
      const color = SUBFUNCTION_COLORS[record.subfunctionId] || "bg-gray-500";
      const borderColor = SUBFUNCTION_BORDER_COLORS[record.subfunctionId] || "border-gray-600";
      for (let i = 0; i < horasSemana; i++) {
        items.push({
          id: `${record.id}-${i}`,
          recordId: record.id,
          subfunctionId: record.subfunctionId,
          label,
          color,
          borderColor,
        });
      }
    }
    return items;
  }, [records]);

  // Initialize placed blocks from existing schedule
  const [placedBlocks, setPlacedBlocks] = useState<ScheduleBlock[]>(
    existingSchedule?.blocks || []
  );

  const placedIds = useMemo(() => new Set(placedBlocks.map((b) => b.id)), [placedBlocks]);

  const availableItems = useMemo(
    () => allItems.filter((item) => !placedIds.has(item.id)),
    [allItems, placedIds]
  );

  // Group available by label for display
  const groupedAvailable = useMemo(() => {
    const map = new Map<string, { label: string; color: string; borderColor: string; items: DraggableItem[] }>();
    for (const item of availableItems) {
      const key = `${item.recordId}`;
      if (!map.has(key)) {
        map.set(key, { label: item.label, color: item.color, borderColor: item.borderColor, items: [] });
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
    // Check if cell is occupied
    if (placedBlocks.some((b) => b.day === day && b.hour === hour)) {
      toast.error("Esta celda ya está ocupada");
      return;
    }
    // Find the item
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
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 flex items-center gap-3 border-b bg-primary px-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-primary-foreground font-semibold text-lg">
          Distribución Horaria
        </h1>
        {user && (
          <span className="text-primary-foreground/70 text-sm ml-2">
            {[user.firstName, user.firstLastName].filter(Boolean).join(" ")}
          </span>
        )}
        <div className="ml-auto">
          <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Save className="h-4 w-4" />
            Guardar horario
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Schedule Grid */}
        <div className="flex-1 overflow-auto p-4">
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
                              className={`${SUBFUNCTION_COLORS[block.subfunctionId] || "bg-gray-500"} text-white rounded px-1.5 py-1 text-[10px] leading-tight font-medium cursor-pointer hover:opacity-80 h-full flex items-center`}
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

        {/* Right sidebar - draggable blocks */}
        <div className="w-72 shrink-0 border-l bg-card flex flex-col">
          <div className="px-4 py-3 border-b bg-ucp-red">
            <h2 className="text-sm font-bold text-primary-foreground">Bloques disponibles</h2>
            <p className="text-xs text-primary-foreground/80 mt-0.5">Arrastra al horario</p>
          </div>
          <ScrollArea className="flex-1 p-3">
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
                          className={`${item.color} text-white text-[10px] font-medium px-2 py-1.5 rounded cursor-grab active:cursor-grabbing border-2 ${item.borderColor} hover:opacity-90 transition-opacity select-none`}
                        >
                          1h
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
