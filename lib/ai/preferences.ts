import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BoltPlanGenerationPreferences } from "@/lib/ai/types";

export async function getBoltPlanPreferences(): Promise<BoltPlanGenerationPreferences | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_ai_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data || !data.experience_level || data.preferred_long_run_day === null) return null;
  return {
    experienceLevel: data.experience_level as BoltPlanGenerationPreferences["experienceLevel"],
    runningDays: data.running_days,
    strengthDays: data.strength_days,
    preferredLongRunDay: data.preferred_long_run_day,
    currentWeeklyKm: data.current_weekly_km === null ? 0 : Number(data.current_weekly_km),
    longestRecentRunKm: data.longest_recent_run_km === null ? 0 : Number(data.longest_recent_run_km),
    timeConstraints: data.time_constraints,
    trainingNotes: data.training_notes,
  };
}
