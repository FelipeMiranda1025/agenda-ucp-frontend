import { useState, useEffect, useRef, useCallback } from "react";
import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { ScheduleData } from "@/types/agenda";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CalendarX } from "lucide-react";
import { toast } from "sonner";
import { SUBFUNCTION_COLORS, DAYS, HOURS, formatHour } from "@/data/scheduleConstants";
import { DocentePlanta } from "@/types/docentePlanta";

// Persistent form data across subfunctions
const formDataStore: { [subfunctionId: string]: { [key: string]: string | number } } = {};

function ScheduleReadOnlyView({ hasSchedule, getSchedule, selectedDocente }: { hasSchedule: boolean; getSchedule: () => ScheduleData | null; selectedDocente: DocentePlanta | null }) {
  if (!hasSchedule) {
    return (
      <div className="space-y-6">
        <div className="bg-ucp-red px-6 py-4 rounded-lg">
          <h1 className="text-xl font-bold text-primary-foreground">3.1 Distribución horaria</h1>
          {selectedDocente && (
            <p className="text-sm text-primary-foreground/80 mt-1">
              Docente: {[selectedDocente.firstName, selectedDocente.firstLastName].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarX className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center">
              Aún no se ha creado horario. Confirma las asignaturas en el resumen de registros.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const schedule = getSchedule()!;
  return (
    <div className="space-y-6">
      <div className="bg-ucp-red px-6 py-4 rounded-lg">
        <h1 className="text-xl font-bold text-primary-foreground">3.1 Distribución horaria</h1>
        {selectedDocente && (
          <p className="text-sm text-primary-foreground/80 mt-1">
            Docente: {[selectedDocente.firstName, selectedDocente.firstLastName].filter(Boolean).join(' ')}
          </p>
        )}
        <p className="text-xs text-primary-foreground/60 mt-1">
          Última modificación: {new Date(schedule.lastModified).toLocaleString("es-CO")}
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 overflow-auto">
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
                    const block = schedule.blocks.find((b) => b.day === dayIdx && b.hour === hour);
                    return (
                      <td key={dayIdx} className="border p-0.5 h-10">
                        {block && (
                          <div className={`${SUBFUNCTION_COLORS[block.subfunctionId] || "bg-gray-500"} text-white rounded px-1.5 py-1 text-[10px] leading-tight font-medium h-full flex items-center`}>
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
        </CardContent>
      </Card>
    </div>
  );
}

export function SubfunctionForm({ subfunctionId }: { subfunctionId?: string }) {
  const { activeSubfunction, dropdownOptions, addDropdownOption, upsertRecord, selectedDocente, hasSchedule, getSchedule } = useAgenda();
  const [formData, setFormData] = useState<{ [key: string]: string | number }>(() => {
    const id = subfunctionId || activeSubfunction;
    return formDataStore[id] || {};
  });
  const [newOptionCategory, setNewOptionCategory] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastUpsertRef = useRef<string>("");

  const resolvedId = subfunctionId || activeSubfunction;
  const config = subfunctions.find((s) => s.id === resolvedId);
  if (!config) return null;

  if (resolvedId === "distribucion-horaria") {
    return <ScheduleReadOnlyView hasSchedule={hasSchedule} getSchedule={getSchedule} selectedDocente={selectedDocente} />;
  }

  const calculatedFields = config.fields.filter((f) => f.type === "calculated");
  const inputFields = config.fields.filter((f) => f.type !== "calculated");

  const computeTotal = (data: { [key: string]: string | number }) => {
    const calc = calculatedFields[0];
    if (!calc?.calculatedFrom) return 0;
    const v1 = Number(data[calc.calculatedFrom.field1]) || 0;
    const v2 = Number(data[calc.calculatedFrom.field2]) || 0;
    return v1 * v2;
  };

  const currentTotal = computeTotal(formData);

  // Persist formData to store
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    formDataStore[resolvedId] = formData;
  }, [formData, resolvedId]);

  // Auto-upsert when all fields are filled
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const allFilled = inputFields.every((f) => {
      if (f.type === "number") return Number(formData[f.name]) > 0;
      if (f.type === "dropdown") return !!formData[f.name];
      return true;
    });

    if (!allFilled) return;

    const total = computeTotal(formData);
    // Create a signature to avoid duplicate upserts
    const sig = JSON.stringify({ resolvedId, data: formData, total });
    if (sig === lastUpsertRef.current) return;
    lastUpsertRef.current = sig;

    upsertRecord(resolvedId, { ...formData }, total);
  }, [formData, resolvedId]);

  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    addDropdownOption(newOptionCategory, newOptionValue.trim());
    setNewOptionValue("");
    setDialogOpen(false);
    toast.success("Opción agregada");
  };

  return (
    <div className="space-y-6">
      <div className="bg-ucp-red px-6 py-4 rounded-lg">
        <h1 className="text-xl font-bold text-primary-foreground">{config.title}</h1>
        {selectedDocente && (
          <p className="text-sm text-primary-foreground/80 mt-1">
            Docente: {[selectedDocente.firstName, selectedDocente.secondName, selectedDocente.firstLastName, selectedDocente.secondLastName].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inputFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-medium">{field.label}</Label>
                {field.type === "dropdown" ? (
                  <div className="flex gap-1">
                    <Select
                      value={String(formData[field.name] || "")}
                      onValueChange={(v) => setFormData((p) => ({ ...p, [field.name]: v }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdownOptions
                          .filter((o) => o.category === field.category)
                          .map((o) => (
                            <SelectItem key={o.id} value={o.value}>
                              {o.value}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={dialogOpen && newOptionCategory === field.category} onOpenChange={(open) => { setDialogOpen(open); if (open) setNewOptionCategory(field.category!); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => setNewOptionCategory(field.category!)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar opción: {field.label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Input
                            placeholder="Nueva opción..."
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                          />
                          <Button onClick={handleAddOption} className="w-full">Agregar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, [field.name]: Number(e.target.value) }))}
                    placeholder="0"
                  />
                )}
              </div>
            ))}
            {calculatedFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-medium">{field.label}</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-muted text-sm font-semibold flex items-center">
                  {currentTotal}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
