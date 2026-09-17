import "server-only";

import { getAthleteProfile } from "@/lib/data/athlete";
import { getProgressData, getWeeklyMileageHistory } from "@/lib/data/dashboard";
import { getStrengthHistory } from "@/lib/data/strength";
import {
  getAllTrainingPlanItems,
  getNextLongRun,
  getTodayTrainingPlan,
} from "@/lib/data/trainingPlan";
import { getAllWorkoutLogs, getWorkoutDetail } from "@/lib/data/workouts";
import { calculateTrainingLoad } from "@/lib/ai/calculations";
import { addDays, getTodayIso } from "@/lib/date";
import { gymGuideEntries, gymRules, paceGuideEntries, practicalGuideEntries } from "@/lib/guide/data";

export const boltReadTools = {
  get_athlete_profile: () => getAthleteProfile(),
  get_goal_event: () => getAthleteProfile(),
  get_current_plan: () => getAllTrainingPlanItems(),
  get_upcoming_workouts: async () => (await getAllTrainingPlanItems())
    .filter((item) => item.date >= getTodayIso()),
  get_recent_workouts: async (days = 28) => (await getAllWorkoutLogs(500))
    .filter((workout) => workout.date >= addDays(getTodayIso(), -(days - 1)) && workout.date <= getTodayIso()),
  get_latest_workout: async () => (await getAllWorkoutLogs(1))[0] ?? null,
  get_today_workout: () => getTodayTrainingPlan(),
  get_next_long_run: () => getNextLongRun(),
  get_progress_summary: () => getProgressData("all"),
  get_weekly_volume: async (weeks = 6) => (await getWeeklyMileageHistory()).slice(-weeks),
  get_training_load: async () => {
    const [workouts, plan] = await Promise.all([
      getAllWorkoutLogs(500),
      getAllTrainingPlanItems(),
    ]);
    return calculateTrainingLoad(getTodayIso(), workouts, plan);
  },
  get_guide: (topic: "paces" | "gym" | "rules") => topic === "paces"
    ? paceGuideEntries
    : topic === "gym"
      ? { routines: gymGuideEntries, rules: gymRules }
      : practicalGuideEntries,
  get_strength_history: (limit = 6) => getStrengthHistory(limit),
  get_workout_detail: (id: string) => getWorkoutDetail(id),
} as const;

export type BoltReadToolName = keyof typeof boltReadTools;
