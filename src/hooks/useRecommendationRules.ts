import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RecommendationRule {
  id: string;
  category: "investigacion" | "administrativas" | "formacion";
  rule_key: string;
  label: string;
  hours: number;
  subjects: number;
  default_hours: number;
  default_subjects: number;
  priority: number;
  active: boolean;
  updated_at: string;
}

export function useRecommendationRules(enabled = true) {
  return useQuery({
    queryKey: ["recommendation_rules"],
    queryFn: () => api.get<RecommendationRule[]>("/recommendation-rules?order=priority.desc"),
    enabled,
  });
}

export function useUpdateRecommendationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; hours: number; subjects: number }) =>
      api.put(`/recommendation-rules/${input.id}`, {
        hours: input.hours,
        subjects: input.subjects,
      }),
    onSuccess: () => invalidateLineamientosQueries(qc),
  });
}

export interface BulkSaveResult {
  message: string;
  updated: number;
  catalog?: { updated: number; inserted: number };
}

export type BulkSaveInput = {
  rules: Array<{ id: string; hours: number; subjects: number }>;
  apply_to_system?: boolean;
};

export function useBulkSaveRecommendationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkSaveInput) =>
      api.post<BulkSaveResult>("/recommendation-rules/bulk-save", input),
    onSuccess: () => invalidateLineamientosQueries(qc),
  });
}

export function invalidateLineamientosQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["recommendation_rules"] });
  qc.invalidateQueries({ queryKey: ["lineamientos_documents"] });
  qc.invalidateQueries({ queryKey: ["investigations"] });
  qc.invalidateQueries({ queryKey: ["teacher_training"] });
  qc.invalidateQueries({ queryKey: ["administrative_activities"] });
  qc.invalidateQueries({ queryKey: ["indirect_teaching"] });
  qc.invalidateQueries({ queryKey: ["social_projects"] });
  qc.invalidateQueries({ queryKey: ["complementary_activities"] });
  qc.invalidateQueries({ queryKey: ["degree_works"] });
  qc.invalidateQueries({ queryKey: ["academic_practices"] });
}

export function useResetRecommendationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/recommendation-rules/reset", {}),
    onSuccess: () => invalidateLineamientosQueries(qc),
  });
}

export function useToggleRecommendationRuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      api.put(`/recommendation-rules/${input.id}`, { active: input.active }),
    onSuccess: () => invalidateLineamientosQueries(qc),
  });
}

export function useCreateRecommendationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      category: RecommendationRule["category"];
      label: string;
      hours: number;
      subjects: number;
    }) =>
      api.post("/recommendation-rules", {
        category: input.category,
        rule_key: `custom_${Date.now()}`,
        label: input.label,
        hours: input.hours,
        subjects: input.subjects,
        default_hours: input.hours,
        default_subjects: input.subjects,
        priority: 0,
        active: true,
      }),
    onSuccess: () => invalidateLineamientosQueries(qc),
  });
}
