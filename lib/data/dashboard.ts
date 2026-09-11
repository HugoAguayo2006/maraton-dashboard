import "server-only";

import { cache } from "react";
import { getAthleteProfile } from "@/lib/data/athlete";
import {
  getAllTrainingPlanItems,
  getCurrentWeekPlan,
  getNextLongRun,
  getTodayTrainingPlan,
  getTomorrowTrainingPlan,
} from "@/lib/data/trainingPlan";
import { getAllWorkoutLogs } from "@/lib/data/workouts";
import {
  addDays,
  calculateProgressPercent,
  differenceInCalendarDays,
  getTodayIso,
  getWeekRange,
} from "@/lib/date";
import type {
  DashboardData,
  MileageWeek,
  ProgressSummary,
  RecoveryMetrics,
  TrainingPlanItem,
  WorkoutLog,
} from "@/types/training";
import { formatPace } from "@/lib/format";
import {
  calculatePlanCompliance,
  isCompletedPlanSession,
  isEligiblePlanSession,
  isPendingPlanSession,
} from "@/lib/training/compliance";

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const referenceDate = getTodayIso();
  const [athlete, today, tomorrow, currentWeekPlan, nextLongRun, allPlan, allWorkouts] =
    await Promise.all([
      getAthleteProfile(),
      getTodayTrainingPlan(referenceDate),
      getTomorrowTrainingPlan(referenceDate),
      getCurrentWeekPlan(referenceDate),
      getNextLongRun(referenceDate),
      getAllTrainingPlanItems(),
      getAllWorkoutLogs(500),
    ]);

  const { start: weekStart, end: weekEnd } = getWeekRange(referenceDate);
  const weeklyWorkouts = allWorkouts.filter(
    (workout) => workout.date >= weekStart && workout.date <= weekEnd,
  );
  const sessions = currentWeekPlan.filter(isEligiblePlanSession);
  const todayLog = today
    ? allWorkouts.find((workout) => workout.planItemId === today.id)
    : allWorkouts.find((workout) => workout.date === referenceDate);

  const daysToRace = athlete
    ? Math.max(0, differenceInCalendarDays(referenceDate, athlete.raceDate))
    : null;
  const planStart = allPlan[0]?.date;
  const raceProgress = athlete && planStart
    ? calculateProgressPercent(planStart, referenceDate, athlete.raceDate)
    : null;

  return {
    referenceDate,
    athlete,
    today,
    todayLog,
    tomorrow,
    nextLongRun,
    weeklySummary: {
      weekNumber: currentWeekPlan[0]?.weekNumber ?? 0,
      completedKm: roundDistance(sumDistance(weeklyWorkouts)),
      plannedKm: roundDistance(sumPlannedDistance(currentWeekPlan)),
      completedWorkouts: sessions.filter(isCompletedPlanSession).length,
      totalWorkouts: sessions.length,
      pendingWorkouts: sessions.filter(isPendingPlanSession).length,
    },
    recovery: getRecoveryMetricsFromLogs(allWorkouts),
    mileageHistory: buildWeeklyMileageHistory(allPlan, allWorkouts),
    recentWorkouts: allWorkouts.slice(0, 3),
    daysToLongRun: nextLongRun
      ? Math.max(0, differenceInCalendarDays(referenceDate, nextLongRun.date))
      : null,
    daysToRace,
    raceProgress,
  };
});

export const getRecoveryMetrics = cache(async (): Promise<RecoveryMetrics> => {
  const workouts = await getAllWorkoutLogs(1);
  return getRecoveryMetricsFromLogs(workouts);
});

export const getWeeklyMileageHistory = cache(
  async (): Promise<MileageWeek[]> => {
    const [plan, workouts] = await Promise.all([
      getAllTrainingPlanItems(),
      getAllWorkoutLogs(500),
    ]);
    return buildWeeklyMileageHistory(plan, workouts);
  },
);

export const getProgressData = cache(async (range: "week" | "month" | "all" = "week"): Promise<{
  summary: ProgressSummary;
  mileageHistory: MileageWeek[];
}> => {
  const referenceDate = getTodayIso();
  const [plan, workouts] = await Promise.all([
    getAllTrainingPlanItems(),
    getAllWorkoutLogs(500),
  ]);
  const { start, end } = getWeekRange(referenceDate);
  const weeklyWorkouts = workouts.filter(
    (workout) => workout.date >= start && workout.date <= end,
  );
  const rangeStart = range === "week"
    ? start
    : range === "month"
      ? `${referenceDate.slice(0, 7)}-01`
      : null;
  const selectedWorkouts = rangeStart
    ? workouts.filter((workout) => workout.date >= rangeStart && workout.date <= referenceDate)
    : workouts;
  const selectedDistance = sumDistance(selectedWorkouts);
  const selectedDuration = selectedWorkouts.reduce(
    (total, workout) => total + workout.durationSeconds,
    0,
  );
  const totalDistance = sumDistance(workouts);
  const duePlan = plan.filter((item) => item.date <= referenceDate);

  return {
    summary: {
      weeklyKilometers: roundDistance(sumDistance(weeklyWorkouts)),
      totalKilometers: roundDistance(totalDistance),
      longestRunKm: workouts.length
        ? Math.max(...workouts.map((workout) => workout.distanceKm))
        : null,
      averageRpe: averageNullable(workouts.map((workout) => workout.rpe)),
      averagePain: averageNullable(workouts.map((workout) => workout.pain)),
      planCompliance: calculatePlanCompliance(duePlan),
      averagePace: selectedDistance > 0
        ? formatPace(selectedDuration, selectedDistance)
        : null,
      selectedKilometers: roundDistance(selectedDistance),
      selectedDurationSeconds: selectedDuration,
      selectedElevationGain: Math.round(selectedWorkouts.reduce(
        (total, workout) => total + (workout.elevationGain ?? 0),
        0,
      )),
    },
    mileageHistory: buildWeeklyMileageHistory(plan, workouts),
  };
});

function getRecoveryMetricsFromLogs(workouts: WorkoutLog[]): RecoveryMetrics {
  const latest = workouts[0];
  return {
    rpe: latest?.rpe ?? null,
    pain: latest?.pain ?? null,
    fatigue: latest?.fatigue ?? null,
    sleepHours: latest?.sleepHours ?? null,
  };
}

function buildWeeklyMileageHistory(
  plan: TrainingPlanItem[],
  workouts: WorkoutLog[],
): MileageWeek[] {
  if (plan.length > 0) {
    const weeks = Array.from(new Set(plan.map((item) => item.weekNumber))).sort((a, b) => a - b);
    return weeks.map((weekNumber) => {
      const weekPlan = plan.filter((item) => item.weekNumber === weekNumber);
      const start = weekPlan[0].date;
      const end = weekPlan.at(-1)?.date ?? start;
      const weekWorkouts = workouts.filter(
        (workout) => workout.date >= start && workout.date <= end,
      );
      return buildMileageWeek(`S${weekNumber}`, weekPlan, weekWorkouts);
    });
  }

  const starts = Array.from(
    new Set(workouts.map((workout) => getWeekRange(workout.date).start)),
  ).sort();
  return starts.map((start) => {
    const end = addDays(start, 6);
    const weekWorkouts = workouts.filter(
      (workout) => workout.date >= start && workout.date <= end,
    );
    return buildMileageWeek(start.slice(5), [], weekWorkouts);
  });
}

function buildMileageWeek(
  label: string,
  plan: TrainingPlanItem[],
  workouts: WorkoutLog[],
): MileageWeek {
  return {
    label,
    kilometers: roundDistance(sumDistance(workouts)),
    plannedKilometers: roundDistance(sumPlannedDistance(plan)),
    averageRpe: averageNullable(workouts.map((workout) => workout.rpe)) ?? undefined,
  };
}

function sumDistance(workouts: WorkoutLog[]): number {
  return workouts.reduce((total, workout) => total + workout.distanceKm, 0);
}

function sumPlannedDistance(plan: TrainingPlanItem[]): number {
  return plan.reduce((total, item) => total + (item.distanceKm ?? 0), 0);
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function averageNullable(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length
    ? roundOneDecimal(available.reduce((total, value) => total + value, 0) / available.length)
    : null;
}
