import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { getTodayIso, getWeekRange } from "@/lib/date";
import { DataAccessError } from "@/lib/data/errors";
import { mapWorkoutLog } from "@/lib/data/mappers";
import { syncTrainingPlanItemStatus } from "@/lib/data/planStatus";
import { createClient } from "@/lib/supabase/server";
import type { TableInsert, TableRow } from "@/types/database";
import type { WorkoutLog } from "@/types/training";

export interface NewWorkoutInput {
  trainingPlanItemId: string | null;
  date: string;
  distanceKm: number;
  durationSeconds: number;
  averagePaceSeconds: number;
  rpe: number;
  pain: number;
  fatigue: number | null;
  sleepHours: number | null;
  averageHr: number | null;
  maxHr: number | null;
  giSymptoms: string | null;
  foodBefore: string | null;
  hydration: string | null;
  gels: string | null;
  notes: string | null;
}

export const getRecentWorkoutLogs = cache(
  async (limit = 3): Promise<WorkoutLog[]> => {
    const rows = await getWorkoutRows(null, null, limit);
    return hydrateWorkoutLogs(rows);
  },
);

export const getAllWorkoutLogs = cache(
  async (limit = 100): Promise<WorkoutLog[]> => {
    const rows = await getWorkoutRows(null, null, limit);
    return hydrateWorkoutLogs(rows);
  },
);

export const getWorkoutLogsBetween = cache(
  async (start: string, end: string): Promise<WorkoutLog[]> => {
    const rows = await getWorkoutRows(start, end);
    return hydrateWorkoutLogs(rows);
  },
);

export async function getWeeklyActualDistance(referenceDate = getTodayIso()) {
  const { start, end } = getWeekRange(referenceDate);
  const workouts = await getWorkoutLogsBetween(start, end);
  return workouts.reduce((total, workout) => total + workout.distanceKm, 0);
}

export async function getWorkoutLogForPlanItem(
  planItemId: string,
): Promise<WorkoutLog | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("training_plan_item_id", planItemId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new DataAccessError("No pudimos cargar el entrenamiento de hoy.");
  if (!data) return null;
  const [workout] = await hydrateWorkoutLogs([data]);
  return workout ?? null;
}

export const getRecordedWorkoutPlanItemIds = cache(async (): Promise<string[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_logs")
    .select("training_plan_item_id")
    .eq("user_id", user.id)
    .not("training_plan_item_id", "is", null);

  if (error) throw new DataAccessError("No pudimos comprobar las carreras registradas.");
  return Array.from(new Set(
    (data ?? []).flatMap((row) => row.training_plan_item_id ? [row.training_plan_item_id] : []),
  ));
});

export async function createWorkoutLog(input: NewWorkoutInput): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();
  let planItemId = input.trainingPlanItemId;

  if (planItemId) {
    const { data: ownedPlan, error } = await supabase
      .from("training_plan_items")
      .select("id, planned_distance_km, status")
      .eq("id", planItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      error
      || !ownedPlan
      || ownedPlan.status === "skipped"
      || Number(ownedPlan.planned_distance_km ?? 0) <= 0
    ) {
      throw new DataAccessError("La sesión seleccionada no es una carrera válida.");
    }

    const { data: existingLog, error: existingError } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("training_plan_item_id", planItemId)
      .limit(1)
      .maybeSingle();

    if (existingError) throw new DataAccessError("No pudimos comprobar la carrera seleccionada.");
    if (existingLog) throw new DataAccessError("Esta carrera del plan ya tiene un registro.");
  } else {
    const { data: matchingPlans, error } = await supabase
      .from("training_plan_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", input.date)
      .in("status", ["pending", "modified"])
      .gt("planned_distance_km", 0)
      .limit(2);

    if (error) throw new DataAccessError("No pudimos asociar la sesión del plan.");
    if (matchingPlans?.length === 1) planItemId = matchingPlans[0].id;
  }

  const record: TableInsert<"workout_logs"> = {
    user_id: user.id,
    training_plan_item_id: planItemId,
    date: input.date,
    distance_km: input.distanceKm,
    duration_seconds: input.durationSeconds,
    average_pace_seconds: input.averagePaceSeconds,
    rpe: input.rpe,
    pain: input.pain,
    fatigue: input.fatigue,
    sleep_hours: input.sleepHours,
    average_hr: input.averageHr,
    max_hr: input.maxHr,
    gi_symptoms: input.giSymptoms,
    food_before: input.foodBefore,
    hydration: input.hydration,
    gels: input.gels,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from("workout_logs")
    .insert(record)
    .select("id")
    .single();

  if (error) throw new DataAccessError("No pudimos guardar el entrenamiento.");

  if (planItemId) {
    try {
      await syncTrainingPlanItemStatus({ supabase, userId: user.id, planItemId });
    } catch {
      await supabase.from("workout_logs").delete().eq("id", data.id).eq("user_id", user.id);
      throw new DataAccessError("No pudimos vincular la carrera con tu plan.");
    }
  }

  return data.id;
}

async function getWorkoutRows(
  start: string | null,
  end: string | null,
  limit?: number,
): Promise<TableRow<"workout_logs">[]> {
  const user = await requireUser();
  const supabase = await createClient();
  let query = supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (start) query = query.gte("date", start);
  if (end) query = query.lte("date", end);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new DataAccessError("No pudimos cargar tus entrenamientos.");
  return data ?? [];
}

async function hydrateWorkoutLogs(
  rows: TableRow<"workout_logs">[],
): Promise<WorkoutLog[]> {
  if (rows.length === 0) return [];

  const user = await requireUser();
  const supabase = await createClient();
  const planIds = Array.from(
    new Set(rows.flatMap((row) => row.training_plan_item_id ? [row.training_plan_item_id] : [])),
  );
  const titleById = new Map<string, string>();

  if (planIds.length > 0) {
    const { data, error } = await supabase
      .from("training_plan_items")
      .select("id, title")
      .eq("user_id", user.id)
      .in("id", planIds);

    if (error) throw new DataAccessError("No pudimos completar el historial.");
    data?.forEach((item) => titleById.set(item.id, item.title));
  }

  return rows.map((row) =>
    mapWorkoutLog(
      row,
      row.training_plan_item_id
        ? titleById.get(row.training_plan_item_id) ?? "Entrenamiento"
        : "Entrenamiento libre",
    ),
  );
}
