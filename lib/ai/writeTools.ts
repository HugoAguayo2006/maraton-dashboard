import "server-only";

import { requireUser } from "@/lib/auth";
import {
  applyPlanChange,
  createGeneratedPlanProposal,
  createSessionChangeProposal,
  rejectPlanChange,
} from "@/lib/ai/plan";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const boltWriteTools = {
  propose_plan_change: createSessionChangeProposal,
  propose_generated_plan: createGeneratedPlanProposal,
  apply_plan_change: applyPlanChange,
  reject_plan_change: rejectPlanChange,
  save_ai_recommendation: async (input: {
    summary: string;
    reason: string;
    suggestedChanges?: Json;
    warning?: string | null;
  }) => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_recommendations")
      .insert({
        user_id: user.id,
        summary: input.summary,
        reason: input.reason,
        suggested_changes: input.suggestedChanges ?? [],
        warning: input.warning ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error("Bolt AI recommendation could not be saved.");
    return data.id;
  },
} as const;

export type BoltWriteToolName = keyof typeof boltWriteTools;
