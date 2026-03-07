import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, X, ClipboardList } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SummaryPanel() {
  const { records, metricas } = useAgenda();
  const [minimized, setMinimized] = useState(false);

  if (records.length === 0) return null;

  const grouped = subfunctions
    .map((sf) => ({
      ...sf,
      records: records.filter((r) => r.subfunctionId === sf.id),
    }))
    .filter((g) => g.records.length > 0);

  const handleConfirm = () => {
    toast.success("Datos confirmados exitosamente. Listos para guardar en base de datos.");
  };

  if (minimized) {
    return (
      <div className="fixed right-4 bottom-4 z-40">
        <Button
          onClick={() => setMinimized(false)}
          className="rounded-full shadow-lg h-12 w-12 p-0"
        >
          <ClipboardList className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-16 bottom-4 w-80 z-40 flex flex-col bg-card border rounded-lg shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary rounded-t-lg">
        <h2 className="text-sm font-bold text-primary-foreground">Resumen de Datos</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setMinimized(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.id}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {group.shortTitle}
              </h3>
              {group.records.map((record, i) => {
                const label = Object.values(record.data).find((v) => typeof v === "string") || `Registro ${i + 1}`;
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-1 text-sm border-b border-border/50 last:border-0"
                  >
                    <span className="truncate flex-1 text-foreground">{String(label)}</span>
                    <span className="font-semibold text-primary ml-2">{record.totalHoras}h</span>
                  </div>
                );
              })}
              <div className="text-right text-xs font-medium text-muted-foreground mt-1">
                Subtotal: {group.records.reduce((s, r) => s + r.totalHoras, 0)}h
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total semestral</span>
            <span className="font-bold">{metricas.totalHorasSemestrales}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Promedio/semana</span>
            <span className="font-bold">{metricas.promedioHorasSemana.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horas faltantes</span>
            <span className="font-bold text-destructive">{metricas.horasFaltantes}h</span>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={handleConfirm} className="w-full gap-2">
          <CheckCircle className="h-4 w-4" />
          Confirmar datos
        </Button>
      </div>
    </div>
  );
}
