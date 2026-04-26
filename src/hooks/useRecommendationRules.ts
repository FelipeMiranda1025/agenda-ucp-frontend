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

export function useRecommendationRules() {
  return useQuery({
    queryKey: ["recommendation_rules"],
    queryFn: () => api.get<RecommendationRule[]>("/recommendation-rules?order=priority.desc"),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}

export function useResetRecommendationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/recommendation-rules/reset", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}

export function useToggleRecommendationRuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      api.put(`/recommendation-rules/${input.id}`, { active: input.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}
