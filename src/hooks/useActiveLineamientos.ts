import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface LineamientosConfig {
  version: string;
  horasSemestre: number;
  semanasSemestre: number;
  docenciaDirecta: {
    sinProyecto: number;
    investigadorPrincipal: number;
    coinvestigador: number;
    posgrado: number;
    practicas: number;
    formacionMaestria: number;
    formacionDoctorado: number;
  };
  docenciaIndirecta: {
    preparacionClasePorHora: number;
    asesoriaPorCurso: number;
    maxTrabajosGrado: number;
  };
  visualSettings?: {
    form_bg_color?: string;
  };
}

export function useActiveLineamientos() {
  return useQuery({
    queryKey: ["active_lineamientos"],
    queryFn: async () => {
      const data = await api.get<{ version: string; rules_extracted: any[] }>("/lineamientos-documents/active");
      
      // Intentar obtener el objeto original desde system_settings si es posible
      // El endpoint /active actualmente devuelve transformToExtractedRules(config)
      // Pero necesitamos el objeto LineamientosConfig para los factores.
      
      const settings = await api.get<{ value: LineamientosConfig }>("/system-settings/lineamientos_activos");
      return settings?.value || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
