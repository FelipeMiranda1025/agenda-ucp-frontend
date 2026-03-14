/**
 * Tipos TypeScript que reflejan las tablas de la base de datos PostgreSQL.
 * Útiles para desarrollo local y futura dockerización.
 */

// =============================================
// CATÁLOGOS
// =============================================

export interface DbRole {
  id: number;
  name: string; // 'admin' | 'vicerrectoria' | 'decanatura' | 'docenteAdministrativo' | 'docentePlanta'
  description: string | null;
}

export interface DbState {
  id: number;
  name: string; // 'activo' | 'inactivo'
  description: string | null;
}

export interface DbSemester {
  id: number;
  number: number;
  description: string | null;
}

export interface DbFaculty {
  id: number;
  name: string;
  description: string | null;
}

export interface DbEducationLevel {
  id: number;
  name: string; // 'Pregrado' | 'Especialización' | 'Maestría' | 'Doctorado'
  description: string | null;
}

export interface DbProfessionalCareer {
  id: number;
  name: string;
  description: string | null;
}

// =============================================
// ACTIVIDADES (tablas con horas)
// =============================================

export interface DbActivityBase {
  id: number;
  name: string;
  weekly_hours: number;
  number_weeks: number;
}

export type DbIndirectTeaching = DbActivityBase;
export type DbInvestigation = DbActivityBase;
export type DbSocialProject = DbActivityBase;
export type DbTeacherTraining = DbActivityBase;
export type DbDegreeWork = DbActivityBase;
export type DbComplementaryActivity = DbActivityBase;
export type DbAdministrativeActivity = DbActivityBase;
export type DbAcademicPractice = DbActivityBase;

// =============================================
// ENTIDADES PRINCIPALES
// =============================================

export interface DbSubject {
  id: number;
  id_semester: number | null;
  id_education_level: number | null;
  id_state: number | null;
  id_faculty: number | null;
  id_professional_career: number | null;
  name: string;
  weekly_hours: number;
  number_weeks: number;
}

export interface DbUser {
  id: number;
  id_rol: number;
  id_state: number;
  first_name: string;
  second_name: string;
  first_last_name: string;
  second_last_name: string;
  password: string; // SHA-256 hash
  cc: string; // cédula (unique)
  email: string; // unique
}

export interface DbAgenda {
  id: string; // UUID
  user_id: number;
  docente_cc: string;
  subfunction_id: string;
  data: Record<string, any>; // JSONB
  total_horas: number;
  confirmed_at: string;
  semester_id: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Tipos para inserción (sin campos auto-generados)
// =============================================

export type DbAgendaInsert = Omit<DbAgenda, 'id' | 'confirmed_at' | 'created_at' | 'updated_at'>;
export type DbUserInsert = Omit<DbUser, 'id'>;

// =============================================
// Mapa de tablas para referencia
// =============================================

export const DB_TABLES = {
  roles: 'roles',
  states: 'states',
  semester: 'semester',
  faculties: 'faculties',
  education_levels: 'education_levels',
  professional_careers: 'professional_careers',
  indirect_teaching: 'indirect_teaching',
  investigations: 'investigations',
  social_projects: 'social_projects',
  teacher_training: 'teacher_training',
  degree_works: 'degree_works',
  complementary_activities: 'complementary_activities',
  administrative_activities: 'administrative_activities',
  academic_practices: 'academic_practices',
  subjects: 'subjects',
  users: 'users',
  agendas: 'agendas',
} as const;

export type DbTableName = keyof typeof DB_TABLES;
