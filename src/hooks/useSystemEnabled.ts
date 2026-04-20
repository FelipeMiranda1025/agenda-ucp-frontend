import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const QUERY_KEY = ["system_settings", "system_enabled"];

export function useSystemEnabled() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "system_enabled")
        .maybeSingle();
      if (error) throw error;
      const value = data?.value as { enabled?: boolean } | null;
      return value?.enabled !== false; // default true
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("system_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_settings" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { enabled: query.data ?? true, isLoading: query.isLoading };
}

export function useToggleSystemEnabled() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          {
            key: "system_enabled",
            value: { enabled: nextEnabled },
            updated_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
      if (error) throw error;
      return nextEnabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
