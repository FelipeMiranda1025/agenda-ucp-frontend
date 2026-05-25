import type { DbAgendaView } from "@/types/database";

/** Mensaje al enviar o reenviar agenda según el revisor asignado por el backend. */
export function agendaSentForReviewToastMessage(
  view: Pick<DbAgendaView, "pending_reviewer_rol"> | null | undefined,
  t: (key: string) => string
): string {
  const rol = view?.pending_reviewer_rol;
  if (rol === 4) return t("summary.agendaSentToVicerrector");
  if (rol === 3) return t("summary.agendaSentToDecano");
  if (rol === 2) return t("summary.agendaSentToDirector");
  return t("summary.agendaSentForReview");
}
