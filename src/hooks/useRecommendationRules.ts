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
      return (data ?? []) as RecommendationRule[];
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
