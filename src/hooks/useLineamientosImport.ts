import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Upload a PDF, parse it via the edge function, and persist the extracted rules.
 * Returns the created document row including the extracted rules for preview.
 */
export function useUploadLineamientos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      semesterLabel: string;
      uploadedBy: string;
    }): Promise<LineamientosDocument> => {
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${input.semesterLabel}/${Date.now()}_${safeName}`;

      // 1. Upload to storage
      const { error: upErr } = await supabase.storage
        .from("lineamientos")
        .upload(filePath, input.file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upErr) throw upErr;

      // 2. Invoke edge function to parse with AI
      const { data: parseData, error: parseErr } = await supabase.functions.invoke(
        "parse-lineamientos",
        { body: { filePath } },
      );
      if (parseErr) throw parseErr;
      if (parseData?.error) throw new Error(parseData.error);

      const rules = (parseData?.rules ?? []) as ExtractedRule[];
      const summary = (parseData?.summary ?? "") as string;

      // 3. Persist document row
      const { data: docRow, error: insErr } = await (supabase
        .from("lineamientos_documents") as any)
        .insert({
          semester_label: input.semesterLabel,
          file_path: filePath,
          file_name: input.file.name,
          uploaded_by: input.uploadedBy,
          rules_extracted: rules,
          summary,
          applied: false,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      return docRow as LineamientosDocument;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HISTORY_KEY }),
  });
}

/**
 * Apply a list of selected extracted rules into recommendation_rules.
 * Upserts by rule_key (creates new or updates hours/subjects/label).
 */
export function useApplyExtractedRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      documentId: string;
      rules: ExtractedRule[];
      appliedBy: string;
    }) => {
      // Fetch existing rules to know which to insert vs update
      const { data: existing, error: fetchErr } = await supabase
        .from("recommendation_rules")
        .select("id, rule_key");
      if (fetchErr) throw fetchErr;

      const existingByKey = new Map<string, string>();
      (existing ?? []).forEach((r: any) => existingByKey.set(r.rule_key, r.id));

      for (const rule of input.rules) {
        const existingId = existingByKey.get(rule.rule_key);
        if (existingId) {
          const { error } = await supabase
            .from("recommendation_rules")
            .update({
              hours: rule.hours,
              subjects: rule.subjects,
              label: rule.label,
              category: rule.category,
              active: true,
            } as never)
            .eq("id", existingId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("recommendation_rules")
            .insert({
              category: rule.category,
              rule_key: rule.rule_key,
              label: rule.label,
              hours: rule.hours,
              subjects: rule.subjects,
              default_hours: rule.hours,
              default_subjects: rule.subjects,
              priority: 0,
              active: true,
            } as never);
          if (error) throw error;
        }
      }

      // Mark document as applied
      const { error: updErr } = await (supabase
        .from("lineamientos_documents") as any)
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
          applied_by: input.appliedBy,
        })
        .eq("id", input.documentId);
      if (updErr) throw updErr;
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
    queryFn: async (): Promise<LineamientosDocument[]> => {
      const { data, error } = await supabase
        .from("lineamientos_documents")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LineamientosDocument[];
    },
  });
}
