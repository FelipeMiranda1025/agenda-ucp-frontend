import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, XCircle, Info, CheckCircle, Clock } from "lucide-react";
import ucpLogoWhite from "@/assets/ucp-logo-white.png";
import {
  DEFAULT_RESPONSES,
  type DocenteResponses,
} from "@/types/docenteConfig";
import {
  QUESTIONS,
  calculateHours,
  detectConflicts,
  useUpsertDocenteConfig,
} from "@/hooks/useDocenteConfig";
import { getRoleName } from "@/types/auth";
import { toast } from "sonner";

interface Props {
  onConfirmed: () => void;
}

export const PreAgendaQuestionnaire: React.FC<Props> = ({ onConfirmed }) => {
  const { user } = useAuth();
  const rolId = user?.rolId ?? 1;
  const [responses, setResponses] = useState<DocenteResponses>({ ...DEFAULT_RESPONSES });
  const [saving, setSaving] = useState(false);
  const upsert = useUpsertDocenteConfig();

  const visibleQuestions = useMemo(
    () =>
      QUESTIONS.filter((q) => {
        if (!q.visibleForRoles.includes(rolId)) return false;
        if (q.dependsOn && !responses[q.dependsOn]) return false;
        return true;
      }),
    [rolId, responses]
  );

  const calc = useMemo(() => calculateHours(responses), [responses]);
  const conflicts = useMemo(() => detectConflicts(responses, rolId), [responses, rolId]);

  const toggle = (key: keyof DocenteResponses) => {
    setResponses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsert.mutateAsync({
        user_cc: user.id,
        responses: responses as any,
        computed_direct_hours: calc.finalDirectHours,
        observations: conflicts.filter((c) => c.type === "observation").map((c) => `[${c.article}] ${c.message}`),
        conflicts: conflicts.filter((c) => c.type !== "observation").map((c) => `[${c.article}] ${c.message}`),
        confirmed: true,
      });
      toast.success("Configuración guardada correctamente");
      onConfirmed();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const hasAnySelection = Object.entries(responses).some(
    ([key, val]) => key !== "cantidadPosgrados" && val === true
  );

  const conflictIcons = {
    conflict: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />,
    observation: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-background rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-primary px-6 py-6 flex flex-col items-center gap-2 shrink-0">
          <img src={ucpLogoWhite} alt="Logo UCP" className="h-12 w-auto object-contain" />
          <h2 className="text-primary-foreground text-lg font-bold text-center">
            Configuración Semestral
          </h2>
          <p className="text-primary-foreground/70 text-xs text-center">
            {user ? `${user.firstName} ${user.firstLastName}` : ""} — {getRoleName(rolId) || "Docente"}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-5">
            {/* Instructions */}
            <p className="text-sm text-muted-foreground">
              Seleccione las actividades y responsabilidades que tiene asignadas para este semestre.
              El sistema calculará automáticamente sus horas de docencia directa.
            </p>

            {/* Questions */}
            <div className="space-y-3">
              {visibleQuestions.map((q) => {
                if (q.type === "number") {
                  return (
                    <div key={q.key} className="flex items-center gap-3 pl-6">
                      <Label className="text-sm flex-1">{q.label}</Label>
                      <Input
                        type="number"
                        min={q.min}
                        max={q.max}
                        className="w-16 h-8 text-sm"
                        value={responses[q.key] as number}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            [q.key]: Math.min(q.max || 2, Math.max(q.min || 1, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                    </div>
                  );
                }
                return (
                  <div key={q.key} className="flex items-start gap-3">
                    <Checkbox
                      id={q.key}
                      checked={responses[q.key] as boolean}
                      onCheckedChange={() => toggle(q.key)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={q.key} className="text-sm leading-tight cursor-pointer">
                      {q.label}
                    </Label>
                  </div>
                );
              })}
            </div>

            {/* Results Summary */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Resumen de horas calculadas
              </h3>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas base de docencia directa:</span>
                  <span className="font-semibold">{calc.directHours}h/semana</span>
                </div>

                {calc.reductions.map((red, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span className="pl-2">− {red.label}:</span>
                    <span className="text-destructive font-medium">-{red.hours}h</span>
                  </div>
                ))}

                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Horas semanales de docencia directa:</span>
                  <span className="text-primary">{calc.finalDirectHours}h/semana</span>
                </div>

                {calc.investigationHours > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Horas de investigación registradas:</span>
                    <span>{calc.investigationHours}h/semana</span>
                  </div>
                )}
              </div>
            </div>

            {/* Conflicts & Observations */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Observaciones y conflictos</h3>
                {conflicts.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      c.type === "conflict"
                        ? "bg-destructive/10 border border-destructive/20"
                        : c.type === "warning"
                        ? "bg-yellow-500/10 border border-yellow-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                  >
                    {conflictIcons[c.type]}
                    <div>
                      <span className="font-medium">[{c.article}]</span> {c.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t shrink-0">
          <Button
            onClick={handleConfirm}
            className="w-full h-11 text-base font-semibold gap-2"
            disabled={saving}
          >
            <CheckCircle className="h-4 w-4" />
            {saving ? "Guardando..." : "Confirmar y continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
};
