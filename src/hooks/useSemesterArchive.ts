import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useSemesterLabel() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: LABEL_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "semester_label")
        .maybeSingle();
      if (error) throw error;
      const value = data?.value as { label?: string } | null;
      return value?.label ?? "2026-1";
    },
    staleTime: 60_000,
  });
  return { label: query.data ?? "2026-1", isLoading: query.isLoading, refetch: () => qc.invalidateQueries({ queryKey: LABEL_KEY }) };
}

export function useSemesterArchives() {
  return useQuery<SemesterArchive[]>({
    queryKey: ARCHIVES_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase.from("semester_archives" as any) as any)
        .select("*")
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SemesterArchive[];
    },
  });
}

function bumpSemesterLabel(label: string): string {
  const m = label.match(/^(\d{4})-([12])$/);
  if (!m) return label;
  const year = parseInt(m[1], 10);
  const period = parseInt(m[2], 10);
  if (period === 1) return `${year}-2`;
  return `${year + 1}-1`;
}

export function useArchiveAndResetSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ archivedBy }: { archivedBy?: string }) => {
      // 1. Read current label
      const { data: settingRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "semester_label")
        .maybeSingle();
      const currentLabel = ((settingRow?.value as any)?.label as string) || "2026-1";

      // 2. Snapshot existing data
      const [viewsRes, commentsRes, agendasRes] = await Promise.all([
        (supabase.from("agenda_views" as any) as any).select("*"),
        (supabase.from("agenda_comments" as any) as any).select("*"),
        supabase.from("agendas").select("*"),
      ]);
      if (viewsRes.error) throw viewsRes.error;
      if (commentsRes.error) throw commentsRes.error;
      if (agendasRes.error) throw agendasRes.error;

      // 3. Insert archive row
      const { error: insErr } = await (supabase.from("semester_archives" as any) as any).insert({
        semester_label: currentLabel,
        archived_by: archivedBy ?? null,
        agenda_views: viewsRes.data || [],
        agenda_comments: commentsRes.data || [],
        agendas: agendasRes.data || [],
        schedules: [],
      });
      if (insErr) throw insErr;

      // 4. Wipe active tables (delete with always-true filter)
      await (supabase.from("agenda_comments" as any) as any).delete().not("id", "is", null);
      await (supabase.from("agenda_views" as any) as any).delete().not("id", "is", null);
      await supabase.from("agendas").delete().not("id", "is", null);

      // 5. Bump label
      const nextLabel = bumpSemesterLabel(currentLabel);
      await supabase
        .from("system_settings")
        .upsert(
          { key: "semester_label", value: { label: nextLabel }, updated_by: archivedBy ?? null, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      return { archivedLabel: currentLabel, nextLabel };
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
