import type { DbAgendaView } from "@/types/database";

/**
 * Reglas de acceso a distribución horaria (framework /schedule):
 *
 * - DocentePlanta (1) y DirectorPrograma (2): tras aprobación del decano
 *   (agenda pending con pending_reviewer_rol = 4) o aprobación final.
 * - DecanoFacultad (3): al enviar con Confirmar datos (status pending).
 * - VicerrectorAcadémico (4): al enviar con Confirmar datos (sin supervisor;
 *   status pending, normalmente pending_reviewer_rol null).
 */
export function canAccessScheduleDistribution(
  agendaView: Pick<DbAgendaView, "status" | "pending_reviewer_rol"> | null | undefined,
  ownerRolId: number | undefined
): boolean {
  if (!agendaView || ownerRolId == null) return false;
  if (agendaView.status === "returned") return false;
  if (agendaView.status === "approved") return true;
  if (agendaView.status !== "pending") return false;

  if (ownerRolId === 1 || ownerRolId === 2) {
    return agendaView.pending_reviewer_rol === 4;
  }

  if (ownerRolId === 3 || ownerRolId === 4) {
    return true;
  }

  return false;
}
