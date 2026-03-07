import { useAgenda } from "@/context/AgendaContext";
import { Input } from "@/components/ui/input";

export function MetricsFooter() {
  const { metricas, horasSemestreDefecto, setHorasSemestreDefecto } = useAgenda();

  const items = [
    { label: "Total horas semestrales", value: metricas.totalHorasSemestrales },
    { label: "Promedio horas/semana", value: metricas.promedioHorasSemana.toFixed(1) },
    { label: "Horas faltantes", value: metricas.horasFaltantes },
  ];

  return (
    <footer className="border-t bg-card px-6 py-3">
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-bold text-foreground">{item.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Horas semestre/defecto:</span>
          <Input
            type="number"
            min={1}
            className="w-20 h-7 text-sm"
            value={horasSemestreDefecto}
            onChange={(e) => setHorasSemestreDefecto(Number(e.target.value) || 920)}
          />
        </div>
      </div>
    </footer>
  );
}
