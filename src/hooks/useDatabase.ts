import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  DbRole, DbState, DbSemester, DbFaculty,
  DbEducationLevel, DbProfessionalCareer, DbSubject,
  DbActivityBase, DbAgenda, DbAgendaInsert,
  DbDegreeWork, DbAcademicPractice,
  DbAgendaComment, DbAgendaCommentInsert,
  DbUserHierarchy, DbUserHierarchyInsert,
  DbAgendaView, DbAgendaViewInsert,
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

export function useAllAgendaComments() {
  return useQuery<(DbAgendaComment & { read_by?: string[] })[]>({
    queryKey: ["agenda_comments_all"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("agenda_comments" as any).select("*") as any)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as (DbAgendaComment & { read_by?: string[] })[];
    },
    refetchInterval: 15000, // poll every 15s for new comments
  });
}

export function useMarkCommentsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentIds, userCc }: { commentIds: string[]; userCc: string }) => {
      for (const id of commentIds) {
        await (supabase.from("agenda_comments" as any) as any)
          .update({ read_by: supabase.rpc ? undefined : undefined })
          .eq("id", id);
        // Use raw SQL approach via rpc or direct update with array_append
        // Since we can't use array_append easily, we'll fetch and update
        const { data: existing } = await (supabase.from("agenda_comments" as any).select("read_by") as any).eq("id", id).single();
        const currentReadBy: string[] = existing?.read_by || [];
        if (!currentReadBy.includes(userCc)) {
          await (supabase.from("agenda_comments" as any) as any)
            .update({ read_by: [...currentReadBy, userCc] })
            .eq("id", id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_comments_all"] });
      qc.invalidateQueries({ queryKey: ["agenda_comments_by_agenda"] });
    },
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
      qc.invalidateQueries({ queryKey: ["agenda_comments_all"] });
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
      qc.invalidateQueries({ queryKey: ["agenda_comments_all"] });
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

// =============================================
// User Hierarchy (supervisión jerárquica)
// =============================================

export function useUserHierarchy() {
  return useQuery<DbUserHierarchy[]>({
    queryKey: ["user_hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_hierarchy" as any).select("*");
      if (error) throw error;
      return (data ?? []) as unknown as DbUserHierarchy[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** Obtiene los subordinados directos de un supervisor */
export function useSubordinates(supervisorId?: number) {
  return useQuery<DbUserHierarchy[]>({
    queryKey: ["user_hierarchy", "subordinates", supervisorId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("user_hierarchy" as any) as any)
        .select("*")
        .eq("supervisor_id", supervisorId);
      if (error) throw error;
      return (data ?? []) as DbUserHierarchy[];
    },
    enabled: !!supervisorId,
  });
}

/** Obtiene el supervisor de un usuario */
export function useSupervisor(userId?: number) {
  return useQuery<DbUserHierarchy | null>({
    queryKey: ["user_hierarchy", "supervisor", userId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("user_hierarchy" as any) as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as DbUserHierarchy | null;
    },
    enabled: !!userId,
  });
}

export function useInsertUserHierarchy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: DbUserHierarchyInsert) => {
      const { data, error } = await (supabase.from("user_hierarchy" as any) as any).insert(entry).select().single();
      if (error) throw error;
      return data as DbUserHierarchy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_hierarchy"] });
    },
  });
}

export function useDeleteUserHierarchy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { error } = await (supabase.from("user_hierarchy" as any) as any).delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_hierarchy"] });
    },
  });
}

// =============================================
// Agenda Views (persistencia de agenda confirmada)
// =============================================

export function useAgendaView(userCc?: string) {
  return useQuery<DbAgendaView | null>({
    queryKey: ["agenda_views", userCc],
    queryFn: async () => {
      const { data, error } = await (supabase.from("agenda_views" as any) as any)
        .select("*")
        .eq("user_cc", userCc)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as DbAgendaView | null;
    },
    enabled: !!userCc,
  });
}

export function useUpsertAgendaView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userCc, records, status }: { userCc: string; records: any[]; status?: string }) => {
      // Check if there's an existing view for this user
      const { data: existing } = await (supabase.from("agenda_views" as any) as any)
        .select("id")
        .eq("user_cc", userCc)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await (supabase.from("agenda_views" as any) as any)
          .update({ records, status: status || "pending" })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as DbAgendaView;
      } else {
        const { data, error } = await (supabase.from("agenda_views" as any) as any)
          .insert({ user_cc: userCc, records, status: status || "pending" })
          .select()
          .single();
        if (error) throw error;
        return data as DbAgendaView;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_views"] });
    },
  });
}

export interface PendingAgendaForSupervisor {
  agendaView: DbAgendaView;
  docenteName: string;
  docenteCc: string;
  createdAt: string;
}

export function usePendingAgendaViewsForSupervisor(supervisorCc?: string) {
  return useQuery<PendingAgendaForSupervisor[]>({
    queryKey: ["pending_agenda_views_supervisor", supervisorCc],
    queryFn: async () => {
      if (!supervisorCc) return [];

      // 1. Get the numeric user ID of the supervisor from their cc
      const { data: supervisorUser, error: supErr } = await supabase
        .from("users")
        .select("id")
        .eq("cc", supervisorCc)
        .maybeSingle();
      if (supErr || !supervisorUser) return [];

      // 2. Get subordinate user_ids from hierarchy
      const { data: hierarchy, error: hErr } = await (supabase.from("user_hierarchy" as any) as any)
        .select("user_id")
        .eq("supervisor_id", supervisorUser.id);
      if (hErr || !hierarchy || hierarchy.length === 0) return [];

      const subordinateIds = hierarchy.map((h: any) => h.user_id);

      // 3. Get cc values for those subordinates
      const { data: subordinateUsers, error: uErr } = await supabase
        .from("users")
        .select("id, cc, first_name, second_name, first_last_name")
        .in("id", subordinateIds);
      if (uErr || !subordinateUsers || subordinateUsers.length === 0) return [];

      const ccList = subordinateUsers.map((u: any) => u.cc);

      // 4. Get pending agenda_views for those ccs
      const { data: pendingViews, error: vErr } = await (supabase.from("agenda_views" as any) as any)
        .select("*")
        .in("user_cc", ccList)
        .eq("status", "pending");
      if (vErr || !pendingViews || pendingViews.length === 0) return [];

      // 5. Map agenda views to include docente name
      return pendingViews.map((view: any) => {
        const user = subordinateUsers.find((u: any) => u.cc === view.user_cc);
        const nameParts = [user?.first_name, user?.second_name, user?.first_last_name].filter(Boolean);
        return {
          agendaView: view as DbAgendaView,
          docenteName: nameParts.join(" "),
          docenteCc: view.user_cc,
          createdAt: view.created_at,
        } as PendingAgendaForSupervisor;
      });
    },
    enabled: !!supervisorCc,
    refetchInterval: 15000,
  });
}

// =============================================
// Subordinates with user data (for dynamic docente dropdown)
// =============================================

export interface SubordinateDocente {
  id: string; // cc
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  idFaculty: number | null;
  idProfessionalCareer: number | null;
}

export function useSubordinatesWithNames(supervisorCc?: string) {
  return useQuery<SubordinateDocente[]>({
    queryKey: ["subordinates_with_names", supervisorCc],
    queryFn: async () => {
      if (!supervisorCc) return [];

      // 1. Get supervisor's internal id from cc
      const { data: supUser, error: supErr } = await supabase
        .from("users")
        .select("id")
        .eq("cc", supervisorCc)
        .maybeSingle();
      if (supErr || !supUser) return [];

      // 2. Get subordinate user_ids from hierarchy
      const { data: hierarchy, error: hErr } = await (supabase.from("user_hierarchy" as any) as any)
        .select("user_id")
        .eq("supervisor_id", supUser.id);
      if (hErr || !hierarchy || hierarchy.length === 0) return [];

      const subordinateIds = hierarchy.map((h: any) => h.user_id);

      // 3. Get user details for those subordinates
      const { data: users, error: uErr } = await supabase
        .from("users")
        .select("cc, first_name, second_name, first_last_name, second_last_name, id_faculty, id_professional_career")
        .in("id", subordinateIds);
      if (uErr || !users) return [];

      return users.map((u: any) => ({
        id: u.cc,
        firstName: u.first_name || "",
        secondName: u.second_name || "",
        firstLastName: u.first_last_name || "",
        secondLastName: u.second_last_name || "",
        idFaculty: u.id_faculty ?? null,
        idProfessionalCareer: u.id_professional_career ?? null,
      }));
    },
    enabled: !!supervisorCc,
    staleTime: 1000 * 60 * 30,
  });
}

// All docentes (rol 1, 2, 3) — used for VicerrectorAcadémico to see everyone
export function useAllDocentes(enabled: boolean = true) {
  return useQuery<SubordinateDocente[]>({
    queryKey: ["all_docentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("cc, first_name, second_name, first_last_name, second_last_name, id_faculty, id_professional_career, id_rol")
        .in("id_rol", [1, 2, 3])
        .eq("id_state", 1);
      if (error || !data) return [];
      return data.map((u: any) => ({
        id: u.cc,
        firstName: u.first_name || "",
        secondName: u.second_name || "",
        firstLastName: u.first_last_name || "",
        secondLastName: u.second_last_name || "",
        idFaculty: u.id_faculty ?? null,
        idProfessionalCareer: u.id_professional_career ?? null,
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

// Resolve a user's full name from their cc
export function useUserNameByCc(cc?: string | null) {
  return useQuery<string | null>({
    queryKey: ["user_name_by_cc", cc],
    queryFn: async () => {
      if (!cc) return null;
      const { data, error } = await supabase
        .from("users")
        .select("first_name, second_name, first_last_name, second_last_name")
        .eq("cc", cc)
        .maybeSingle();
      if (error || !data) return null;
      return [data.first_name, data.second_name, data.first_last_name, data.second_last_name]
        .filter(Boolean)
        .join(" ");
    },
    enabled: !!cc,
    staleTime: 1000 * 60 * 30,
  });
}

export function useUpdateAgendaViewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reviewerCc, reviewerComment }: { id: string; status: string; reviewerCc: string; reviewerComment?: string }) => {
      const { data, error } = await (supabase.from("agenda_views" as any) as any)
        .update({ status, reviewer_cc: reviewerCc, reviewer_comment: reviewerComment || null, reviewed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DbAgendaView;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_views"] });
      qc.invalidateQueries({ queryKey: ["approved_agenda_ccs"] });
      qc.invalidateQueries({ queryKey: ["fully_approved_careers"] });
    },
  });
}

// =============================================
// Approved agenda ccs filtered by approver role
// - forRole='vicerrector' → agendas approved by a DecanoFacultad (rol 3)
// - forRole='decano' → agendas approved by a DirectorPrograma (rol 2),
//   restricted to docentes within the dean's faculty (currentUserCc)
// =============================================
export function useApprovedAgendaCcs(
  forRole: "vicerrector" | "decano",
  currentUserCc?: string,
  enabled: boolean = true
) {
  return useQuery<string[]>({
    queryKey: ["approved_agenda_ccs", forRole, currentUserCc],
    queryFn: async () => {
      const approverRolId = forRole === "vicerrector" ? 3 : 2;

      // 1. Approved agenda_views (with reviewer_cc)
      const { data: views, error: vErr } = await (supabase.from("agenda_views" as any) as any)
        .select("user_cc, reviewer_cc")
        .eq("status", "approved")
        .not("reviewer_cc", "is", null);
      if (vErr || !views || views.length === 0) return [];

      const reviewerCcs = Array.from(new Set((views as any[]).map((r) => r.reviewer_cc as string)));

      // 2. Look up reviewer roles
      const { data: reviewers, error: rErr } = await supabase
        .from("users")
        .select("cc, id_rol")
        .in("cc", reviewerCcs)
        .eq("id_rol", approverRolId);
      if (rErr || !reviewers) return [];
      const validReviewerSet = new Set<string>((reviewers as any[]).map((u) => u.cc as string));

      const candidateCcs = (views as any[])
        .filter((v) => validReviewerSet.has(v.reviewer_cc as string))
        .map((v) => v.user_cc as string);
      if (candidateCcs.length === 0) return [];

      // 3. Decano: restrict to docentes in same faculty
      if (forRole === "decano" && currentUserCc) {
        const { data: dean } = await supabase
          .from("users")
          .select("id_faculty")
          .eq("cc", currentUserCc)
          .maybeSingle();
        const deanFacultyId = (dean as any)?.id_faculty ?? null;
        if (deanFacultyId == null) return [];

        const { data: docentes } = await supabase
          .from("users")
          .select("cc")
          .in("cc", Array.from(new Set(candidateCcs)))
          .eq("id_faculty", deanFacultyId);
        return Array.from(new Set((docentes ?? []).map((u: any) => u.cc as string)));
      }

      return Array.from(new Set(candidateCcs));
    },
    enabled: enabled && (forRole === "vicerrector" || !!currentUserCc),
    refetchInterval: 15000,
  });
}

// =============================================
// Careers where ALL active docentes have an agenda approved by the
// appropriate role:
// - forRole='vicerrector' → approved by Decano (rol 3); returns careerName + facultyName
// - forRole='decano' → approved by Director (rol 2); restricted to dean's faculty
// =============================================
export interface FullyApprovedCareer {
  careerId: number;
  careerName: string;
  facultyId: number | null;
  facultyName: string | null;
  totalDocentes: number;
}

export function useFullyApprovedCareers(
  forRole: "vicerrector" | "decano",
  currentUserCc?: string,
  enabled: boolean = true
) {
  return useQuery<FullyApprovedCareer[]>({
    queryKey: ["fully_approved_careers", forRole, currentUserCc],
    queryFn: async () => {
      const approverRolId = forRole === "vicerrector" ? 3 : 2;

      // Resolve dean's faculty if needed
      let deanFacultyId: number | null = null;
      if (forRole === "decano") {
        if (!currentUserCc) return [];
        const { data: dean } = await supabase
          .from("users")
          .select("id_faculty")
          .eq("cc", currentUserCc)
          .maybeSingle();
        deanFacultyId = (dean as any)?.id_faculty ?? null;
        if (deanFacultyId == null) return [];
      }

      // 1. Active docentes (rol 1,2,3) with assigned career, scoped by faculty for decano
      let usersQuery = supabase
        .from("users")
        .select("cc, id_professional_career, id_faculty")
        .in("id_rol", [1, 2, 3])
        .eq("id_state", 1)
        .not("id_professional_career", "is", null);
      if (forRole === "decano" && deanFacultyId != null) {
        usersQuery = usersQuery.eq("id_faculty", deanFacultyId);
      }
      const { data: users, error: uErr } = await usersQuery;
      if (uErr || !users || users.length === 0) return [];

      // 2. Approved agenda_views with reviewer
      const { data: views, error: vErr } = await (supabase.from("agenda_views" as any) as any)
        .select("user_cc, reviewer_cc")
        .eq("status", "approved")
        .not("reviewer_cc", "is", null);
      if (vErr || !views) return [];

      const reviewerCcs = Array.from(new Set((views as any[]).map((r) => r.reviewer_cc as string)));
      if (reviewerCcs.length === 0) return [];

      // 3. Filter reviewers by required role
      const { data: reviewers } = await supabase
        .from("users")
        .select("cc")
        .in("cc", reviewerCcs)
        .eq("id_rol", approverRolId);
      const validReviewerSet = new Set<string>(((reviewers ?? []) as any[]).map((u) => u.cc as string));

      const approvedSet = new Set<string>(
        (views as any[])
          .filter((v) => validReviewerSet.has(v.reviewer_cc as string))
          .map((v) => v.user_cc as string)
      );

      // 4. Group docentes by career and check completeness
      const byCareer = new Map<number, { facultyId: number | null; ccs: string[] }>();
      for (const u of users as any[]) {
        const cid = u.id_professional_career as number;
        if (!byCareer.has(cid)) byCareer.set(cid, { facultyId: u.id_faculty ?? null, ccs: [] });
        byCareer.get(cid)!.ccs.push(u.cc);
      }

      const fullyIds: { id: number; facultyId: number | null; total: number }[] = [];
      byCareer.forEach((v, careerId) => {
        if (v.ccs.length > 0 && v.ccs.every((cc) => approvedSet.has(cc))) {
          fullyIds.push({ id: careerId, facultyId: v.facultyId, total: v.ccs.length });
        }
      });
      if (fullyIds.length === 0) return [];

      // 5. Resolve career names
      const { data: careersData } = await supabase
        .from("professional_careers")
        .select("id, name")
        .in("id", fullyIds.map((x) => x.id));
      const nameMap = new Map<number, string>(((careersData ?? []) as any[]).map((c) => [c.id, c.name]));

      // 6. Resolve faculty names (only meaningful for vicerrector view)
      const facultyIds = Array.from(
        new Set(fullyIds.map((x) => x.facultyId).filter((f): f is number => f != null))
      );
      let facultyNameMap = new Map<number, string>();
      if (facultyIds.length > 0) {
        const { data: facData } = await supabase
          .from("faculties")
          .select("id, name")
          .in("id", facultyIds);
        facultyNameMap = new Map<number, string>(((facData ?? []) as any[]).map((f) => [f.id, f.name]));
      }

      return fullyIds.map((x) => ({
        careerId: x.id,
        careerName: nameMap.get(x.id) ?? `Carrera #${x.id}`,
        facultyId: x.facultyId,
        facultyName: x.facultyId != null ? facultyNameMap.get(x.facultyId) ?? null : null,
        totalDocentes: x.total,
      }));
    },
    enabled: enabled && (forRole === "vicerrector" || !!currentUserCc),
    refetchInterval: 15000,
  });
}
