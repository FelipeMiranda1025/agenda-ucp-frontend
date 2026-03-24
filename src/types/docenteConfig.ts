/**
 * Tipos para el formulario condicional pre-agenda docente.
 * Basado en los Artículos 1-8 de la normativa institucional.
 */

export interface DocenteResponses {
  isInvestigadorPrincipal: boolean;
  isCoInvestigador: boolean;
  isFormacionDoctorado: boolean;
  isFormacionMaestria: boolean;
  isCoordinadorArea: boolean;
  isFormacionPedagogica: boolean;
  isProduccionPendiente: boolean;
  isDirectorDoctorado: boolean;
  isDecano: boolean;
  isVicerrector: boolean;
  // Solo para DirectorPrograma (id_rol=2)
  isDirectorPregrado: boolean;
  isDirectorPosgrado: boolean;
  cantidadPosgrados: number; // 1 o 2
}

export const DEFAULT_RESPONSES: DocenteResponses = {
  isInvestigadorPrincipal: false,
  isCoInvestigador: false,
  isFormacionDoctorado: false,
  isFormacionMaestria: false,
  isCoordinadorArea: false,
  isFormacionPedagogica: false,
  isProduccionPendiente: false,
  isDirectorDoctorado: false,
  isDecano: false,
  isVicerrector: false,
  isDirectorPregrado: false,
  isDirectorPosgrado: false,
  cantidadPosgrados: 1,
};

export interface QuestionDef {
  key: keyof DocenteResponses;
  label: string;
  type: 'checkbox' | 'number';
  visibleForRoles: number[]; // id_rol values
  dependsOn?: keyof DocenteResponses; // only show if this is true
  min?: number;
  max?: number;
}

export interface ConflictResult {
  type: 'conflict' | 'observation' | 'warning';
  message: string;
  article: string;
}

export interface HoursCalculation {
  directHours: number;
  reductions: { label: string; hours: number }[];
  finalDirectHours: number;
  investigationHours: number;
}

export interface DbDocenteSemesterConfig {
  id: string;
  user_cc: string;
  semester_label: string;
  responses: Record<string, any>;
  computed_direct_hours: number;
  observations: string[];
  conflicts: string[];
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}
