import type { TableRow } from "@/types/database";
import type {
  AthleteProfile,
  EffortType,
  SessionType,
  TrainingPlanItem,
  WorkoutLog,
  WorkoutStatus,
} from "@/types/training";
import { calculateAge } from "@/lib/profile/calculateAge";
import { getFirstName } from "@/lib/profile/profile";
import { formatPaceSeconds } from "@/lib/format";
import { formatPaceRange } from "@/lib/training/pace";
import { formatRpeRange } from "@/lib/training/rpe";

export function mapAthleteProfile(
  row: TableRow<"athlete_profiles">,
): AthleteProfile {
  const firstName = getFirstName(row.name);
  const lastNameParts = row.name.trim().split(/\s+/).slice(1);

  return {
    id: row.id,
    name: row.name,
    firstName,
    lastName: lastNameParts.join(" "),
    dateOfBirth: row.date_of_birth,
    age: row.date_of_birth ? calculateAge(row.date_of_birth) : null,
    sex: row.sex as AthleteProfile["sex"],
    weightKg: Number(row.weight_kg),
    raceName: row.marathon_name,
    raceDate: row.marathon_date,
    goal: row.goal,
    naturalPace: formatPaceSeconds(row.natural_pace_seconds) ?? "—",
    naturalPaceSeconds: row.natural_pace_seconds,
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
    effortType: row.effort_type as EffortType | null,
    distanceKm: row.planned_distance_km === null ? null : Number(row.planned_distance_km),
    targetPace: row.target_pace_text ?? formatPaceRange(
      row.target_pace_min_seconds,
      row.target_pace_max_seconds,
    ),
    targetRpe: row.target_rpe_text ?? formatRpeRange(
      row.target_rpe_min,
      row.target_rpe_max,
    ),
    targetPaceText: row.target_pace_text,
    targetRpeText: row.target_rpe_text,
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
