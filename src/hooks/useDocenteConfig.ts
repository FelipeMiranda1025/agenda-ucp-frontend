import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DbDocenteSemesterConfig, DocenteResponses, ConflictResult, HoursCalculation, QuestionDef } from "@/types/docenteConfig";

const CURRENT_SEMESTER = "2025-1";

// =============================================
// Definición de preguntas por rol
// =============================================

export const QUESTIONS: QuestionDef[] = [
  {
    key: "isProduccionPendiente",
    label: "¿Tiene compromisos de producción intelectual pendientes del semestre anterior?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isInvestigadorPrincipal",
    label: "¿Es investigador principal de un proyecto aprobado por la DII?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isCoInvestigador",
    label: "¿Participa como co-investigador en un proyecto aprobado?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isFormacionDoctorado",
    label: "¿Está en formación de doctorado?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isFormacionMaestria",
    label: "¿Está en formación de maestría?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isCoordinadorArea",
    label: "¿Tiene a cargo la coordinación de un área?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isFormacionPedagogica",
    label: "¿Participa en procesos de formación pedagógica avalados por Vicerrectoría?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isDirectorDoctorado",
    label: "¿Dirige un programa de Doctorado?",
    type: "checkbox",
    visibleForRoles: [1, 2, 3, 4],
  },
  {
    key: "isDecano",
    label: "¿Ejerce como Decano de Facultad?",
    type: "checkbox",
    visibleForRoles: [3],
  },
  {
    key: "isVicerrector",
    label: "¿Ejerce como Vicerrector Académico?",
    type: "checkbox",
    visibleForRoles: [4],
  },
  {
    key: "isDirectorPregrado",
    label: "¿Es director de un programa de pregrado?",
    type: "checkbox",
    visibleForRoles: [2],
  },
  {
    key: "isDirectorPosgrado",
    label: "¿Tiene a cargo la dirección de un programa de posgrado?",
    type: "checkbox",
    visibleForRoles: [2],
  },
  {
    key: "cantidadPosgrados",
    label: "¿Cuántos programas de posgrado dirige? (máximo 2)",
    type: "number",
    visibleForRoles: [2],
    dependsOn: "isDirectorPosgrado",
    min: 1,
    max: 2,
  },
];

// =============================================
// Motor de cálculo de horas (Art. 6)
// =============================================

export function calculateHours(r: DocenteResponses): HoursCalculation {
  let directHours = 16; // default (Art. 6d)
  let investigationHours = 0;
  const reductions: { label: string; hours: number }[] = [];

  // Prioridad 1: Producción pendiente → 16h forzadas, sin investigación (Art. 6c)
  if (r.isProduccionPendiente) {
    return { directHours: 16, reductions: [], finalDirectHours: 16, investigationHours: 0 };
  }

  // Determinar base de horas según condición principal
  if (r.isDecano || r.isVicerrector || r.isDirectorDoctorado) {
    // Art. 6h: 1 curso asignado (~3-4h). Usamos 4h como referencia
    directHours = 4;
  } else if (r.isDirectorPregrado) {
    // Art. 6e: 6h
    directHours = 6;
  } else if (r.isFormacionDoctorado) {
    // Art. 6i: hasta 8h
    directHours = 8;
    investigationHours = 15;
  } else if (r.isFormacionMaestria) {
    // Art. 6j: hasta 12h
    directHours = 12;
    investigationHours = 7;
  } else if (r.isInvestigadorPrincipal) {
    // Art. 6a: 10h
    directHours = 10;
    investigationHours = 11;
  } else if (r.isCoInvestigador) {
    // Art. 6b: 13h
    directHours = 13;
    investigationHours = 6;
  }

  // Reducciones acumulables (solo si no es Decano/Vicerrector/DirectorDoctorado)
  if (!r.isDecano && !r.isVicerrector && !r.isDirectorDoctorado) {
    // Art. 6f: Dirección de posgrado (-5h por cada, máx 2)
    if (r.isDirectorPosgrado) {
      const qty = Math.min(r.cantidadPosgrados || 1, 2);
      const reduction = qty * 5;
      reductions.push({ label: `Dirección de ${qty} programa(s) de posgrado`, hours: reduction });
    }

    // Art. 6g: Coordinación de área (-3h)
    if (r.isCoordinadorArea) {
      reductions.push({ label: "Coordinación de área", hours: 3 });
    }

    // Art. 6l: Formación pedagógica (-3h)
    if (r.isFormacionPedagogica) {
      reductions.push({ label: "Formación pedagógica institucional", hours: 3 });
    }
  }

  const totalReduction = reductions.reduce((s, r) => s + r.hours, 0);
  const finalDirectHours = Math.max(0, directHours - totalReduction);

  return { directHours, reductions, finalDirectHours, investigationHours };
}

// =============================================
// Motor de detección de conflictos
// =============================================

export function detectConflicts(r: DocenteResponses, rolId: number): ConflictResult[] {
  const results: ConflictResult[] = [];

  // Investigador principal + Co-investigador
  if (r.isInvestigadorPrincipal && r.isCoInvestigador) {
    results.push({
      type: "observation",
      article: "Art. 6, Nota",
      message: "El docente participa en múltiples proyectos de investigación. Esta situación será valorada directamente por la Vicerrectoría Académica, el Decano de Facultad, el Director de Programa y la Dirección de Investigación e Innovación.",
    });
  }

  // Formación doctorado + Investigador/Co-investigador (Art. 6k)
  if (r.isFormacionDoctorado && (r.isInvestigadorPrincipal || r.isCoInvestigador)) {
    results.push({
      type: "conflict",
      article: "Art. 6k",
      message: "Según el Artículo 6º punto k, un docente en formación de doctorado no puede tener a cargo proyectos de investigación.",
    });
  }

  // Formación doctorado + cargos administrativos (Art. 6k)
  if (r.isFormacionDoctorado && (r.isDirectorPregrado || r.isDirectorPosgrado || r.isCoordinadorArea || r.isDecano)) {
    results.push({
      type: "conflict",
      article: "Art. 6k",
      message: "Según el Artículo 6º punto k, un docente en formación de doctorado no puede tener encargos académico-administrativos.",
    });
  }

  // Producción pendiente + Investigador/Co-investigador (Art. 6c)
  if (r.isProduccionPendiente && (r.isInvestigadorPrincipal || r.isCoInvestigador)) {
    results.push({
      type: "conflict",
      article: "Art. 6c",
      message: "Según el Artículo 6º punto c, al docente con compromisos de producción intelectual pendientes le será suspendida la asignación de tiempo para investigación y deberá asumir 16 horas de docencia directa.",
    });
  }

  // Formación maestría + formación doctorado simultáneo
  if (r.isFormacionMaestria && r.isFormacionDoctorado) {
    results.push({
      type: "warning",
      article: "Art. 6",
      message: "No es posible estar en formación de maestría y doctorado simultáneamente.",
    });
  }

  // Director de más de 2 posgrados
  if (r.isDirectorPosgrado && r.cantidadPosgrados > 2) {
    results.push({
      type: "warning",
      article: "Art. 6f, Nota",
      message: "Un docente puede asumir máximo 2 direcciones de posgrado.",
    });
  }

  return results;
}

// =============================================
// Hooks de base de datos
// =============================================

export function useDocenteConfig(userCc?: string) {
  return useQuery<DbDocenteSemesterConfig | null>({
    queryKey: ["docente_semester_config", userCc, CURRENT_SEMESTER],
    queryFn: async () => {
      if (!userCc) return null;
      const { data, error } = await (supabase
        .from("docente_semester_config" as any)
        .select("*") as any)
        .eq("user_cc", userCc)
        .eq("semester_label", CURRENT_SEMESTER)
        .maybeSingle();
      if (error) throw error;
      return data as DbDocenteSemesterConfig | null;
    },
    enabled: !!userCc,
  });
}

export function useUpsertDocenteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      user_cc: string;
      responses: Record<string, any>;
      computed_direct_hours: number;
      observations: string[];
      conflicts: string[];
      confirmed: boolean;
    }) => {
      const { data, error } = await (supabase
        .from("docente_semester_config" as any) as any)
        .upsert(
          {
            ...config,
            semester_label: CURRENT_SEMESTER,
          },
          { onConflict: "user_cc,semester_label" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DbDocenteSemesterConfig;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["docente_semester_config"] });
    },
  });
}
