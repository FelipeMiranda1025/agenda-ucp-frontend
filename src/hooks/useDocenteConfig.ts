import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { DbDocenteSemesterConfig, DocenteResponses, ConflictResult, HoursCalculation, QuestionDef } from "@/types/docenteConfig";

const CURRENT_SEMESTER = "2025-1";

// =============================================
// Definición de preguntas
// =============================================

export const QUESTIONS: QuestionDef[] = [
  { key: "investPrincipal1", label: "1 proyecto", type: "checkbox", group: "investPrincipal", groupLabel: "¿Eres investigador principal?" },
  { key: "investPrincipal2", label: "2 proyectos", type: "checkbox", group: "investPrincipal" },
  { key: "coInvestigador1", label: "1 proyecto", type: "checkbox", group: "coInvestigador", groupLabel: "¿Eres co-investigador?" },
  { key: "coInvestigador2", label: "2 proyectos", type: "checkbox", group: "coInvestigador" },
  { key: "isJefeDeptoPregrado", label: "¿Eres jefe de departamento o director de programa de pregrado?", type: "checkbox" },
  { key: "dirPosgrado1", label: "1 programa", type: "checkbox", group: "dirPosgrado", groupLabel: "¿Eres director de posgrado?" },
  { key: "dirPosgrado2", label: "2 programas", type: "checkbox", group: "dirPosgrado" },
  { key: "isCoordinadorArea", label: "¿Eres coordinador de área?", type: "checkbox" },
  { key: "isDirectorDoctorado", label: "¿Eres director de doctorado?", type: "checkbox" },
  { key: "isDecano", label: "¿Eres decano de facultad?", type: "checkbox" },
  { key: "isVicerrector", label: "¿Eres vicerrector académico?", type: "checkbox" },
  { key: "isFormacionDoctorado", label: "¿Estás en formación de doctorado?", type: "checkbox" },
  { key: "isFormacionMaestria", label: "¿Estás en formación de maestría?", type: "checkbox" },
  { key: "isFormacionPedagogica", label: "¿Estás en formación pedagógica?", type: "checkbox" },
];

// =============================================
// Reglas de bloqueo
// =============================================

export function getDisabledKeys(r: DocenteResponses): Set<keyof DocenteResponses> {
  const disabled = new Set<keyof DocenteResponses>();

  if (r.isFormacionDoctorado) {
    const allKeys: (keyof DocenteResponses)[] = [
      "investPrincipal1", "investPrincipal2", "coInvestigador1", "coInvestigador2",
      "isJefeDeptoPregrado", "dirPosgrado1", "dirPosgrado2", "isCoordinadorArea",
      "isDirectorDoctorado", "isDecano", "isVicerrector", "isFormacionMaestria", "isFormacionPedagogica",
    ];
    allKeys.forEach((k) => disabled.add(k));
    return disabled;
  }

  if (r.investPrincipal2) {
    disabled.add("coInvestigador1");
    disabled.add("coInvestigador2");
  }

  if (r.coInvestigador2) {
    disabled.add("investPrincipal1");
    disabled.add("investPrincipal2");
  }

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
  let recommendedSubjects = 5;
  const reductions: { label: string; hours: number }[] = [];

  if (r.isFormacionDoctorado) {
    return { directHours: 8, reductions: [], finalDirectHours: 8, investigationHours: 15, recommendedSubjects: 2 };
  }

  if (r.isDirectorDoctorado || r.isDecano || r.isVicerrector) {
    return { directHours: 4, reductions: [], finalDirectHours: 4, investigationHours: 0, recommendedSubjects: 1 };
  }

  const hasIP1 = r.investPrincipal1 && !r.investPrincipal2;
  const hasIP2 = r.investPrincipal2;
  const hasCI1 = r.coInvestigador1 && !r.coInvestigador2;
  const hasCI2 = r.coInvestigador2;

  if (hasIP1 && hasCI1) {
    directHours = 6; recommendedSubjects = 3; investigationHours = 17;
  } else if (hasIP2) {
    directHours = 4; recommendedSubjects = 1; investigationHours = 22;
  } else if (hasCI2) {
    directHours = 9; recommendedSubjects = 3; investigationHours = 12;
  } else if (hasIP1) {
    directHours = 10; recommendedSubjects = 3; investigationHours = 11;
  } else if (hasCI1) {
    directHours = 13; recommendedSubjects = 4; investigationHours = 6;
  } else if (r.isJefeDeptoPregrado) {
    directHours = 6; recommendedSubjects = 2;
  } else if (r.dirPosgrado2) {
    directHours = 6; recommendedSubjects = 3;
  } else if (r.dirPosgrado1) {
    directHours = 11; recommendedSubjects = 4;
  } else if (r.isCoordinadorArea) {
    directHours = 13; recommendedSubjects = 4;
  } else if (r.isFormacionMaestria) {
    directHours = 12; recommendedSubjects = 4; investigationHours = 7;
  } else if (r.isFormacionPedagogica) {
    directHours = 13; recommendedSubjects = 4;
  }

  const finalDirectHours = Math.max(0, directHours - reductions.reduce((s, r) => s + r.hours, 0));

  return { directHours, reductions, finalDirectHours, investigationHours, recommendedSubjects };
}

// =============================================
// Motor de detección de conflictos
// =============================================

export function detectConflicts(r: DocenteResponses, _rolId: number): ConflictResult[] {
  const results: ConflictResult[] = [];

  if (r.isFormacionDoctorado) {
    const otherKeys: (keyof DocenteResponses)[] = [
      "investPrincipal1", "investPrincipal2", "coInvestigador1", "coInvestigador2",
      "isJefeDeptoPregrado", "dirPosgrado1", "dirPosgrado2", "isCoordinadorArea",
      "isDirectorDoctorado", "isDecano", "isVicerrector", "isFormacionMaestria", "isFormacionPedagogica",
    ];
    if (otherKeys.some((k) => r[k])) {
      results.push({ type: "conflict", article: "Art. 6k", message: "Un docente en formación de doctorado no puede tener otros encargos ni proyectos de investigación." });
    }
  }

  if ((r.investPrincipal1 || r.investPrincipal2) && (r.coInvestigador1 || r.coInvestigador2)) {
    const totalProjects = (r.investPrincipal1 ? 1 : 0) + (r.investPrincipal2 ? 2 : 0) + (r.coInvestigador1 ? 1 : 0) + (r.coInvestigador2 ? 2 : 0);
    if (totalProjects > 2) {
      results.push({ type: "conflict", article: "Art. 6, Nota", message: "El docente solo puede participar en máximo 2 proyectos de investigación." });
    }
  }

  if (r.investPrincipal1 && r.coInvestigador1) {
    results.push({ type: "observation", article: "Art. 6, Nota", message: "El docente participa en 2 proyectos (1 como principal, 1 como co-investigador). Carga: 6h docencia directa." });
  }

  if (r.isFormacionMaestria && r.isFormacionDoctorado) {
    results.push({ type: "warning", article: "Art. 6", message: "No es posible estar en formación de maestría y doctorado simultáneamente." });
  }

  return results;
}

export function getPosgradoSummaryHours(r: DocenteResponses): number | null {
  if (r.dirPosgrado2) return 17;
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
      const list = await api.get<DbDocenteSemesterConfig[]>(
        `/docente-config${qs({ user_cc: userCc, semester_label: CURRENT_SEMESTER })}`
      );
      return list[0] ?? null;
    },
    enabled: !!userCc,
  });
}

export function useUpsertDocenteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: {
      user_cc: string;
      responses: Record<string, any>;
      computed_direct_hours: number;
      observations: string[];
      conflicts: string[];
      confirmed: boolean;
    }) =>
      api.post<DbDocenteSemesterConfig>("/docente-config", {
        ...config,
        semester_label: CURRENT_SEMESTER,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["docente_semester_config"] });
    },
  });
}
