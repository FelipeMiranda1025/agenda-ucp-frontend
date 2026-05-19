import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ExtractedRule {
  category: "investigacion" | "administrativas" | "formacion" | "visual" | "docencia";
  rule_key: string;
  label: string;
  hours?: number | null;
  subjects?: number | null;
  value?: any;
  source_article: string;
  is_default?: boolean;
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

      // El backend ya devuelve el documento procesado y las reglas en rules_extracted
      return {
        id: data.id,
        semester_label: input.semesterLabel,
        file_path: data.file_path || "",
        file_name: input.file.name,
        uploaded_by: input.uploadedBy,
        uploaded_at: new Date().toISOString(),
        rules_extracted: data.rules_extracted || [],
        summary: data.summary || "PDF procesado con éxito.",
        applied: data.applied ?? false,
        applied_at: null,
        applied_by: null,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      qc.invalidateQueries({ queryKey: ["recommendation_rules"] });
    },
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

      const res = await api.post<{ applied_count: number; message?: string }>(
        `/lineamientos-documents/${input.documentId}/apply-rules`,
        { rules: input.rules }
      );

      return {
        success: true,
        applied_count: res.applied_count ?? input.rules.length,
        message: res.message,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      qc.invalidateQueries({ queryKey: ["recommendation_rules"] });
      qc.invalidateQueries({ queryKey: ["investigations"] });
      qc.invalidateQueries({ queryKey: ["administrative_activities"] });
      qc.invalidateQueries({ queryKey: ["teacher_training"] });
      qc.invalidateQueries({ queryKey: ["indirect_teaching"] });
      qc.invalidateQueries({ queryKey: ["degree_works"] });
      qc.invalidateQueries({ queryKey: ["social_projects"] });
      qc.invalidateQueries({ queryKey: ["complementary_activities"] });
      qc.invalidateQueries({ queryKey: ["academic_practices"] });
      qc.invalidateQueries({ queryKey: ["system-settings"] });
      qc.invalidateQueries({ queryKey: ["form_bg_color"] });
      toast.success("Lineamientos aplicados correctamente");
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