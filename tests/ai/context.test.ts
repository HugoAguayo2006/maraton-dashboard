import assert from "node:assert/strict";
import test from "node:test";
import { calculateTrainingLoad } from "@/lib/ai/calculations";
import type { TrainingPlanItem, WorkoutLog } from "@/types/training";

test("calcula carga reciente únicamente dentro de cada ventana", () => {
  const workouts = [
    workout("2026-09-10", 10, 6, 1),
    workout("2026-09-04", 8, 4, 0),
    workout("2026-08-29", 20, 8, 3),
    workout("2026-08-01", 40, 10, 5),
  ];
  const plan = [
    planItem("2026-09-09", "completed"),
    planItem("2026-09-03", "skipped"),
    planItem("2026-08-20", "completed"),
  ];

  const load = calculateTrainingLoad("2026-09-10", workouts, plan);

  assert.equal(load.kilometers7Days, 18);
  assert.equal(load.kilometers14Days, 38);
  assert.equal(load.kilometers28Days, 38);
  assert.equal(load.sessions7Days, 2);
  assert.equal(load.averageRpe14Days, 6);
  assert.equal(load.averagePain14Days, 1.3);
  assert.equal(load.longestRun28Days, 20);
  assert.equal(load.completedPlan14Days, 1);
  assert.equal(load.skippedPlan14Days, 1);
});

function workout(date: string, distanceKm: number, rpe: number, pain: number): WorkoutLog {
  return {
    id: date,
    planItemId: null,
    date,
    title: "Carrera",
    distanceKm,
    durationSeconds: 3600,
    averagePace: "6:00 /km",
    rpe,
    pain,
    fatigue: null,
    sleepHours: null,
    averageHeartRate: null,
    maxHeartRate: null,
    giSymptoms: null,
    foodBefore: null,
    hydration: null,
    gels: null,
    notes: null,
    source: "manual",
    stravaActivityId: null,
    activityType: "easy",
    providerActivityType: null,
    feeling: null,
    locationName: null,
    locationCity: null,
    routeName: null,
    latitude: null,
    longitude: null,
    elevationGain: null,
    calories: null,
    weather: null,
  };
}

function planItem(date: string, status: TrainingPlanItem["status"]): TrainingPlanItem {
  return {
    id: `${date}-${status}`,
    date,
    weekNumber: 1,
    title: "Sesión",
    sessionType: "easy",
    effortType: "easy",
    distanceKm: 5,
    targetPace: null,
    targetRpe: null,
    targetPaceText: null,
    targetRpeText: null,
    estimatedDurationMin: null,
    status,
  };
}
