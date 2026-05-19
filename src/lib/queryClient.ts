import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** Tras cambiar de usuario, evitar datos de notificaciones del rol anterior. */
export function resetAgendaWorkflowQueries() {
  queryClient.removeQueries({ queryKey: ["pending_agenda_views_supervisor"] });
  queryClient.removeQueries({ queryKey: ["approved_agenda_ccs"] });
  queryClient.removeQueries({ queryKey: ["agenda_views"] });
}
