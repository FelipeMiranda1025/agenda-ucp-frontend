import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DbDocenteSemesterConfig, DocenteResponses, ConflictResult, HoursCalculation, QuestionDef } from "@/types/docenteConfig";

const CURRENT_SEMESTER = "2025-1";

// =============================================
// Definición de preguntas
// =============================================

export const QUESTIONS: QuestionDef[] = [
  {
    key: "investPrincipal1",
    label: "1 proyecto",
    type: "checkbox",
    group: "investPrincipal",
    groupLabel: "¿Eres investigador principal?",
  },
  {
    key: "investPrincipal2",
    label: "2 proyectos",
    type: "checkbox",
    group: "investPrincipal",
  },
  {
    key: "coInvestigador1",
    label: "1 proyecto",
    type: "checkbox",
    group: "coInvestigador",
    groupLabel: "¿Eres co-investigador?",
  },
  {
    key: "coInvestigador2",
    label: "2 proyectos",
    type: "checkbox",
    group: "coInvestigador",
  },
  {
    key: "isJefeDeptoPregrado",
    label: "¿Eres jefe de departamento o director de programa de pregrado?",
    type: "checkbox",
  },
  {
    key: "dirPosgrado1",
    label: "1 programa",
    type: "checkbox",
    group: "dirPosgrado",
    groupLabel: "¿Eres director de posgrado?",
  },
  {
    key: "dirPosgrado2",
    label: "2 programas",
    type: "checkbox",
    group: "dirPosgrado",
  },
  {
    key: "isCoordinadorArea",
    label: "¿Eres coordinador de área?",
    type: "checkbox",
  },
  {
    key: "isDirectorDoctorado",
    label: "¿Eres director de doctorado?",
    type: "checkbox",
  },
  {
    key: "isDecano",
    label: "¿Eres decano de facultad?",
    type: "checkbox",
  },
  {
    key: "isVicerrector",
    label: "¿Eres vicerrector académico?",
    type: "checkbox",
  },
  {
    key: "isFormacionDoctorado",
    label: "¿Estás en formación de doctorado?",
    type: "checkbox",
  },
  {
    key: "isFormacionMaestria",
    label: "¿Estás en formación de maestría?",
    type: "checkbox",
  },
  {
    key: "isFormacionPedagogica",
    label: "¿Estás en formación pedagógica?",
    type: "checkbox",
  },
];

// =============================================
// Reglas de bloqueo
// =============================================

export function getDisabledKeys(r: DocenteResponses): Set<keyof DocenteResponses> {
  const disabled = new Set<keyof DocenteResponses>();

  // Formación doctorado bloquea TODO lo demás
  if (r.isFormacionDoctorado) {
    const allKeys: (keyof DocenteResponses)[] = [
      "investPrincipal1", "investPrincipal2", "coInvestigador1", "coInvestigador2",
      "isJefeDeptoPregrado", "dirPosgrado1", "dirPosgrado2", "isCoordinadorArea",
      "isDirectorDoctorado", "isDecano", "isVicerrector", "isFormacionMaestria", "isFormacionPedagogica",
    ];
    allKeys.forEach((k) => disabled.add(k));
    return disabled;
  }

  // investPrincipal2 bloquea co-investigador
  if (r.investPrincipal2) {
    disabled.add("coInvestigador1");
    disabled.add("coInvestigador2");
  }

  // coInvestigador2 bloquea invest principal
  if (r.coInvestigador2) {
    disabled.add("investPrincipal1");
    disabled.add("investPrincipal2");
  }

  // Max 2 projects rule: if invest1 + coInvest1 selected, block the "2" versions
  if (r.investPrincipal1 && r.coInvestigador1) {
    disabled.add("investPrincipal2");
    disabled.add("coInvestigador2");
  }

  return disabled;
}

// =============================================
// Motor de cálculo de horas
// =============================================

export function calculateHours(r: DocenteResponses): HoursCalculation {
  let directHours = 16;
  let investigationHours = 0;
  let recommendedSubjects = 5; // default for 16h
  const reductions: { label: string; hours: number }[] = [];

  // Formación doctorado → override everything
  if (r.isFormacionDoctorado) {
    return { directHours: 8, reductions: [], finalDirectHours: 8, investigationHours: 15, recommendedSubjects: 2 };
  }

  // Director doctorado / Decano / Vicerrector → 4h, 1 asignatura
  if (r.isDirectorDoctorado || r.isDecano || r.isVicerrector) {
    return { directHours: 4, reductions: [], finalDirectHours: 4, investigationHours: 0, recommendedSubjects: 1 };
  }

  // Research combinations
  const hasIP1 = r.investPrincipal1 && !r.investPrincipal2;
  const hasIP2 = r.investPrincipal2;
  const hasCI1 = r.coInvestigador1 && !r.coInvestigador2;
  const hasCI2 = r.coInvestigador2;

  if (hasIP1 && hasCI1) {
    // IP1 + CI1
    directHours = 6;
    recommendedSubjects = 3;
    investigationHours = 17; // combined
  } else if (hasIP2) {
    directHours = 4;
    recommendedSubjects = 1;
    investigationHours = 22;
  } else if (hasCI2) {
    directHours = 9;
    recommendedSubjects = 3;
    investigationHours = 12;
  } else if (hasIP1) {
    directHours = 10;
    recommendedSubjects = 3;
    investigationHours = 11;
  } else if (hasCI1) {
    directHours = 13;
    recommendedSubjects = 4;
    investigationHours = 6;
  } else if (r.isJefeDeptoPregrado) {
    directHours = 6;
    recommendedSubjects = 2;
  } else if (r.dirPosgrado2) {
    directHours = 6;
    recommendedSubjects = 3;
  } else if (r.dirPosgrado1) {
    directHours = 11;
    recommendedSubjects = 4;
  } else if (r.isCoordinadorArea) {
    directHours = 13;
    recommendedSubjects = 4;
  } else if (r.isFormacionMaestria) {
    directHours = 12;
    recommendedSubjects = 4;
    investigationHours = 7;
  } else if (r.isFormacionPedagogica) {
    directHours = 13;
    recommendedSubjects = 4;
  }

  const finalDirectHours = Math.max(0, directHours - reductions.reduce((s, r) => s + r.hours, 0));

  return { directHours, reductions, finalDirectHours, investigationHours, recommendedSubjects };
}

// =============================================
// Motor de detección de conflictos
// =============================================

export function detectConflicts(r: DocenteResponses, _rolId: number): ConflictResult[] {
  const results: ConflictResult[] = [];

  // Formación doctorado + anything else
  if (r.isFormacionDoctorado) {
    const otherKeys: (keyof DocenteResponses)[] = [
      "investPrincipal1", "investPrincipal2", "coInvestigador1", "coInvestigador2",
      "isJefeDeptoPregrado", "dirPosgrado1", "dirPosgrado2", "isCoordinadorArea",
      "isDirectorDoctorado", "isDecano", "isVicerrector", "isFormacionMaestria", "isFormacionPedagogica",
    ];
    if (otherKeys.some((k) => r[k])) {
      results.push({
        type: "conflict",
        article: "Art. 6k",
        message: "Un docente en formación de doctorado no puede tener otros encargos ni proyectos de investigación.",
      });
    }
  }

  // IP + CI combo check
  if ((r.investPrincipal1 || r.investPrincipal2) && (r.coInvestigador1 || r.coInvestigador2)) {
    const totalProjects = (r.investPrincipal1 ? 1 : 0) + (r.investPrincipal2 ? 2 : 0) + (r.coInvestigador1 ? 1 : 0) + (r.coInvestigador2 ? 2 : 0);
    if (totalProjects > 2) {
      results.push({
        type: "conflict",
        article: "Art. 6, Nota",
        message: "El docente solo puede participar en máximo 2 proyectos de investigación.",
      });
    }
  }

  // IP1 + CI1 is valid (observation)
  if (r.investPrincipal1 && r.coInvestigador1) {
    results.push({
      type: "observation",
      article: "Art. 6, Nota",
      message: "El docente participa en 2 proyectos (1 como principal, 1 como co-investigador). Carga: 6h docencia directa.",
    });
  }

  // Formación maestría + formación doctorado
  if (r.isFormacionMaestria && r.isFormacionDoctorado) {
    results.push({
      type: "warning",
      article: "Art. 6",
      message: "No es posible estar en formación de maestría y doctorado simultáneamente.",
    });
  }

  return results;
}

// =============================================
// Cálculo de horas semanales para director posgrado x2 en resumen
// =============================================

export function getPosgradoSummaryHours(r: DocenteResponses): number | null {
  if (r.dirPosgrado2) return 17; // special case: 17h instead of 9+9=18
  return null;
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
