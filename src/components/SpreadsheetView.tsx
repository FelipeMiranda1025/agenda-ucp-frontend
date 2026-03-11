import { useState } from "react";
import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { Record as AgendaRecord } from "@/types/agenda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Save, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const sectionConfig = {
  produccion: { label: "1. PRODUCCIÓN", colorClass: "bg-section-produccion text-section-produccion-foreground" },
  actividades: { label: "2. ACTIVIDADES DIFERENTES A LA DOCENCIA", colorClass: "bg-section-actividades text-section-actividades-foreground" },
  horario: { label: "3. HORARIO DE PERMANENCIA", colorClass: "bg-section-horario text-section-horario-foreground" },
};

function SubfunctionTable({ subfunctionId }: { subfunctionId: string }) {
  const { dropdownOptions, addDropdownOption, addRecord, updateRecord, deleteRecord, getRecordsBySubfunction } = useAgenda();
  const [formData, setFormData] = useState<{ [key: string]: string | number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ [key: string]: string | number }>({});
  const [newOptionCategory, setNewOptionCategory] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const config = subfunctions.find((s) => s.id === subfunctionId)!;
  const records = getRecordsBySubfunction(subfunctionId);
  const inputFields = config.fields.filter((f) => f.type !== "calculated");
  const calculatedFields = config.fields.filter((f) => f.type === "calculated");

  const computeTotal = (data: { [key: string]: string | number }) => {
    const calc = calculatedFields[0];
    if (!calc?.calculatedFrom) return 0;
    return (Number(data[calc.calculatedFrom.field1]) || 0) * (Number(data[calc.calculatedFrom.field2]) || 0);
  };

  const subtotal = records.reduce((s, r) => s + r.totalHoras, 0);

  const handleSubmit = () => {
    for (const f of inputFields) {
      if (f.type === "number" && (!Number(formData[f.name]) || Number(formData[f.name]) <= 0)) {
        toast.error(`${f.label} debe ser un número positivo`);
        return;
      }
      if (f.type === "dropdown" && !formData[f.name]) {
        toast.error(`Seleccione ${f.label}`);
        return;
      }
    }
    addRecord({ subfunctionId, data: { ...formData }, totalHoras: computeTotal(formData) });
    setFormData({});
    toast.success("Registro agregado");
  };

  const handleEdit = (record: AgendaRecord) => { setEditingId(record.id); setEditData({ ...record.data }); };
  const handleSaveEdit = (id: string) => { updateRecord(id, { ...editData }, computeTotal(editData)); setEditingId(null); toast.success("Actualizado"); };
  const handleDelete = (id: string) => { deleteRecord(id); toast.success("Eliminado"); };
  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    addDropdownOption(newOptionCategory, newOptionValue.trim());
    setNewOptionValue("");
    setDialogOpen(false);
    toast.success("Opción agregada");
  };

  const renderCell = (field: typeof config.fields[0], data: { [key: string]: string | number }, isEdit: boolean, setData: (d: { [key: string]: string | number }) => void) => {
    if (field.type === "calculated") {
      return <span className="font-semibold">{computeTotal(data)}</span>;
    }
    if (!isEdit) {
      return <span className="text-sm">{String(data[field.name] || "")}</span>;
    }
    if (field.type === "dropdown") {
      return (
        <Select value={String(data[field.name] || "")} onValueChange={(v) => setData({ ...data, [field.name]: v })}>
          <SelectTrigger className="h-7 text-xs min-w-[120px]"><SelectValue placeholder="..." /></SelectTrigger>
          <SelectContent>
            {dropdownOptions.filter((o) => o.category === field.category).map((o) => (
              <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input type="number" min={1} className="h-7 text-xs w-20" value={data[field.name] || ""} onChange={(e) => setData({ ...data, [field.name]: Number(e.target.value) })} />
    );
  };

  return (
    <div className="mb-1">
      {/* Subfunction header */}
      <div className="bg-subfunction-header text-subfunction-header-foreground px-3 py-1.5 font-semibold text-sm border border-border">
        {config.title}
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted">
            {config.fields.map((f) => (
              <th key={f.name} className="border border-border px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                {f.label}
              </th>
            ))}
            <th className="border border-border px-2 py-1.5 w-20 text-center text-muted-foreground font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Existing records */}
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-accent/50 transition-colors">
              {config.fields.map((f) => (
                <td key={f.name} className="border border-border px-2 py-1">
                  {editingId === record.id
                    ? renderCell(f, editData, f.type !== "calculated", setEditData)
                    : f.type === "calculated"
                      ? <span className="font-semibold">{record.totalHoras}</span>
                      : <span className="text-sm">{String(record.data[f.name] || "")}</span>
                  }
                </td>
              ))}
              <td className="border border-border px-1 py-1 text-center">
                {editingId === record.id ? (
                  <div className="flex justify-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(record.id)}><Save className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="flex justify-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(record)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(record.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                )}
              </td>
            </tr>
          ))}

          {/* New record row */}
          <tr className="bg-accent/30">
            {config.fields.map((f) => (
              <td key={f.name} className="border border-border px-2 py-1">
                {f.type === "calculated" ? (
                  <span className="font-semibold text-muted-foreground">{computeTotal(formData)}</span>
                ) : f.type === "dropdown" ? (
                  <div className="flex gap-0.5">
                    <Select value={String(formData[f.name] || "")} onValueChange={(v) => setFormData((p) => ({ ...p, [f.name]: v }))}>
                      <SelectTrigger className="h-7 text-xs min-w-[100px]"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent>
                        {dropdownOptions.filter((o) => o.category === f.category).map((o) => (
                          <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={dialogOpen && newOptionCategory === f.category} onOpenChange={(open) => { setDialogOpen(open); if (open) setNewOptionCategory(f.category!); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => setNewOptionCategory(f.category!)}><Plus className="h-3 w-3" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Agregar: {f.label}</DialogTitle></DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Input placeholder="Nueva opción..." value={newOptionValue} onChange={(e) => setNewOptionValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddOption()} />
                          <Button onClick={handleAddOption} className="w-full">Agregar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <Input type="number" min={1} className="h-7 text-xs w-20" value={formData[f.name] || ""} onChange={(e) => setFormData((p) => ({ ...p, [f.name]: Number(e.target.value) }))} placeholder="0" />
                )}
              </td>
            ))}
            <td className="border border-border px-1 py-1 text-center">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={handleSubmit}><Plus className="h-4 w-4" /></Button>
            </td>
          </tr>

          {/* Subtotal row */}
          <tr className="bg-muted/60 font-semibold">
            <td colSpan={config.fields.length - 1} className="border border-border px-2 py-1.5 text-right text-xs">
              Total {config.shortTitle}:
            </td>
            <td className="border border-border px-2 py-1.5 text-xs font-bold">{subtotal}</td>
            <td className="border border-border"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SpreadsheetView() {
  const { metricas, horasSemestreDefecto, setHorasSemestreDefecto } = useAgenda();
  const navigate = useNavigate();

  const sections = [
    { id: "produccion" as const, subs: subfunctions.filter((s) => s.sectionId === "produccion") },
    { id: "actividades" as const, subs: subfunctions.filter((s) => s.sectionId === "actividades") },
  ];

  // Compute section totals
  const { records } = useAgenda();
  const sectionTotals: { [key: string]: number } = {};
  for (const section of sections) {
    sectionTotals[section.id] = records
      .filter((r) => section.subs.some((s) => s.id === r.subfunctionId))
      .reduce((sum, r) => sum + r.totalHoras, 0);
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-2">
      {sections.map((section) => {
        const cfg = sectionConfig[section.id];
        return (
          <div key={section.id}>
            {/* Section header */}
            <div className={`${cfg.colorClass} px-4 py-2 font-bold text-sm rounded-t`}>
              {cfg.label}
            </div>

            {/* Subfunction tables */}
            {section.subs.map((sf) => (
              <SubfunctionTable key={sf.id} subfunctionId={sf.id} />
            ))}

            {/* Section total */}
            <div className={`${cfg.colorClass} px-4 py-2 text-sm font-bold flex justify-between rounded-b mb-4`}>
              <span>Total horas {section.id === "produccion" ? "Actividades de Docencia" : "Actividades Diferentes"}:</span>
              <span>{sectionTotals[section.id]}</span>
            </div>
          </div>
        );
      })}

      {/* Horario section */}
      <div>
        <div className={`${sectionConfig.horario.colorClass} px-4 py-2 font-bold text-sm rounded-t`}>
          {sectionConfig.horario.label}
        </div>
        <div className="border border-border p-4 rounded-b bg-card text-sm text-center">
          <p className="text-muted-foreground mb-2">La distribución horaria se configura después de confirmar los datos.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>
            Ir a Distribución Horaria
          </Button>
        </div>
      </div>

      {/* Summary / totals */}
      <div className="border border-border rounded bg-card p-4 mt-4 space-y-3">
        <h3 className="font-bold text-sm">Resumen General</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Total semestral</p>
            <p className="text-lg font-bold">{metricas.totalHorasSemestrales}h</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Promedio/semana</p>
            <p className="text-lg font-bold">{metricas.promedioHorasSemana.toFixed(1)}h</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Horas faltantes</p>
            <p className="text-lg font-bold text-destructive">{metricas.horasFaltantes}h</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Horas semestre</p>
            <Input type="number" min={1} className="w-24 h-8 text-sm" value={horasSemestreDefecto} onChange={(e) => setHorasSemestreDefecto(Number(e.target.value) || 920)} />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <Button onClick={() => navigate("/schedule")} className="gap-2 bg-primary hover:bg-primary/90">
            <CheckCircle className="h-4 w-4" /> Confirmar datos
          </Button>
        </div>
      </div>
    </div>
  );
}
