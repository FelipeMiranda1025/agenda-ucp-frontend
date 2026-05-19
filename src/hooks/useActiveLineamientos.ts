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
    directorPrograma: number;
    directorPosgradoDescarga?: number;
    coordinacionAreaDescarga: number;
    formacionMaestria: number;
    formacionDoctorado: number;
  };
  docenciaIndirecta: {
    preparacionClasePorHora: number;
    asesoriaPorCurso: number;
    asesoriaTrabajoGradoPregrado?: number;
    asesoriaTrabajoGradoMaestria?: number;
    asesoriaTrabajoGradoDoctorado?: number;
    maxTrabajosGrado: number;
  };
  equivalenciasPosgrado?: {
    especializacion?: number;
    maestria: number;
    doctorado: number;
  };
  actividadesAnexas?: {
    liderColectivo: number;
    participacionColectivo?: number;
    comiteCurricular: number;
    comiteBasicoFacultad?: number;
    liderGrupoInvestigacion: number;
    liderRevista: number;
  };
  visualSettings?: {
    form_bg_color?: string;
  };
  rules_extracted?: unknown[];
}

type SettingsRow = { value: LineamientosConfig } | null;

export function useActiveLineamientos() {
  return useQuery({
    queryKey: ["active_lineamientos"],
    queryFn: async (): Promise<LineamientosConfig | null> => {
      try {
        const active = await api.get<LineamientosConfig>("/lineamientos-documents/active");
        if (active?.horasSemestre) return active;
      } catch {
        // Fallback a system_settings si /active falla
      }

      const row = await api.get<SettingsRow>("/system-settings/lineamientos_activos");
      return row?.value ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
}
