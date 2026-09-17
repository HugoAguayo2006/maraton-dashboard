import { addDays } from "@/lib/date";
import type { BoltContext } from "@/lib/ai/types";
import type { TrainingPlanItem, WorkoutLog } from "@/types/training";

export function calculateTrainingLoad(
  referenceDate: string,
  workouts: WorkoutLog[],
  plan: TrainingPlanItem[],
): BoltContext["load"] {
  const recent = (days: number) => workouts.filter(
    (workout) => workout.date >= addDays(referenceDate, -(days - 1)) && workout.date <= referenceDate,
  );
  const workouts7 = recent(7);
  const workouts14 = recent(14);
  const workouts28 = recent(28);
  const plan14 = plan.filter(
    (item) => item.date >= addDays(referenceDate, -13) && item.date <= referenceDate,
  );
  return {
    kilometers7Days: sumDistance(workouts7),
    kilometers14Days: sumDistance(workouts14),
    kilometers28Days: sumDistance(workouts28),
    sessions7Days: workouts7.length,
    sessions28Days: workouts28.length,
    averageRpe14Days: average(workouts14.map((workout) => workout.rpe)),
    averagePain14Days: average(workouts14.map((workout) => workout.pain)),
    longestRun28Days: workouts28.length
      ? round(Math.max(...workouts28.map((workout) => workout.distanceKm)))
      : null,
    completedPlan14Days: plan14.filter((item) => item.status === "completed").length,
    skippedPlan14Days: plan14.filter((item) => item.status === "skipped").length,
  };
}

function average(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length
    ? Math.round((available.reduce((sum, value) => sum + value, 0) / available.length) * 10) / 10
    : null;
}

function sumDistance(workouts: WorkoutLog[]): number {
  return round(workouts.reduce((sum, workout) => sum + workout.distanceKm, 0));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
