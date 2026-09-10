import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { addDays, getTodayIso, getWeekRange } from "@/lib/date";
import { DataAccessError } from "@/lib/data/errors";
import { mapTrainingPlanItem } from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
import type { TrainingPlanItem } from "@/types/training";

export const getTrainingPlanForDate = cache(
  async (date: string): Promise<TrainingPlanItem | null> => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("training_plan_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new DataAccessError("No pudimos cargar la sesión del día.");
    return data ? mapTrainingPlanItem(data) : null;
  },
);

export async function getTodayTrainingPlan(date = getTodayIso()) {
  return getTrainingPlanForDate(date);
}

export async function getTomorrowTrainingPlan(date = getTodayIso()) {
  return getTrainingPlanForDate(addDays(date, 1));
}

export const getCurrentWeekPlan = cache(
  async (referenceDate = getTodayIso()): Promise<TrainingPlanItem[]> => {
    const { start, end } = getWeekRange(referenceDate);
    return getTrainingPlanBetween(start, end);
  },
);

export const getAllTrainingPlanItems = cache(
  async (): Promise<TrainingPlanItem[]> => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("training_plan_items")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) throw new DataAccessError("No pudimos cargar tu plan.");
    return (data ?? []).map(mapTrainingPlanItem);
  },
);

export const getNextLongRun = cache(
  async (referenceDate = getTodayIso()): Promise<TrainingPlanItem | null> => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("training_plan_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("effort_type", "long_run")
      .gte("date", referenceDate)
      .in("status", ["pending", "modified"])
      .gt("planned_distance_km", 0)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new DataAccessError("No pudimos cargar tu próxima tirada larga.");
    return data ? mapTrainingPlanItem(data) : null;
  },
);

export const getAssignablePlanItems = cache(
  async (referenceDate = getTodayIso()): Promise<TrainingPlanItem[]> => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("training_plan_items")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", addDays(referenceDate, -7))
      .lte("date", addDays(referenceDate, 14))
      .in("status", ["pending", "modified"])
      .gt("planned_distance_km", 0)
      .order("date", { ascending: true });

    if (error) throw new DataAccessError("No pudimos cargar las sesiones disponibles.");
    return (data ?? []).map(mapTrainingPlanItem);
  },
);

export async function getWeeklyPlannedDistance(referenceDate = getTodayIso()) {
  const plan = await getCurrentWeekPlan(referenceDate);
  return plan.reduce((total, item) => total + (item.distanceKm ?? 0), 0);
}

export const getPlanDateBounds = cache(
  async (): Promise<{ start: string; end: string } | null> => {
    const user = await requireUser();
    const supabase = await createClient();
    const [{ data: first, error: firstError }, { data: last, error: lastError }] =
      await Promise.all([
        supabase
          .from("training_plan_items")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("training_plan_items")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (firstError || lastError) throw new DataAccessError("No pudimos calcular el rango del plan.");
    if (!first || !last) return null;
    return { start: first.date, end: last.date };
  },
);

async function getTrainingPlanBetween(start: string, end: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plan_items")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) throw new DataAccessError("No pudimos cargar el plan semanal.");
  return (data ?? []).map(mapTrainingPlanItem);
}
