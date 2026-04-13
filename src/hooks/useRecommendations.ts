import { useMemo } from "react";
import { Record as AgendaRecord } from "@/types/agenda";

// Activity name constants (must match DB exactly)
const INV_PRINCIPAL = "Investigador principal";
const CO_INVESTIGADOR = "Co-investigador";

const ADMIN_DIR_DEPTO = "Director de departamento";
const ADMIN_DIR_PREGRADO = "Director de programa pregrado";
const ADMIN_DIR_POSGRADO = "Director de programa posgrado";
const ADMIN_COORD_AREA = "Coordinador de área";
const ADMIN_DIR_DOCTORADO = "Director de programa doctorado";
const ADMIN_DECANO = "Decano de Facultad";
const ADMIN_VICERRECTOR = "Vicerrector académico";

const FORM_MAESTRIA = "Estudios maestría";
const FORM_PEDAGOGICOS = "Estudios Pedagogicos";
const FORM_DOCTORADO = "Estudios doctorado";

interface Recommendation {
  hours: number;
  subjects: number;
}

/**
 * Calculates dynamic recommendations for docencia directa
 * based on records in investigacion, administrativas, and formacion-docentes.
 * 
 * Priority: Admin/Formacion override Investigation values (don't accumulate).
 */
export function useRecommendations(records: AgendaRecord[], userRolId?: number): Recommendation {
  return useMemo(() => {
    const defaults: Recommendation = { hours: 16, subjects: 5 };

    // Count investigation records
    const invRecords = records.filter(r => r.subfunctionId === "investigacion");
    const principalCount = invRecords.filter(r => String(r.data["actividad"]) === INV_PRINCIPAL).length;
    const coInvCount = invRecords.filter(r => String(r.data["actividad"]) === CO_INVESTIGADOR).length;

    // Count admin records
    const adminRecords = records.filter(r => r.subfunctionId === "administrativas");
    const adminActivities = adminRecords.map(r => String(r.data["actividad"]));

    // Count formacion records
    const formRecords = records.filter(r => r.subfunctionId === "formacion-docentes");
    const formActivities = formRecords.map(r => String(r.data["actividad"]));

    // --- Formación docentes (any role, overrides investigation) ---
    const hasMaestria = formActivities.includes(FORM_MAESTRIA);
    const hasPedagogicos = formActivities.includes(FORM_PEDAGOGICOS);
    const hasDoctorado = formActivities.includes(FORM_DOCTORADO);

    if (hasDoctorado) return { hours: 8, subjects: 2 };
    if (hasMaestria) return { hours: 12, subjects: 4 };
    if (hasPedagogicos) return { hours: 13, subjects: 4 };

    // --- Administrativas (role-specific, overrides investigation) ---
    const hasAdminActivity = adminRecords.length > 0;
    if (hasAdminActivity) {
      const hasDirDepto = adminActivities.includes(ADMIN_DIR_DEPTO);
      const hasDirPregrado = adminActivities.includes(ADMIN_DIR_PREGRADO);
      const dirPosgradoCount = adminActivities.filter(a => a === ADMIN_DIR_POSGRADO).length;
      const hasCoordArea = adminActivities.includes(ADMIN_COORD_AREA);
      const hasDirDoctorado = adminActivities.includes(ADMIN_DIR_DOCTORADO);
      const hasDecano = adminActivities.includes(ADMIN_DECANO);
      const hasVicerrector = adminActivities.includes(ADMIN_VICERRECTOR);

      // Decano / Vicerrector / Dir doctorado → 2h, 1 asignatura
      if (hasDecano || hasVicerrector || hasDirDoctorado) return { hours: 2, subjects: 1 };

      // Director depto or pregrado → 6h, 2
      if (hasDirDepto || hasDirPregrado) return { hours: 6, subjects: 2 };

      // Director posgrado
      if (dirPosgradoCount >= 2) return { hours: 6, subjects: 3 };
      if (dirPosgradoCount === 1) return { hours: 11, subjects: 4 };

      // Coordinador área
      if (hasCoordArea) return { hours: 13, subjects: 4 };
    }

    // --- Investigación (any role) ---
    if (principalCount > 0 || coInvCount > 0) {
      // 1 principal + 2 co-inv
      if (principalCount >= 1 && coInvCount >= 2) return { hours: 3, subjects: 1 };
      // 2 principal
      if (principalCount >= 2) return { hours: 4, subjects: 1 };
      // 1 principal
      if (principalCount === 1 && coInvCount === 0) return { hours: 10, subjects: 3 };
      // 3 co-inv
      if (coInvCount >= 3) return { hours: 6, subjects: 2 };
      // 2 co-inv
      if (coInvCount === 2 && principalCount === 0) return { hours: 9, subjects: 3 };
      // 1 co-inv
      if (coInvCount === 1 && principalCount === 0) return { hours: 13, subjects: 4 };
    }

    return defaults;
  }, [records, userRolId]);
}

/**
 * Returns the set of blocked activity names for investigation dropdown.
 */
export function getBlockedInvestigationActivities(records: AgendaRecord[]): Set<string> {
  const invRecords = records.filter(r => r.subfunctionId === "investigacion");
  const principalCount = invRecords.filter(r => String(r.data["actividad"]) === INV_PRINCIPAL).length;
  const coInvCount = invRecords.filter(r => String(r.data["actividad"]) === CO_INVESTIGADOR).length;

  const blocked = new Set<string>();

  // Max 2 principal, max 3 co-inv
  if (principalCount >= 2) blocked.add(INV_PRINCIPAL);
  if (coInvCount >= 3) blocked.add(CO_INVESTIGADOR);

  // Mutual exclusion at limits
  if (principalCount >= 2) blocked.add(CO_INVESTIGADOR);
  if (coInvCount >= 3) blocked.add(INV_PRINCIPAL);

  // 1 principal + 2 co-inv → block both
  if (principalCount >= 1 && coInvCount >= 2) {
    blocked.add(INV_PRINCIPAL);
    blocked.add(CO_INVESTIGADOR);
  }

  return blocked;
}

/**
 * Returns the set of blocked activity names for administrative dropdown.
 */
export function getBlockedAdminActivities(records: AgendaRecord[]): Set<string> {
  const adminRecords = records.filter(r => r.subfunctionId === "administrativas");
  const blocked = new Set<string>();

  if (adminRecords.length === 0) return blocked;

  const activities = adminRecords.map(r => String(r.data["actividad"]));
  const dirPosgradoCount = activities.filter(a => a === ADMIN_DIR_POSGRADO).length;
  const hasNonPosgrado = activities.some(a => a !== ADMIN_DIR_POSGRADO);

  const ALL_ADMIN = [ADMIN_DIR_DEPTO, ADMIN_DIR_PREGRADO, ADMIN_DIR_POSGRADO, ADMIN_COORD_AREA, ADMIN_DIR_DOCTORADO, ADMIN_DECANO, ADMIN_VICERRECTOR];

  if (hasNonPosgrado) {
    // Block everything except dir posgrado
    ALL_ADMIN.forEach(a => { if (a !== ADMIN_DIR_POSGRADO) blocked.add(a); });
  }

  if (dirPosgradoCount >= 2) {
    // Block all
    ALL_ADMIN.forEach(a => blocked.add(a));
  }

  return blocked;
}

/**
 * Returns the set of blocked activity names for formacion-docentes dropdown.
 */
export function getBlockedFormacionActivities(records: AgendaRecord[]): Set<string> {
  const formRecords = records.filter(r => r.subfunctionId === "formacion-docentes");
  if (formRecords.length === 0) return new Set();

  // If any activity exists, block all others (max 1)
  // We block everything — the existing one won't appear as "blocked" because it's already selected
  const ALL_FORMACION = [FORM_MAESTRIA, FORM_PEDAGOGICOS, FORM_DOCTORADO];
  return new Set(ALL_FORMACION);
}

/**
 * Check if a form (subfunctionId) is blocked because "Estudios doctorado" is active.
 */
export function isFormBlockedByDoctorado(records: AgendaRecord[], subfunctionId: string): boolean {
  const blockedForms = ["investigacion", "proyeccion-social", "administrativas"];
  if (!blockedForms.includes(subfunctionId)) return false;

  return records.some(
    r => r.subfunctionId === "formacion-docentes" && String(r.data["actividad"]) === FORM_DOCTORADO
  );
}
