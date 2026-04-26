import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadFile } from "@/lib/api";

export interface ExtractedRule {
  category: "investigacion" | "administrativas" | "formacion";
  rule_key: string;
  label: string;
  hours: number;
  subjects: number;
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

interface ParseResponse {
  rules?: ExtractedRule[];
  summary?: string;
  filePath?: string;
  error?: string;
}

/**
 * Sube un PDF al backend, lo parsea (pdf-parse + IA del backend) y persiste el documento.
 */
export function useUploadLineamientos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      semesterLabel: string;
      uploadedBy: string;
    }): Promise<LineamientosDocument> => {
      // 1. Subir + parsear en un solo endpoint del backend
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("semester_label", input.semesterLabel);
      formData.append("uploaded_by", input.uploadedBy);

      const parseData = await uploadFile<ParseResponse>("/upload/parse-document", formData);
      if (parseData?.error) throw new Error(parseData.error);

      const rules = parseData?.rules ?? [];
      const summary = parseData?.summary ?? "";
      const filePath = parseData?.filePath ?? `${input.semesterLabel}/${input.file.name}`;

      // 2. Persistir registro del documento
      const docRow = await api.post<LineamientosDocument>("/lineamientos-documents", {
        semester_label: input.semesterLabel,
        file_path: filePath,
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

/**
 * Aplica las reglas seleccionadas al catálogo recommendation_rules (upsert por rule_key).
 */
export function useApplyExtractedRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      documentId: string;
      rules: ExtractedRule[];
      appliedBy: string;
    }) => {
      const existing = await api.get<Array<{ id: string; rule_key: string }>>(
        "/recommendation-rules"
      );

      const existingByKey = new Map<string, string>();
      existing.forEach((r) => existingByKey.set(r.rule_key, r.id));

      for (const rule of input.rules) {
        const existingId = existingByKey.get(rule.rule_key);
        if (existingId) {
          await api.put(`/recommendation-rules/${existingId}`, {
            hours: rule.hours,
            subjects: rule.subjects,
            label: rule.label,
            category: rule.category,
            active: true,
          });
        } else {
          await api.post("/recommendation-rules", {
            category: rule.category,
            rule_key: rule.rule_key,
            label: rule.label,
            hours: rule.hours,
            subjects: rule.subjects,
            default_hours: rule.hours,
            default_subjects: rule.subjects,
            priority: 0,
            active: true,
          });
        }
      }

      // Marcar documento como aplicado
      await api.put(`/lineamientos-documents/${input.documentId}`, {
        applied: true,
        applied_at: new Date().toISOString(),
        applied_by: input.appliedBy,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recommendation_rules"] });
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
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
