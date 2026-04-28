import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useFaculties,
  useSubordinatesWithNames,
  useDocentesByFaculty,
  useAgendaViewsByCcs,
  type SubordinateDocente,
} from "@/hooks/useDatabase";
import { exportAgendasBatch, type BatchAgendaItem } from "@/lib/exportAgenda";
import { toast } from "sonner";
import { getDocenteFullName } from "@/types/docentePlanta";

interface DownloadAgendasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Records of the currently signed-in user (for "Yo" download). */
  ownRecords: any[];
  ownSchedule: any;
}

type StatusBadgeProps = { status?: string };
const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) return <Badge variant="outline" className="text-[10px]">Sin diligenciar</Badge>;
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    approved: { label: "Aprobada", cls: "bg-green-100 text-green-800 border-green-300" },
    returned: { label: "Devuelta", cls: "bg-red-100 text-red-800 border-red-300" },
  };
  const m = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
};

export function DownloadAgendasDialog({ open, onOpenChange, ownRecords, ownSchedule }: DownloadAgendasDialogProps) {
  const { user, roleName } = useAuth();
  const { t } = useLanguage();

  const isVicerrector = roleName === "VicerrectorAcadémico";
  const isDecano = roleName === "DecanoFacultad";
  const isDirector = roleName === "DirectorPrograma";
  const isDocente = roleName === "DocentePlanta";

  // Data sources per role
  const { data: faculties = [] } = useFaculties();
  const { data: subordinates = [] } = useSubordinatesWithNames(isDirector ? user?.id : undefined);

  // Decano: docentes from his own faculty (need user.id_faculty — fallback: pick first)
  // We don't have the user's facultyId in AuthContext; for Decano we let them pick a faculty too.
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const facultyIdForQuery = isVicerrector || isDecano ? Number(selectedFaculty) || null : null;
  const { data: facultyDocentes = [] } = useDocentesByFaculty(facultyIdForQuery);

  // Compose the list of selectable docentes per role
  const candidates: SubordinateDocente[] = useMemo(() => {
    if (isDocente) return [];
    if (isDirector) return subordinates;
    if (isDecano || isVicerrector) return facultyDocentes;
    return [];
  }, [isDocente, isDirector, isDecano, isVicerrector, subordinates, facultyDocentes]);

  // Selection state
  const [selectedCcs, setSelectedCcs] = useState<Set<string>>(new Set());
  const [includeSelf, setIncludeSelf] = useState(false);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((d) => {
      const full = getDocenteFullName(d).toLowerCase();
      return full.includes(q) || d.id.includes(q);
    });
  }, [candidates, search]);

  const toggle = (cc: string) => {
    setSelectedCcs((prev) => {
      const next = new Set(prev);
      if (next.has(cc)) next.delete(cc); else next.add(cc);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCcs.size === filtered.length) setSelectedCcs(new Set());
    else setSelectedCcs(new Set(filtered.map((d) => d.id)));
  };

  // Fetch most-recent agenda_view for every selected CC
  const ccsToFetch = Array.from(selectedCcs);
  const { data: viewsByCc = {}, isLoading: loadingViews } = useAgendaViewsByCcs(ccsToFetch);

  const handleDownload = async () => {
    if (!user) return;
    const items: BatchAgendaItem[] = [];

    if (isDocente || includeSelf) {
      items.push({
        user,
        selectedDocente: null,
        records: ownRecords,
        schedule: ownSchedule,
      });
    }

    let missing = 0;
    for (const cc of ccsToFetch) {
      const docente = candidates.find((d) => d.id === cc);
      if (!docente) continue;
      const view = viewsByCc[cc];
      if (!view || !Array.isArray(view.records) || view.records.length === 0) {
        missing++;
        continue;
      }
      items.push({
        user,
        selectedDocente: {
          id: docente.id,
          firstName: docente.firstName,
          secondName: docente.secondName,
          firstLastName: docente.firstLastName,
          secondLastName: docente.secondLastName,
        },
        records: view.records as any[],
        schedule: null, // schedule not stored in agenda_views
      });
    }

    if (items.length === 0) {
      toast.error("No hay agendas con datos para descargar");
      return;
    }

    setDownloading(true);
    try {
      await exportAgendasBatch(items, { zipName: "Agendas_UCP" });
      toast.success(
        items.length === 1
          ? "Agenda descargada"
          : `${items.length} agendas comprimidas en ZIP`
      );
      if (missing > 0) toast.warning(`${missing} docente(s) sin agenda diligenciada`);
      onOpenChange(false);
      setSelectedCcs(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Error generando la descarga");
    } finally {
      setDownloading(false);
    }
  };

  const totalCount = (isDocente || includeSelf ? 1 : 0) + selectedCcs.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Descargar agendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Docente: only own agenda */}
          {isDocente && (
            <p className="text-sm text-muted-foreground">
              Se descargará tu agenda con los datos actuales del formulario.
            </p>
          )}

          {/* Director: include "Yo" + subordinates */}
          {isDirector && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/40">
              <Checkbox
                id="self"
                checked={includeSelf}
                onCheckedChange={(v) => setIncludeSelf(!!v)}
              />
              <label htmlFor="self" className="text-sm font-medium cursor-pointer flex-1">
                Mi agenda
              </label>
            </div>
          )}

          {/* Vicerrector / Decano: choose faculty first */}
          {(isVicerrector || isDecano) && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Facultad
              </label>
              <Select value={selectedFaculty} onValueChange={(v) => { setSelectedFaculty(v); setSelectedCcs(new Set()); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una facultad" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Docente list with search */}
          {!isDocente && (candidates.length > 0 || search) && (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-9"
                  placeholder="Buscar por nombre o cédula"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="hover:text-primary font-medium"
                >
                  {selectedCcs.size === filtered.length && filtered.length > 0
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </button>
                <span>{selectedCcs.size} de {filtered.length}</span>
              </div>

              <ScrollArea className="h-[260px] border rounded">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {(isVicerrector || isDecano) && !selectedFaculty
                      ? "Selecciona una facultad para ver los docentes"
                      : "No hay docentes"}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {filtered.map((d) => {
                      const view = viewsByCc[d.id];
                      const checked = selectedCcs.has(d.id);
                      return (
                        <li key={d.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(d.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getDocenteFullName(d)}</p>
                            <p className="text-xs text-muted-foreground">CC {d.id}</p>
                          </div>
                          {checked && <StatusBadge status={view?.status} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            </>
          )}

          {!isDocente && totalCount > 1 && (
            <p className="text-xs text-muted-foreground">
              Se generará un archivo ZIP con {totalCount} agendas.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading || (totalCount === 0 && !isDocente) || loadingViews}
            className="gap-2"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isDocente ? "Descargar mi agenda" : `Descargar (${totalCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
