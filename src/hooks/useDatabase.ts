import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  DbRole, DbState, DbSemester, DbFaculty,
  DbEducationLevel, DbProfessionalCareer, DbSubject,
  DbActivityBase, DbAgenda, DbAgendaInsert,
  DbDegreeWork, DbAcademicPractice,
  DbAgendaComment, DbAgendaCommentInsert,
  DbUserHierarchy, DbUserHierarchyInsert,
} from "@/types/database";

// =============================================
// Catálogos (read-only hooks)
// =============================================

function useCatalog<T>(table: string, key: string) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) throw error;
      return (data ?? []) as T[];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache for catalogs
  });
}

export const useRoles = () => useCatalog<DbRole>("roles", "roles");
export const useStates = () => useCatalog<DbState>("states", "states");
export const useSemesters = () => useCatalog<DbSemester>("semester", "semester");
export const useFaculties = () => useCatalog<DbFaculty>("faculties", "faculties");
export const useEducationLevels = () => useCatalog<DbEducationLevel>("education_levels", "education_levels");
export const useProfessionalCareers = () => useCatalog<DbProfessionalCareer>("professional_careers", "professional_careers");

// =============================================
// Actividades (read-only hooks)
// =============================================

export const useIndirectTeaching = () => useCatalog<DbActivityBase>("indirect_teaching", "indirect_teaching");
export const useInvestigations = () => useCatalog<DbActivityBase>("investigations", "investigations");
export const useSocialProjects = () => useCatalog<DbActivityBase>("social_projects", "social_projects");
export const useTeacherTraining = () => useCatalog<DbActivityBase>("teacher_training", "teacher_training");
export const useDegreeWorks = () => useCatalog<DbDegreeWork>("degree_works", "degree_works");
export const useComplementaryActivities = () => useCatalog<DbActivityBase>("complementary_activities", "complementary_activities");
export const useAdministrativeActivities = () => useCatalog<DbActivityBase>("administrative_activities", "administrative_activities");
export const useAcademicPractices = () => useCatalog<DbAcademicPractice>("academic_practices", "academic_practices");

// =============================================
// Subjects
// =============================================

export const useSubjects = () => useCatalog<DbSubject>("subjects", "subjects");

// =============================================
// Agendas (CRUD)
// =============================================

export function useAgendas(docenteCc?: string) {
  return useQuery<DbAgenda[]>({
    queryKey: ["agendas", docenteCc],
    queryFn: async () => {
      let query = supabase.from("agendas").select("*");
      if (docenteCc) {
        query = query.eq("docente_cc", docenteCc);
      }
      const { data, error } = await query.order("confirmed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DbAgenda[];
    },
    enabled: !!docenteCc,
  });
}

export function useInsertAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agenda: DbAgendaInsert) => {
      const { data, error } = await supabase.from("agendas").insert(agenda as any).select().single();
      if (error) throw error;
      return data as unknown as DbAgenda;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendas"] });
    },
  });
}

export function useUpdateAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbAgenda> & { id: string }) => {
      const { data, error } = await supabase.from("agendas").update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as DbAgenda;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendas"] });
    },
  });
}

export function useDeleteAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendas"] });
    },
  });
}

// =============================================
// Agenda Comments
// =============================================

export function useAgendaComments(docenteCc?: string) {
  return useQuery<DbAgendaComment[]>({
    queryKey: ["agenda_comments", docenteCc],
    queryFn: async () => {
      let query = supabase.from("agenda_comments" as any).select("*");
      if (docenteCc) {
        query = query.eq("reviewer_cc", docenteCc).or(`agenda_id.in.(select id from agendas where docente_cc='${docenteCc}')`);
      }
      const { data, error } = await (query as any).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbAgendaComment[];
    },
    enabled: !!docenteCc,
  });
}

export function useAgendaCommentsByAgenda(agendaIds?: string[]) {
  return useQuery<DbAgendaComment[]>({
    queryKey: ["agenda_comments_by_agenda", agendaIds],
    queryFn: async () => {
      if (!agendaIds || agendaIds.length === 0) return [];
      const { data, error } = await (supabase.from("agenda_comments" as any).select("*") as any)
        .in("agenda_id", agendaIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DbAgendaComment[];
    },
    enabled: !!agendaIds && agendaIds.length > 0,
  });
}

export function useInsertAgendaComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: DbAgendaCommentInsert) => {
      const { data, error } = await (supabase.from("agenda_comments" as any) as any).insert(comment).select().single();
      if (error) throw error;
      return data as DbAgendaComment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_comments"] });
      qc.invalidateQueries({ queryKey: ["agenda_comments_by_agenda"] });
    },
  });
}

export function useDeleteAgendaComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("agenda_comments" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_comments"] });
      qc.invalidateQueries({ queryKey: ["agenda_comments_by_agenda"] });
    },
  });
}

// =============================================
// Audit Log
// =============================================

export function useAuditLog(tableName?: string, recordId?: string) {
  return useQuery<import("@/types/database").DbAuditLog[]>({
    queryKey: ["audit_log", tableName, recordId],
    queryFn: async () => {
      let query = supabase.from("audit_log" as any).select("*");
      if (tableName) query = query.eq("table_name", tableName);
      if (recordId) query = query.eq("record_id", recordId);
      const { data, error } = await (query as any).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as import("@/types/database").DbAuditLog[];
    },
  });
}

// =============================================
// Users (login validation)
// =============================================

export async function findUserByCredentials(
  usernameOrEmail: string,
  hashedPassword: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`cc.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
    .eq("password", hashedPassword)
    .eq("id_state", 1)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as import("@/types/database").DbUser | null;
}
