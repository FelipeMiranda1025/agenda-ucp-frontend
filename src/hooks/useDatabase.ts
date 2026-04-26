import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
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
// Helper genérico para catálogos
// =============================================

function useCatalog<T>(path: string, key: string) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: () => api.get<T[]>(path),
    staleTime: 1000 * 60 * 30, // 30 min cache for catalogs
  });
}

// =============================================
// Catálogos
// =============================================

export const useRoles = () => useCatalog<DbRole>("/roles", "roles");
export const useStates = () => useCatalog<DbState>("/states", "states");
export const useSemesters = () => useCatalog<DbSemester>("/semester", "semester");
export const useFaculties = () => useCatalog<DbFaculty>("/faculties", "faculties");
export const useEducationLevels = () => useCatalog<DbEducationLevel>("/education-levels", "education_levels");
export const useProfessionalCareers = () => useCatalog<DbProfessionalCareer>("/professional-careers", "professional_careers");

// =============================================
// Actividades
// =============================================

export const useIndirectTeaching = () => useCatalog<DbActivityBase>("/indirect-teaching", "indirect_teaching");
export const useInvestigations = () => useCatalog<DbActivityBase>("/investigations", "investigations");
export const useSocialProjects = () => useCatalog<DbActivityBase>("/social-projects", "social_projects");
export const useTeacherTraining = () => useCatalog<DbActivityBase>("/teacher-training", "teacher_training");
export const useDegreeWorks = () => useCatalog<DbDegreeWork>("/degree-works", "degree_works");
export const useComplementaryActivities = () => useCatalog<DbActivityBase>("/complementary-activities", "complementary_activities");
export const useAdministrativeActivities = () => useCatalog<DbActivityBase>("/administrative-activities", "administrative_activities");
export const useAcademicPractices = () => useCatalog<DbAcademicPractice>("/academic-practices", "academic_practices");

// =============================================
// Subjects
// =============================================

export const useSubjects = () => useCatalog<DbSubject>("/subjects", "subjects");

// =============================================
// Agendas (CRUD)
// =============================================

export function useAgendas(docenteCc?: string) {
  return useQuery<DbAgenda[]>({
    queryKey: ["agendas", docenteCc],
    queryFn: () => api.get<DbAgenda[]>(`/agendas${qs({ docente_cc: docenteCc })}`),
    enabled: !!docenteCc,
  });
}

export function useInsertAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agenda: DbAgendaInsert) => api.post<DbAgenda>("/agendas", agenda),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendas"] });
    },
  });
}

export function useUpdateAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<DbAgenda> & { id: string }) =>
      api.put<DbAgenda>(`/agendas/${id}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendas"] });
    },
  });
}

export function useDeleteAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agendas/${id}`),
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
    queryFn: () => api.get<DbAgendaComment[]>(`/agenda-comments${qs({ docente_cc: docenteCc })}`),
    enabled: !!docenteCc,
  });
}

export function useAgendaCommentsByAgenda(agendaIds?: string[]) {
  return useQuery<DbAgendaComment[]>({
    queryKey: ["agenda_comments_by_agenda", agendaIds],
    queryFn: async () => {
      if (!agendaIds || agendaIds.length === 0) return [];
      return api.get<DbAgendaComment[]>(
        `/agenda-comments${qs({ agenda_ids: agendaIds.join(",") })}`
      );
    },
    enabled: !!agendaIds && agendaIds.length > 0,
  });
}

export function useAllAgendaComments() {
  return useQuery<(DbAgendaComment & { read_by?: string[] })[]>({
    queryKey: ["agenda_comments_all"],
    queryFn: () =>
      api.get<(DbAgendaComment & { read_by?: string[] })[]>("/agenda-comments?all=true&limit=100"),
    refetchInterval: 15000,
  });
}

export function useMarkCommentsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentIds, userCc }: { commentIds: string[]; userCc: string }) => {
      // El backend implementa append idempotente sobre read_by[]
      await Promise.all(
        commentIds.map((id) =>
          api.put(`/agenda-comments/${id}/read`, { user_cc: userCc })
        )
      );
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
    mutationFn: (comment: DbAgendaCommentInsert) =>
      api.post<DbAgendaComment>("/agenda-comments", comment),
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
    mutationFn: (id: string) => api.delete(`/agenda-comments/${id}`),
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
    queryFn: () =>
      api.get<import("@/types/database").DbAuditLog[]>(
        `/audit-log${qs({ table_name: tableName, record_id: recordId, limit: 200 })}`
      ),
  });
}

// =============================================
// User Hierarchy (supervisión jerárquica)
// =============================================

export function useUserHierarchy() {
  return useQuery<DbUserHierarchy[]>({
    queryKey: ["user_hierarchy"],
    queryFn: () => api.get<DbUserHierarchy[]>("/user-hierarchy"),
    staleTime: 1000 * 60 * 30,
  });
}

export function useSubordinates(supervisorId?: number) {
  return useQuery<DbUserHierarchy[]>({
    queryKey: ["user_hierarchy", "subordinates", supervisorId],
    queryFn: () =>
      api.get<DbUserHierarchy[]>(`/user-hierarchy${qs({ supervisor_id: supervisorId })}`),
    enabled: !!supervisorId,
  });
}

export function useSupervisor(userId?: number) {
  return useQuery<DbUserHierarchy | null>({
    queryKey: ["user_hierarchy", "supervisor", userId],
    queryFn: async () => {
      const list = await api.get<DbUserHierarchy[]>(
        `/user-hierarchy${qs({ user_id: userId })}`
      );
      return list[0] ?? null;
    },
    enabled: !!userId,
  });
}

export function useInsertUserHierarchy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: DbUserHierarchyInsert) =>
      api.post<DbUserHierarchy>("/user-hierarchy", entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_hierarchy"] });
    },
  });
}

export function useDeleteUserHierarchy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.delete(`/user-hierarchy/${userId}`),
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
      const list = await api.get<DbAgendaView[]>(
        `/agenda-views${qs({ user_cc: userCc, limit: 1, order: "created_at.desc" })}`
      );
      return list[0] ?? null;
    },
    enabled: !!userCc,
  });
}

export function useUpsertAgendaView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userCc,
      records,
      status,
    }: {
      userCc: string;
      records: any[];
      status?: string;
    }) => {
      // Buscar la vista más reciente del usuario
      const existing = await api.get<DbAgendaView[]>(
        `/agenda-views${qs({ user_cc: userCc, limit: 1, order: "created_at.desc" })}`
      );

      if (existing.length > 0) {
        return api.put<DbAgendaView>(`/agenda-views/${existing[0].id}`, {
          records,
          status: status || "pending",
        });
      }
      return api.post<DbAgendaView>("/agenda-views", {
        user_cc: userCc,
        records,
        status: (status || "pending") as DbAgendaViewInsert["status"],
      });
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

      // 1. Obtener id numérico del supervisor a partir de su cc
      const supervisorUser = await api
        .get<{ id: number } | null>(`/users/by-cc/${supervisorCc}`)
        .catch(() => null);
      if (!supervisorUser) return [];

      // 2. Subordinados del supervisor
      const hierarchy = await api.get<DbUserHierarchy[]>(
        `/user-hierarchy${qs({ supervisor_id: supervisorUser.id })}`
      );
      if (hierarchy.length === 0) return [];

      const subordinateIds = hierarchy.map((h) => h.user_id);

      // 3. Datos de los subordinados
      const subordinateUsers = await api.get<
        Array<{
          id: number;
          cc: string;
          first_name: string;
          second_name?: string;
          first_last_name: string;
        }>
      >(`/users${qs({ ids: subordinateIds.join(",") })}`);
      if (subordinateUsers.length === 0) return [];

      const ccList = subordinateUsers.map((u) => u.cc);

      // 4. Agenda views pendientes para esos cc
      const pendingViews = await api.get<DbAgendaView[]>(
        `/agenda-views${qs({ user_ccs: ccList.join(","), status: "pending" })}`
      );
      if (pendingViews.length === 0) return [];

      return pendingViews.map((view) => {
        const user = subordinateUsers.find((u) => u.cc === view.user_cc);
        const nameParts = [user?.first_name, user?.second_name, user?.first_last_name].filter(Boolean);
        return {
          agendaView: view,
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

interface RawUserRow {
  cc: string;
  first_name?: string;
  second_name?: string;
  first_last_name?: string;
  second_last_name?: string;
  id_faculty?: number | null;
  id_professional_career?: number | null;
  id_rol?: number;
  id?: number;
}

function mapUserRowToSubordinate(u: RawUserRow): SubordinateDocente {
  return {
    id: u.cc,
    firstName: u.first_name || "",
    secondName: u.second_name || "",
    firstLastName: u.first_last_name || "",
    secondLastName: u.second_last_name || "",
    idFaculty: u.id_faculty ?? null,
    idProfessionalCareer: u.id_professional_career ?? null,
  };
}

export function useSubordinatesWithNames(supervisorCc?: string) {
  return useQuery<SubordinateDocente[]>({
    queryKey: ["subordinates_with_names", supervisorCc],
    queryFn: async () => {
      if (!supervisorCc) return [];

      const supUser = await api
        .get<{ id: number } | null>(`/users/by-cc/${supervisorCc}`)
        .catch(() => null);
      if (!supUser) return [];

      const hierarchy = await api.get<DbUserHierarchy[]>(
        `/user-hierarchy${qs({ supervisor_id: supUser.id })}`
      );
      if (hierarchy.length === 0) return [];

      const subordinateIds = hierarchy.map((h) => h.user_id);
      const users = await api.get<RawUserRow[]>(
        `/users${qs({ ids: subordinateIds.join(",") })}`
      );
      return users.map(mapUserRowToSubordinate);
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
      const data = await api.get<RawUserRow[]>(
        `/users${qs({ rols: "1,2,3", id_state: 1 })}`
      );
      return data.map(mapUserRowToSubordinate);
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
      const user = await api
        .get<RawUserRow | null>(`/users/by-cc/${cc}`)
        .catch(() => null);
      if (!user) return null;
      return [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
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
    mutationFn: ({
      id,
      status,
      reviewerCc,
      reviewerComment,
    }: {
      id: string;
      status: string;
      reviewerCc: string;
      reviewerComment?: string;
    }) =>
      api.put<DbAgendaView>(`/agenda-views/${id}`, {
        status,
        reviewer_cc: reviewerCc,
        reviewer_comment: reviewerComment || null,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_views"] });
      qc.invalidateQueries({ queryKey: ["approved_agenda_ccs"] });
      qc.invalidateQueries({ queryKey: ["fully_approved_careers"] });
    },
  });
}

// =============================================
// Approved agenda ccs filtered by approver role
// =============================================
export function useApprovedAgendaCcs(
  forRole: "vicerrector" | "decano" | "director",
  currentUserCc?: string,
  enabled: boolean = true
) {
  return useQuery<string[]>({
    queryKey: ["approved_agenda_ccs", forRole, currentUserCc],
    queryFn: async () => {
      // ---------- DIRECTOR branch ----------
      if (forRole === "director") {
        if (!currentUserCc) return [];

        const director = await api
          .get<RawUserRow | null>(`/users/by-cc/${currentUserCc}`)
          .catch(() => null);
        const careerId = director?.id_professional_career ?? null;
        if (careerId == null) return [];

        const views = await api.get<Array<{ user_cc: string }>>("/agenda-views?all=true");
        if (views.length === 0) return [];
        const submittedCcs = Array.from(new Set(views.map((r) => r.user_cc)));
        if (submittedCcs.length === 0) return [];

        const docentes = await api.get<Array<{ cc: string }>>(
          `/users${qs({ ccs: submittedCcs.join(","), id_rol: 1, id_professional_career: careerId })}`
        );
        return Array.from(new Set(docentes.map((u) => u.cc)));
      }

      // ---------- VICERRECTOR / DECANO ----------
      const approverRolId = forRole === "vicerrector" ? 3 : 2;

      const views = await api.get<Array<{ user_cc: string; reviewer_cc: string | null }>>(
        `/agenda-views${qs({ status: "approved", has_reviewer: true })}`
      );
      if (views.length === 0) return [];

      const reviewerCcs = Array.from(
        new Set(views.map((r) => r.reviewer_cc).filter((x): x is string => !!x))
      );
      if (reviewerCcs.length === 0) return [];

      const reviewers = await api.get<Array<{ cc: string }>>(
        `/users${qs({ ccs: reviewerCcs.join(","), id_rol: approverRolId })}`
      );
      const validReviewerSet = new Set(reviewers.map((u) => u.cc));

      const candidateCcs = views
        .filter((v) => v.reviewer_cc && validReviewerSet.has(v.reviewer_cc))
        .map((v) => v.user_cc);
      if (candidateCcs.length === 0) return [];

      // Decano: restringir a docentes de su facultad
      if (forRole === "decano" && currentUserCc) {
        const dean = await api
          .get<RawUserRow | null>(`/users/by-cc/${currentUserCc}`)
          .catch(() => null);
        const deanFacultyId = dean?.id_faculty ?? null;
        if (deanFacultyId == null) return [];

        const docentes = await api.get<Array<{ cc: string }>>(
          `/users${qs({
            ccs: Array.from(new Set(candidateCcs)).join(","),
            id_faculty: deanFacultyId,
          })}`
        );
        return Array.from(new Set(docentes.map((u) => u.cc)));
      }

      return Array.from(new Set(candidateCcs));
    },
    enabled: enabled && (forRole === "vicerrector" || !!currentUserCc),
    refetchInterval: 15000,
  });
}

// =============================================
// Fully approved careers
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

      let deanFacultyId: number | null = null;
      if (forRole === "decano") {
        if (!currentUserCc) return [];
        const dean = await api
          .get<RawUserRow | null>(`/users/by-cc/${currentUserCc}`)
          .catch(() => null);
        deanFacultyId = dean?.id_faculty ?? null;
        if (deanFacultyId == null) return [];
      }

      const usersFilter: Record<string, string | number | boolean | null | undefined> = {
        rols: "1,2,3",
        id_state: 1,
        has_career: true,
      };
      if (forRole === "decano" && deanFacultyId != null) {
        usersFilter.id_faculty = deanFacultyId;
      }
      const users = await api.get<RawUserRow[]>(`/users${qs(usersFilter)}`);
      if (users.length === 0) return [];

      const views = await api.get<Array<{ user_cc: string; reviewer_cc: string | null }>>(
        `/agenda-views${qs({ status: "approved", has_reviewer: true })}`
      );
      if (views.length === 0) return [];

      const reviewerCcs = Array.from(
        new Set(views.map((r) => r.reviewer_cc).filter((x): x is string => !!x))
      );
      if (reviewerCcs.length === 0) return [];

      const reviewers = await api.get<Array<{ cc: string }>>(
        `/users${qs({ ccs: reviewerCcs.join(","), id_rol: approverRolId })}`
      );
      const validReviewerSet = new Set(reviewers.map((u) => u.cc));

      const approvedSet = new Set<string>(
        views
          .filter((v) => v.reviewer_cc && validReviewerSet.has(v.reviewer_cc))
          .map((v) => v.user_cc)
      );

      const byCareer = new Map<number, { facultyId: number | null; ccs: string[] }>();
      for (const u of users) {
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

      const careersData = await api.get<Array<{ id: number; name: string }>>(
        `/professional-careers${qs({ ids: fullyIds.map((x) => x.id).join(",") })}`
      );
      const nameMap = new Map(careersData.map((c) => [c.id, c.name]));

      const facultyIds = Array.from(
        new Set(fullyIds.map((x) => x.facultyId).filter((f): f is number => f != null))
      );
      let facultyNameMap = new Map<number, string>();
      if (facultyIds.length > 0) {
        const facData = await api.get<Array<{ id: number; name: string }>>(
          `/faculties${qs({ ids: facultyIds.join(",") })}`
        );
        facultyNameMap = new Map(facData.map((f) => [f.id, f.name]));
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
