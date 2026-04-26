/**
 * Tipos para el formulario condicional pre-agenda docente.
 * Basado en los Artículos 1-8 de la normativa institucional.
 */

export interface DocenteResponses {
  investPrincipal1: boolean;
  investPrincipal2: boolean;
  coInvestigador1: boolean;
  coInvestigador2: boolean;
  isJefeDeptoPregrado: boolean;
  dirPosgrado1: boolean;
  dirPosgrado2: boolean;
  isCoordinadorArea: boolean;
  isDirectorDoctorado: boolean;
  isDecano: boolean;
  isVicerrector: boolean;
  isFormacionDoctorado: boolean;
  isFormacionMaestria: boolean;
  isFormacionPedagogica: boolean;
}

export const DEFAULT_RESPONSES: DocenteResponses = {
  investPrincipal1: false,
  investPrincipal2: false,
  coInvestigador1: false,
  coInvestigador2: false,
  isJefeDeptoPregrado: false,
  dirPosgrado1: false,
  dirPosgrado2: false,
  isCoordinadorArea: false,
  isDirectorDoctorado: false,
  isDecano: false,
  isVicerrector: false,
  isFormacionDoctorado: false,
  isFormacionMaestria: false,
  isFormacionPedagogica: false,
};

export interface QuestionDef {
  key: keyof DocenteResponses;
  label: string;
  type: 'checkbox';
  group?: string; // group questions with dual checkboxes
  groupLabel?: string;
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
  recommendedSubjects: number;
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
