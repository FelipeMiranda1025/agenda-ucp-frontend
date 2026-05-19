import { useMemo } from "react";
import { Record as AgendaRecord } from "@/types/agenda";
import { useRecommendationRules, RecommendationRule } from "@/hooks/useRecommendationRules";

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

// Hardcoded fallbacks (used when DB is empty / loading)
/** hours = ⌛ docencia directa; subjects = ✍🏼 horas semanales a registrar */
const FALLBACK: Record<string, Recommendation> = {
  form_doctorado: { hours: 8, subjects: 15 },
  form_maestria: { hours: 12, subjects: 7 },
  form_pedagogicos: { hours: 13, subjects: 13 },
  admin_decano_vicerrector_doctorado: { hours: 4, subjects: 4 },
  admin_dir_depto_pregrado: { hours: 6, subjects: 6 },
  admin_dir_posgrado_2: { hours: 6, subjects: 6 },
  admin_dir_posgrado_1: { hours: 7, subjects: 9 },
  admin_coord_area: { hours: 13, subjects: 6 },
  inv_1p_2c: { hours: 6, subjects: 17 },
  inv_2p: { hours: 4, subjects: 22 },
  inv_1p: { hours: 10, subjects: 11 },
  inv_3c: { hours: 6, subjects: 12 },
  inv_2c: { hours: 9, subjects: 12 },
  inv_1c: { hours: 13, subjects: 6 },
};

function getRule(rules: RecommendationRule[] | undefined, key: string): Recommendation {
  const r = rules?.find(x => x.rule_key === key && x.active !== false);
  if (r) return { hours: r.hours, subjects: r.subjects };
  return FALLBACK[key];
}

/**
 * Calculates dynamic recommendations for docencia directa
 * based on records in investigacion, administrativas, and formacion-docentes.
 *
 * Priority: Admin/Formacion override Investigation values (don't accumulate).
 */
export function useRecommendations(records: AgendaRecord[], userRolId?: number): Recommendation {
  const { data: rules } = useRecommendationRules();

  return useMemo(() => {
    const defaults: Recommendation = { hours: 16, subjects: 16 };

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

    if (hasDoctorado) return getRule(rules, "form_doctorado");
    if (hasMaestria) return getRule(rules, "form_maestria");
    if (hasPedagogicos) return getRule(rules, "form_pedagogicos");

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

      if (hasDecano || hasVicerrector || hasDirDoctorado) return getRule(rules, "admin_decano_vicerrector_doctorado");
      if (hasDirDepto || hasDirPregrado) return getRule(rules, "admin_dir_depto_pregrado");
      if (dirPosgradoCount >= 2) return getRule(rules, "admin_dir_posgrado_2");
      if (dirPosgradoCount === 1) return getRule(rules, "admin_dir_posgrado_1");
      if (hasCoordArea) return getRule(rules, "admin_coord_area");
    }

    // --- Investigación (any role) ---
    if (principalCount > 0 || coInvCount > 0) {
      if (principalCount >= 1 && coInvCount >= 2) return getRule(rules, "inv_1p_2c");
      if (principalCount >= 2) return getRule(rules, "inv_2p");
      if (principalCount === 1 && coInvCount === 0) return getRule(rules, "inv_1p");
      if (coInvCount >= 3) return getRule(rules, "inv_3c");
      if (coInvCount === 2 && principalCount === 0) return getRule(rules, "inv_2c");
      if (coInvCount === 1 && principalCount === 0) return getRule(rules, "inv_1c");
    }

    return defaults;
  }, [records, userRolId, rules]);
}

/**
 * Returns the set of blocked activity names for investigation dropdown.
 */
export function getBlockedInvestigationActivities(records: AgendaRecord[]): Set<string> {
  const invRecords = records.filter(r => r.subfunctionId === "investigacion");
  const principalCount = invRecords.filter(r => String(r.data["actividad"]) === INV_PRINCIPAL).length;
  const coInvCount = invRecords.filter(r => String(r.data["actividad"]) === CO_INVESTIGADOR).length;

  const blocked = new Set<string>();

  if (principalCount >= 2) blocked.add(INV_PRINCIPAL);
  if (coInvCount >= 3) blocked.add(CO_INVESTIGADOR);

  if (principalCount >= 2) blocked.add(CO_INVESTIGADOR);
  if (coInvCount >= 3) blocked.add(INV_PRINCIPAL);

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
    ALL_ADMIN.forEach(a => { if (a !== ADMIN_DIR_POSGRADO) blocked.add(a); });
  }

  if (dirPosgradoCount >= 2) {
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
