import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const QUERY_KEY = ["system_settings", "system_enabled"];

interface SystemSettingRow {
  key: string;
  value: { enabled?: boolean } | null;
}

export function useSystemEnabled() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const row = await api
        .get<SystemSettingRow | null>("/system-settings/system_enabled")
        .catch(() => null);
      return row?.value?.enabled !== false; // default true
    },
    staleTime: 30_000,
    refetchInterval: 30_000, // polling reemplaza realtime
  });

  return { enabled: query.data ?? true, isLoading: query.isLoading };
}

export function useToggleSystemEnabled() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      await api.put("/system-settings/system_enabled", {
        value: { enabled: nextEnabled },
        updated_by: user?.id ?? null,
      });
      return nextEnabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
