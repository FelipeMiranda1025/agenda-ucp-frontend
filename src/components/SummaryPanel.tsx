import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CheckCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export function SummaryPanel() {
  const { records, metricas, horasSemestreDefecto, setHorasSemestreDefecto, selectedDocente, setActiveSubfunction } = useAgenda();

  const grouped = subfunctions
    .map((sf) => ({
      ...sf,
      records: records.filter((r) => r.subfunctionId === sf.id),
    }))
    .filter((g) => g.records.length > 0);

  const handleConfirm = () => {
    toast.success("Datos confirmados exitosamente. Listos para guardar en base de datos.");
  };

  return (
    <div className="w-80 shrink-0 flex flex-col bg-card border-l">
      <div className="px-4 py-3 border-b bg-ucp-red">
        <h2 className="text-sm font-bold text-primary-foreground">Resumen de Datos</h2>
        {selectedDocente && (
          <p className="text-xs text-primary-foreground/80 mt-0.5">
            {[selectedDocente.firstName, selectedDocente.firstLastName].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm text-center">No hay registros aún. Agrega datos desde el formulario.</p>
          </div>
        ) : (
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
        )}
      </ScrollArea>

      <div className="border-t px-4 pt-3 pb-1 space-y-1 text-sm">
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
        <div className="flex items-center justify-between pt-1">
          <span className="text-muted-foreground">Horas semestre/defecto</span>
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
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4" />
          Confirmar datos
        </Button>
      </div>
    </div>
  );
}
