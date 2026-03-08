import { useState } from "react";
import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { Record as AgendaRecord } from "@/types/agenda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

export function SubfunctionForm() {
  const { activeSubfunction, dropdownOptions, addDropdownOption, addRecord, updateRecord, deleteRecord, getRecordsBySubfunction, selectedDocente } = useAgenda();
  const [formData, setFormData] = useState<{ [key: string]: string | number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ [key: string]: string | number }>({});
  const [newOptionCategory, setNewOptionCategory] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const config = subfunctions.find((s) => s.id === activeSubfunction);
  if (!config) return null;

  const records = getRecordsBySubfunction(activeSubfunction);
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
  const totalSemestral = records.reduce((sum, r) => sum + r.totalHoras, 0);

  const handleSubmit = () => {
    for (const f of inputFields) {
      if (f.type === "number") {
        const val = Number(formData[f.name]);
        if (!val || val <= 0) {
          toast.error(`${f.label} debe ser un número positivo`);
          return;
        }
      }
      if (f.type === "dropdown" && !formData[f.name]) {
        toast.error(`Seleccione ${f.label}`);
        return;
      }
    }
    addRecord({
      subfunctionId: activeSubfunction,
      data: { ...formData },
      totalHoras: currentTotal,
    });
    setFormData({});
    toast.success("Registro agregado");
  };

  const handleEdit = (record: AgendaRecord) => {
    setEditingId(record.id);
    setEditData({ ...record.data });
  };

  const handleSaveEdit = (id: string) => {
    updateRecord(id, { ...editData }, computeTotal(editData));
    setEditingId(null);
    toast.success("Registro actualizado");
  };

  const handleDelete = (id: string) => {
    deleteRecord(id);
    toast.success("Registro eliminado");
  };

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
          <CardTitle className="text-base">Nuevo registro</CardTitle>
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
          <Button onClick={handleSubmit} className="mt-4">
            <Plus className="h-4 w-4 mr-1" /> Agregar registro
          </Button>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.fields.map((f) => (
                      <TableHead key={f.name}>{f.label}</TableHead>
                    ))}
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      {config.fields.map((f) => (
                        <TableCell key={f.name}>
                          {editingId === record.id && f.type !== "calculated" ? (
                            f.type === "dropdown" ? (
                              <Select
                                value={String(editData[f.name] || "")}
                                onValueChange={(v) => setEditData((p) => ({ ...p, [f.name]: v }))}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownOptions
                                    .filter((o) => o.category === f.category)
                                    .map((o) => (
                                      <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="number"
                                min={1}
                                className="h-8"
                                value={editData[f.name] || ""}
                                onChange={(e) => setEditData((p) => ({ ...p, [f.name]: Number(e.target.value) }))}
                              />
                            )
                          ) : f.type === "calculated" ? (
                            editingId === record.id ? computeTotal(editData) : record.totalHoras
                          ) : (
                            String(record.data[f.name] || "")
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === record.id ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(record.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(record)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(record.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-right font-semibold text-sm">
              Total horas semestrales: <span className="text-primary text-lg">{totalSemestral}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
