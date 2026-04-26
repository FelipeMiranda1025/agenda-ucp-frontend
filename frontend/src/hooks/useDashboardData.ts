import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      const [agendasRes, viewsRes, usersRes, facultiesRes, careersRes] = await Promise.all([
        supabase.from("agendas").select("id,docente_cc,subfunction_id,data,total_horas,created_at").limit(10000),
        supabase.from("agenda_views").select("id,user_cc,status,reviewer_cc,reviewed_at,created_at").limit(10000),
        supabase.from("users").select("id,cc,first_name,second_name,first_last_name,second_last_name,id_faculty,id_professional_career,id_rol").in("id_rol", [1, 2, 3]),
        supabase.from("faculties").select("id,name"),
        supabase.from("professional_careers").select("id,name,id_faculty"),
      ]);

      if (agendasRes.error) throw agendasRes.error;
      if (viewsRes.error) throw viewsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (facultiesRes.error) throw facultiesRes.error;
      if (careersRes.error) throw careersRes.error;

      return {
        agendas: (agendasRes.data ?? []) as DashboardAgenda[],
        views: (viewsRes.data ?? []) as DashboardAgendaView[],
        users: (usersRes.data ?? []) as DashboardUser[],
        faculties: (facultiesRes.data ?? []) as DashboardFaculty[],
        careers: (careersRes.data ?? []) as DashboardCareer[],
      };
    },
    staleTime: 60_000,
  });
}
