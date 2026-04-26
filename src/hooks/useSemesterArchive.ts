import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SemesterArchive {
  id: string;
  semester_label: string;
  archived_at: string;
  archived_by: string | null;
  agenda_views: any[];
  agenda_comments: any[];
  agendas: any[];
  schedules: any[];
}

const ARCHIVES_KEY = ["semester_archives"];
const LABEL_KEY = ["system_settings", "semester_label"];

interface SystemSettingRow {
  key: string;
  value: { label?: string } | null;
}

export function useSemesterLabel() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: LABEL_KEY,
    queryFn: async () => {
      const row = await api
        .get<SystemSettingRow | null>("/system-settings/semester_label")
        .catch(() => null);
      return row?.value?.label ?? "2026-1";
    },
    staleTime: 60_000,
  });
  return {
    label: query.data ?? "2026-1",
    isLoading: query.isLoading,
    refetch: () => qc.invalidateQueries({ queryKey: LABEL_KEY }),
  };
}

export function useSemesterArchives() {
  return useQuery<SemesterArchive[]>({
    queryKey: ARCHIVES_KEY,
    queryFn: () => api.get<SemesterArchive[]>("/semester-archives"),
  });
}

export function useArchiveAndResetSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ archivedBy }: { archivedBy?: string }) => {
      // Endpoint dedicado en el backend que ejecuta toda la transacción:
      // 1) snapshot, 2) insert archive, 3) wipe tablas, 4) bump label.
      const result = await api.post<{ archivedLabel: string; nextLabel: string }>(
        "/semester-archives/archive-and-reset",
        { archived_by: archivedBy ?? null }
      );
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ARCHIVES_KEY });
      qc.invalidateQueries({ queryKey: LABEL_KEY });
      qc.invalidateQueries({ queryKey: ["agenda_views"] });
      qc.invalidateQueries({ queryKey: ["agenda_comments"] });
      qc.invalidateQueries({ queryKey: ["pending_agenda_views_supervisor"] });
    },
  });
}
