import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardAgenda {
  id: string;
  docente_cc: string;
  subfunction_id: string;
  data: Record<string, any>;
  total_horas: number;
  created_at: string;
}

export interface DashboardAgendaView {
  id: string;
  user_cc: string;
  status: string; // pending | approved | returned
  reviewer_cc: string | null;
  reviewed_at: string | null;
  updated_at?: string;
  created_at: string;
  records?: Array<Record<string, any>>;
}

export interface DashboardUser {
  id: number;
  cc: string;
  first_name: string;
  second_name: string | null;
  first_last_name: string;
  second_last_name: string | null;
  id_faculty: number | null;
  id_professional_career: number | null;
  id_rol: number;
}

export interface DashboardFaculty {
  id: number;
  name: string;
}

export interface DashboardCareer {
  id: number;
  name: string;
  id_faculty: number | null;
}

export interface DashboardData {
  agendas: DashboardAgenda[];
  views: DashboardAgendaView[];
  users: DashboardUser[];
  faculties: DashboardFaculty[];
  careers: DashboardCareer[];
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const [views, users, faculties, careers] = await Promise.all([
        api.get<DashboardAgendaView[]>("/agenda-views?all=true&limit=10000"),
        api.get<DashboardUser[]>("/users?rols=1,2,3&id_state=1"),
        api.get<DashboardFaculty[]>("/faculties"),
        api.get<DashboardCareer[]>("/professional-careers"),
      ]);

      // Dashboard metrics must reflect the latest consolidated agenda per docente
      // (agenda_views.records), not legacy rows from public.agendas.
      const usersByCc = new Set(users.map((u) => u.cc));
      const latestViewByCc = new Map<string, DashboardAgendaView>();
      views.forEach((view) => {
        if (!usersByCc.has(view.user_cc)) return;
        const prev = latestViewByCc.get(view.user_cc);
        const currTs = new Date(view.updated_at || view.created_at).getTime();
        const prevTs = prev ? new Date(prev.updated_at || prev.created_at).getTime() : -1;
        if (!prev || currTs > prevTs) {
          latestViewByCc.set(view.user_cc, view);
        }
      });

      const agendas: DashboardAgenda[] = [];
      latestViewByCc.forEach((view) => {
        const records = Array.isArray(view.records) ? view.records : [];
        records.forEach((record: any) => {
          const totalHoras =
            Number(record?.totalHoras ?? record?.total_horas ?? 0) || 0;
          agendas.push({
            id: String(record?.id ?? `${view.user_cc}-${record?.subfunctionId ?? "sf"}-${agendas.length}`),
            docente_cc: view.user_cc,
            subfunction_id: String(record?.subfunctionId ?? record?.subfunction_id ?? ""),
            data: (record?.data ?? {}) as Record<string, any>,
            total_horas: totalHoras,
            created_at: String(record?.createdAt ?? record?.created_at ?? view.created_at),
          });
        });
      });

      return { agendas, views, users, faculties, careers };
    },
    staleTime: 60_000,
  });
}
