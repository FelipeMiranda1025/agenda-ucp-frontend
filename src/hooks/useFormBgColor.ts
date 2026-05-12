import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const QUERY_KEY = ["system_settings", "form_bg_color"];

interface SystemSettingRow {
  key: string;
  value: string | null;
}

export function useFormBgColor() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const row = await api
        .get<SystemSettingRow | null>("/system-settings/form_bg_color")
        .catch(() => null);
      return row?.value ?? null;
    },
    staleTime: 60_000,
  });

  return { color: query.data, isLoading: query.isLoading };
}
