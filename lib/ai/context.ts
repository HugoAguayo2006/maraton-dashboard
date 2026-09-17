import "server-only";

import { requireUser } from "@/lib/auth";
import { boltAppHelp } from "@/lib/ai/appHelp";
import { boltReadTools } from "@/lib/ai/tools";
import { addDays, differenceInCalendarDays, getTodayIso } from "@/lib/date";
import { paceGuideEntries, practicalGuideEntries } from "@/lib/guide/data";
import { createClient } from "@/lib/supabase/server";
import type {
  BoltContext,
  BoltContextPlanItem,
  BoltContextType,
  BoltContextWorkout,
} from "@/lib/ai/types";
import type { TrainingPlanItem, WorkoutLog } from "@/types/training";
import { calculateTrainingLoad } from "@/lib/ai/calculations";

export async function buildBoltContext(pageContext: {
  type: BoltContextType;
  refId?: string | null;
}): Promise<BoltContext> {
  const user = await requireUser();
  const today = getTodayIso();
  const [athlete, plan, workouts, strength, preferencesResult] = await Promise.all([
    boltReadTools.get_athlete_profile(),
    boltReadTools.get_current_plan(),
    boltReadTools.get_recent_workouts(120),
    boltReadTools.get_strength_history(6),
    getPreferences(user.id),
  ]);
  const contextRefId = pageContext.refId ?? null;
  const selectedPlan = pageContext.type === "plan" && contextRefId
    ? plan.find((item) => item.id === contextRefId) ?? null
    : null;
  const selectedWorkoutDetail = pageContext.type === "workout" && contextRefId && isUuid(contextRefId)
    ? await boltReadTools.get_workout_detail(contextRefId)
    : null;
  const associatedPlan = selectedWorkoutDetail?.workout.planItemId
    ? plan.find((item) => item.id === selectedWorkoutDetail.workout.planItemId) ?? null
    : null;
  const endOfWindow = addDays(today, 14);
  const upcoming = plan.filter((item) => item.date >= today && item.date <= endOfWindow);
  if (selectedPlan && !upcoming.some((item) => item.id === selectedPlan.id)) upcoming.unshift(selectedPlan);
  if (associatedPlan && !upcoming.some((item) => item.id === associatedPlan.id)) upcoming.unshift(associatedPlan);
  const todayPlan = plan.find((item) => item.date === today) ?? null;
  const nextLongRun = plan.find(
    (item) => item.date >= today && item.effortType === "long_run" && item.status !== "skipped",
  ) ?? null;

  return {
    generatedAt: new Date().toISOString(),
    pageContext: { type: pageContext.type, refId: contextRefId ? "selected" : null },
    applicationHelp: boltAppHelp,
    athlete: athlete ? {
      age: athlete.age,
      weightKg: athlete.weightKg,
      sex: athlete.sex,
      naturalPace: athlete.naturalPace,
    } : null,
    goal: athlete ? {
      name: athlete.raceName,
      distanceKm: athlete.goalEventDistanceKm,
      date: athlete.raceDate,
      location: athlete.goalEventLocation,
      objective: athlete.goal,
      daysRemaining: Math.max(0, differenceInCalendarDays(today, athlete.raceDate)),
    } : null,
    today: todayPlan ? compactPlanItem(todayPlan) : null,
    nextLongRun: nextLongRun ? compactPlanItem(nextLongRun) : null,
    selectedPlan: selectedPlan
      ? compactPlanItem(selectedPlan)
      : associatedPlan
        ? compactPlanItem(associatedPlan)
        : null,
    upcomingPlan: upcoming.slice(0, 20).map(compactPlanItem),
    recentWorkouts: workouts
      .filter((workout) => workout.date >= addDays(today, -28) && workout.date <= today)
      .slice(0, 30)
      .map(compactWorkout),
    selectedWorkout: selectedWorkoutDetail ? compactWorkout(selectedWorkoutDetail.workout) : null,
    recentStrength: strength.map((session) => ({
      date: session.date,
      routineName: session.routineName,
      durationMinutes: session.durationMinutes,
      setCount: session.setCount,
      volumeKg: Math.round(session.totalVolumeKg),
    })),
    load: calculateTrainingLoad(today, workouts, plan),
    preferences: preferencesResult,
    guide: {
      activeSection: pageContext.type === "guide" && (contextRefId === "paces" || contextRefId === "gym" || contextRefId === "rules")
        ? contextRefId
        : null,
      paceReferences: paceGuideEntries.map((entry) => ({
        type: entry.type,
        pace: entry.pace,
        rpe: entry.rpe,
        rule: entry.practicalRule,
      })),
      practicalRules: practicalGuideEntries.map((entry) => ({
        topic: entry.topic,
        description: entry.description,
      })),
    },
  };
}

export function compactPlanItem(item: TrainingPlanItem): BoltContextPlanItem {
  return {
    date: item.date,
    week: item.weekNumber,
    title: item.title,
    sessionType: item.sessionType,
    effortType: item.effortType,
    distanceKm: item.distanceKm,
    targetPace: item.targetPace,
    targetRpe: item.targetRpe,
    status: item.status,
    warmup: item.warmup ?? null,
    mainWorkout: item.mainSet ?? null,
    cooldown: item.cooldown ?? null,
    strength: item.gym ?? null,
    nutrition: item.nutrition ?? null,
    recovery: item.recovery ?? null,
  };
}

export function compactWorkout(workout: WorkoutLog): BoltContextWorkout {
  return {
    date: workout.date,
    title: workout.routeName ?? workout.title,
    activityType: workout.activityType,
    distanceKm: workout.distanceKm,
    durationSeconds: workout.durationSeconds,
    averagePace: workout.averagePace,
    rpe: workout.rpe,
    pain: workout.pain,
    fatigue: workout.fatigue,
    sleepHours: workout.sleepHours,
    elevationGain: workout.elevationGain,
    averageHeartRate: workout.averageHeartRate,
    source: workout.source,
  };
}

async function getPreferences(userId: string): Promise<BoltContext["preferences"]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_ai_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    experienceLevel: data.experience_level,
    runningDays: data.running_days,
    strengthDays: data.strength_days,
    preferredLongRunDay: data.preferred_long_run_day,
    currentWeeklyKm: data.current_weekly_km === null ? null : Number(data.current_weekly_km),
    longestRecentRunKm: data.longest_recent_run_km === null ? null : Number(data.longest_recent_run_km),
    timeConstraints: data.time_constraints,
    trainingNotes: data.training_notes,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
