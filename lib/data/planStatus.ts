import "server-only";

import { DataAccessError } from "@/lib/data/errors";
import { mapTrainingPlanItem } from "@/lib/data/mappers";
import { hasRunningComponent, hasStrengthComponent } from "@/lib/training/planComponents";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function syncTrainingPlanItemStatus({
  supabase,
  userId,
  planItemId,
}: {
  supabase: SupabaseClient;
  userId: string;
  planItemId: string;
}): Promise<void> {
  const { data: row, error: planError } = await supabase
    .from("training_plan_items")
    .select("*")
    .eq("id", planItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (planError || !row) {
    throw new DataAccessError("No pudimos comprobar el avance de la sesión del plan.");
  }

  const item = mapTrainingPlanItem(row);
  const [runResult, strengthResult] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("training_plan_item_id", planItemId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("strength_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("training_plan_item_id", planItemId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (runResult.error || strengthResult.error) {
    throw new DataAccessError("No pudimos comprobar los registros de la sesión.");
  }

  const requiresRun = hasRunningComponent(item);
  const requiresStrength = hasStrengthComponent(item);
  const fullyCompleted = (requiresRun || requiresStrength)
    && (!requiresRun || Boolean(runResult.data))
    && (!requiresStrength || Boolean(strengthResult.data));
  const nextStatus = fullyCompleted
    ? "completed"
    : item.status === "completed"
      ? "pending"
      : item.status;

  if (nextStatus === item.status) return;

  const { error: updateError } = await supabase
    .from("training_plan_items")
    .update({ status: nextStatus })
    .eq("id", planItemId)
    .eq("user_id", userId);

  if (updateError) {
    throw new DataAccessError("No pudimos actualizar el avance de la sesión del plan.");
  }
}
