import type { TableRow } from "@/types/database";
import type {
  AthleteProfile,
  SessionType,
  TrainingPlanItem,
  WorkoutLog,
  WorkoutStatus,
} from "@/types/training";
import { formatPaceSeconds } from "@/lib/format";

export function mapAthleteProfile(
  row: TableRow<"athlete_profiles">,
): AthleteProfile {
  const [firstName, ...lastNameParts] = row.name.trim().split(/\s+/);

  return {
    id: row.id,
    firstName: firstName || row.name,
    lastName: lastNameParts.join(" "),
    age: row.age,
    sex: row.sex as AthleteProfile["sex"],
    weightKg: Number(row.weight_kg),
    raceName: row.marathon_name,
    raceDate: row.marathon_date,
    goal: row.goal,
    naturalPace: formatPaceSeconds(row.natural_pace_seconds) ?? "—",
  };
}

export function mapTrainingPlanItem(
  row: TableRow<"training_plan_items">,
): TrainingPlanItem {
  return {
    id: row.id,
    date: row.date,
    weekNumber: row.week,
    title: row.title,
    sessionType: row.session_type as SessionType,
    distanceKm: row.planned_distance_km === null ? null : Number(row.planned_distance_km),
    targetPace: formatRange(
      row.target_pace_min_seconds,
      row.target_pace_max_seconds,
      formatPaceSeconds,
    ),
    targetRpe: formatRange(
      row.target_rpe_min,
      row.target_rpe_max,
      (value) => value.toString(),
    ),
    estimatedDurationMin: row.estimated_duration_minutes,
    status: row.status as WorkoutStatus,
    warmup: row.warmup ?? undefined,
    mainSet: row.main_workout ?? undefined,
    cooldown: row.cooldown ?? undefined,
    gym: row.strength ?? undefined,
    nutrition: row.nutrition ?? undefined,
    recovery: row.recovery_notes ?? undefined,
  };
}

export function mapWorkoutLog(
  row: TableRow<"workout_logs">,
  title: string,
): WorkoutLog {
  return {
    id: row.id,
    planItemId: row.training_plan_item_id,
    date: row.date,
    title,
    distanceKm: Number(row.distance_km),
    durationSeconds: row.duration_seconds,
    averagePace: formatPaceSeconds(row.average_pace_seconds) ?? "—",
    rpe: row.rpe,
    pain: row.pain,
    fatigue: row.fatigue,
    sleepHours: row.sleep_hours === null ? null : Number(row.sleep_hours),
    averageHeartRate: row.average_hr,
    maxHeartRate: row.max_hr,
    giSymptoms: row.gi_symptoms,
    foodBefore: row.food_before,
    hydration: row.hydration,
    gels: row.gels,
    notes: row.notes,
  };
}

function formatRange(
  minimum: number | null,
  maximum: number | null,
  formatter: (value: number) => string | null,
): string | null {
  if (minimum === null && maximum === null) return null;
  if (minimum === null) return formatter(maximum as number);
  if (maximum === null || minimum === maximum) return formatter(minimum);

  const formattedMinimum = formatter(minimum)?.replace(" /km", "");
  const formattedMaximum = formatter(maximum);
  return `${formattedMinimum}–${formattedMaximum}`;
}
