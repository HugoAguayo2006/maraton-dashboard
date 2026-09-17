import assert from "node:assert/strict";
import test from "node:test";
import {
  assertExplicitConfirmation,
  normalizeGeneratedPlan,
  stabilizeGeneratedPlan,
  validatePlanChangeSafety,
  validateGeneratedPlan,
  validatePlanSafety,
} from "@/lib/ai/planValidation";
import type { BoltPlanGenerationPreferences, BoltPlanOutput, BoltPlanSession } from "@/lib/ai/types";
import { boltPlanOutputSchema, boltPlanSessionSchema } from "@/lib/ai/schemas";

const preferences: BoltPlanGenerationPreferences = {
  experienceLevel: "intermediate",
  runningDays: [2, 4, 7],
  strengthDays: [3],
  preferredLongRunDay: 7,
  currentWeeklyKm: 20,
  longestRecentRunKm: 10,
  timeConstraints: null,
  trainingNotes: null,
};

test("normaliza semanas y ordena fechas sin confiar en el número del modelo", () => {
  const output = planOutput([
    session("2099-01-13", "easy", 6, 88),
    session("2099-01-06", "easy", 5, 42),
  ]);
  const normalized = normalizeGeneratedPlan(output);
  assert.deepEqual(normalized.sessions.map((item) => item.week), [1, 2]);
  assert.deepEqual(normalized.sessions.map((item) => item.date), ["2099-01-06", "2099-01-13"]);
});

test("rechaza fechas pasadas, días no disponibles y distancias inválidas", () => {
  assert.throws(() => validateGeneratedPlan(planOutput([session("2020-01-07", "easy", 5)]), preferences, "2099-12-31", "2026-09-10"), /fechas pasadas/);
  assert.throws(() => validateGeneratedPlan(planOutput([session("2099-01-05", "easy", 5)]), preferences, "2099-12-31", "2026-09-10"), /días disponibles/);
  assert.throws(() => validateGeneratedPlan(planOutput([session("2099-01-06", "easy", 0)]), preferences, "2099-12-31", "2026-09-10"), /distancia positiva/);
});

test("rechaza intensidad consecutiva y aumentos semanales bruscos", () => {
  assert.throws(() => validatePlanSafety([
    session("2099-01-06", "tempo", 6),
    session("2099-01-07", "intervals", 6),
  ]), /días consecutivos/);
  assert.throws(() => validatePlanSafety([
    session("2099-01-06", "easy", 10),
    session("2099-01-13", "easy", 13),
  ]), /demasiado agresiva/);
});

test("una propuesta no hereda falsos bloqueos de un plan previo, pero no puede crear riesgos nuevos", () => {
  const existing = [
    session("2099-01-06", "easy", 10),
    session("2099-01-13", "easy", 13),
  ];
  assert.doesNotThrow(() => validatePlanChangeSafety(existing, [
    ...existing,
    session("2099-01-20", "easy", 10),
  ]));
  assert.throws(() => validatePlanChangeSafety(existing, [
    ...existing,
    session("2099-01-14", "tempo", 5),
    session("2099-01-15", "intervals", 5),
  ]), /días consecutivos/);
});

test("la escritura exige confirmación explícita", () => {
  assert.throws(() => assertExplicitConfirmation(false), /confirmación explícita/);
  assert.doesNotThrow(() => assertExplicitConfirmation(true));
});

test("el esquema rechaza fechas imposibles y sesiones duplicadas", () => {
  assert.equal(boltPlanSessionSchema.safeParse(session("2099-02-30", "easy", 5)).success, false);
  const duplicate = session("2099-01-06", "easy", 5);
  assert.equal(boltPlanOutputSchema.safeParse(planOutput([duplicate, { ...duplicate }])).success, false);
});

test("el esquema completa campos opcionales de una sesión compacta", () => {
  const parsed = boltPlanSessionSchema.parse({
    date: "2099-01-06",
    week: 1,
    sessionType: "easy",
    title: "Rodaje suave",
  });
  assert.equal(parsed.distanceKm, null);
  assert.equal(parsed.mainWorkout, null);
  assert.equal(parsed.status, "pending");
});

test("normaliza volumen excesivo e intensidad consecutiva antes de validar", () => {
  const stabilized = stabilizeGeneratedPlan(planOutput([
    session("2099-01-05", "tempo", 10, 1),
    session("2099-01-06", "intervals", 10, 1),
    session("2099-01-12", "easy", 15, 2),
    session("2099-01-13", "easy", 15, 2),
  ]), preferences);
  const secondWeekVolume = stabilized.sessions
    .filter((item) => item.week === 2)
    .reduce((total, item) => total + (item.distanceKm ?? 0), 0);
  assert.ok(secondWeekVolume <= 24);
  assert.equal(stabilized.sessions[1].sessionType, "easy");
  assert.doesNotThrow(() => validatePlanSafety(stabilized.sessions));
});

function session(date: string, sessionType: BoltPlanSession["sessionType"], distanceKm: number, week = 1): BoltPlanSession {
  return {
    date,
    week,
    sessionType,
    title: `${sessionType} ${date}`,
    distanceKm,
    targetPaceText: null,
    targetRpeText: "RPE 3–4",
    effortType: sessionType === "tempo" ? "tempo_threshold" : sessionType === "intervals" ? "intervals_speed" : "easy",
    estimatedDurationMin: 45,
    warmup: null,
    mainWorkout: "Trabajo principal",
    cooldown: null,
    strength: null,
    nutrition: null,
    recoveryNotes: null,
    status: "pending",
  };
}

function planOutput(sessions: BoltPlanSession[]): BoltPlanOutput {
  return {
    planSummary: "Plan de prueba",
    weeks: 1,
    runningDaysPerWeek: 3,
    strengthDaysPerWeek: 1,
    sessions,
  };
}
