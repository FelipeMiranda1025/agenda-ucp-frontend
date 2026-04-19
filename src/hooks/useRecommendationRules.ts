import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendation_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecommendationRule[];
    },
  });
}

export function useUpdateRecommendationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; hours: number; subjects: number }) => {
      const { error } = await supabase
        .from("recommendation_rules")
        .update({ hours: input.hours, subjects: input.subjects })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}

export function useResetRecommendationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("recommendation_rules")
        .select("id, default_hours, default_subjects");
      if (error) throw error;
      for (const row of data ?? []) {
        await supabase
          .from("recommendation_rules")
          .update({ hours: row.default_hours, subjects: row.default_subjects })
          .eq("id", row.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}

export function useToggleRecommendationRuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("recommendation_rules")
        .update({ active: input.active } as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}

export function useCreateRecommendationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category: RecommendationRule["category"];
      label: string;
      hours: number;
      subjects: number;
    }) => {
      const rule_key = `custom_${Date.now()}`;
      const { error } = await supabase
        .from("recommendation_rules")
        .insert({
          category: input.category,
          rule_key,
          label: input.label,
          hours: input.hours,
          subjects: input.subjects,
          default_hours: input.hours,
          default_subjects: input.subjects,
          priority: 0,
          active: true,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation_rules"] }),
  });
}
