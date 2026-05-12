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
      try {
        // Intentar obtener del API primero
        const row = await api
          .get<SystemSettingRow | null>("/system-settings/form_bg_color")
          .catch(() => null);
        if (row?.value) return row.value;
      } catch (error) {
        console.log("API no disponible, usando localStorage");
      }
      
      // Fallback: leer desde localStorage
      const stored = localStorage.getItem('system_setting_form_bg_color');
      if (stored) {
        const setting = JSON.parse(stored);
        return setting.value;
      }
      
      return null;
    },
    staleTime: 60_000,
  });

  return { color: query.data, isLoading: query.isLoading };
}
