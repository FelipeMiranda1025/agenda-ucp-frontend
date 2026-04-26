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
  created_at: string;
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
      const [agendas, views, users, faculties, careers] = await Promise.all([
        api.get<DashboardAgenda[]>("/agendas?limit=10000"),
        api.get<DashboardAgendaView[]>("/agenda-views?all=true&limit=10000"),
        api.get<DashboardUser[]>("/users?rols=1,2,3"),
        api.get<DashboardFaculty[]>("/faculties"),
        api.get<DashboardCareer[]>("/professional-careers"),
      ]);
      return { agendas, views, users, faculties, careers };
    },
    staleTime: 60_000,
  });
}
