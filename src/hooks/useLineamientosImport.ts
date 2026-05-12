import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ExtractedRule {
  category: "investigacion" | "administrativas" | "formacion" | "visual";
  rule_key: string;
  label: string;
  hours?: number;
  subjects?: number;
  value?: any;
  source_article: string;
}

export interface LineamientosDocument {
  id: string;
  semester_label: string;
  file_path: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
  rules_extracted: ExtractedRule[];
  summary: string | null;
  applied: boolean;
  applied_at: string | null;
  applied_by: string | null;
}

const HISTORY_KEY = ["lineamientos_documents"];

export function useUploadLineamientos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      semesterLabel: string;
      uploadedBy: string;
    }): Promise<LineamientosDocument> => {
      // 1. Subir PDF al endpoint real del backend
      const formData = new FormData();
      formData.append("pdf", input.file);

      const token = localStorage.getItem("ucp_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${baseUrl}/lineamientos-documents/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Error al procesar el PDF");
      }

      const data = await res.json();

      // 2. Convertir reglas del backend al formato del frontend
      const rules: ExtractedRule[] = (data.reglas || []).map((r: any) => ({
        category: r.key?.includes("investigacion") ? "investigacion" :
          r.key?.includes("administrativas") ? "administrativas" :
            r.key?.includes("docencia") || r.key?.includes("horas") ? "formacion" :
              "visual",
        rule_key: r.key || "desconocido",
        label: r.description || "Regla detectada",
        hours: typeof r.value === "number" ? r.value : undefined,
        value: typeof r.value === "string" ? r.value : undefined,
        source_article: "Extraído del PDF",
      }));

      const summary = data.reglas?.length
        ? `Se detectaron ${data.reglas.length} reglas del PDF.`
        : "No se detectaron reglas en el PDF.";

      // 3. Guardar documento en BD
      const docRow = await api.post<LineamientosDocument>("/lineamientos-documents", {
        semester_label: input.semesterLabel,
        file_path: data.archivo || input.file.name,
        file_name: input.file.name,
        uploaded_by: input.uploadedBy,
        rules_extracted: rules,
        summary,
        applied: false,
      });

      return docRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HISTORY_KEY }),
  });
}

export function useApplyExtractedRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      documentId: string;
      rules: ExtractedRule[];
      appliedBy: string;
    }) => {
      // Guardar en localStorage para cambios visuales
      input.rules.forEach(rule => {
        if (rule.category === "visual") {
          localStorage.setItem(`system_setting_${rule.rule_key}`, JSON.stringify({
            value: rule.value,
            updated_by: input.appliedBy,
            updated_at: new Date().toISOString()
          }));
        }
      });

      // Marcar documento como aplicado en el backend
      await api.put(`/lineamientos-documents/${input.documentId}`, {
        applied: true,
        applied_at: new Date().toISOString(),
        applied_by: input.appliedBy,
      });

      return { success: true, applied_count: input.rules.length };
    },
    onSuccess: (data) => {
      console.log(`Se aplicaron ${data.applied_count} reglas exitosamente`);
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      setTimeout(() => window.location.reload(), 1500);
    },
  });
}

export function useLineamientosHistory() {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () =>
      api.get<LineamientosDocument[]>("/lineamientos-documents?order=uploaded_at.desc"),
  });
}