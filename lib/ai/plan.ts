import "server-only";

import { requireUser } from "@/lib/auth";
import { boltPlanSessionSchema } from "@/lib/ai/schemas";
import { getAllTrainingPlanItems } from "@/lib/data/trainingPlan";
import { getTodayIso } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { Json, TableRow } from "@/types/database";
import type {
  BoltPlanChangePreview,
  BoltPlanChangeSuggestion,
  BoltPlanGenerationPreferences,
  BoltPlanOutput,
  BoltPlanSession,
} from "@/lib/ai/types";
import type { TrainingPlanItem } from "@/types/training";
import {
  assertExplicitConfirmation,
  normalizeGeneratedPlan,
  validateGeneratedPlan,
  validatePlanChangeSafety,
} from "@/lib/ai/planValidation";

interface StoredPlanEntry {
  action: "add" | "update" | "skip";
  targetId: string | null;
  session: BoltPlanSession;
}

export async function createSessionChangeProposal(input: {
  suggestion: BoltPlanChangeSuggestion;
  conversationId: string;
}): Promise<BoltPlanChangePreview> {
  const user = await requireUser();
  const supabase = await createClient();
  const today = getTodayIso();
  const plan = await getAllTrainingPlanItems();
  const previous: StoredPlanEntry[] = [];
  const next: StoredPlanEntry[] = [];

  for (const instruction of input.suggestion.changes) {
    if (instruction.date < today || instruction.session.date !== instruction.date) {
      throw new Error("Bolt AI attempted to change a past or inconsistent session.");
    }
    const candidates = plan.filter((item) => item.date === instruction.date);
    const target = instruction.currentTitle
      ? candidates.find((item) => item.title === instruction.currentTitle) ?? null
      : candidates.length === 1
        ? candidates[0]
        : null;

    if (instruction.action !== "add" && (!target || target.status === "completed")) {
      throw new Error("Bolt AI attempted to change an unavailable session.");
    }
    if (instruction.action === "add" && candidates.some((item) => item.title === instruction.session.title)) {
      throw new Error("Bolt AI attempted to duplicate a plan session.");
    }

    const validated = boltPlanSessionSchema.parse({
      ...instruction.session,
      date: instruction.date,
      week: target?.weekNumber ?? instruction.session.week,
      status: instruction.action === "skip" ? "skipped" : instruction.action === "update" ? "modified" : "pending",
    });
    if (target) previous.push({ action: instruction.action, targetId: target.id, session: planItemToSession(target) });
    next.push({ action: instruction.action, targetId: target?.id ?? null, session: validated });
  }

  validatePlanChangeSafety(
    plan.filter((item) => item.date >= today && item.status !== "skipped").map(planItemToSession),
    mergePlanWithChanges(plan, next),
  );
  const { data, error } = await supabase
    .from("ai_plan_changes")
    .insert({
      user_id: user.id,
      conversation_id: input.conversationId,
      kind: "session_change",
      reason: input.suggestion.reason,
      summary: input.suggestion.summary,
      previous_plan_data: previous as unknown as Json,
      new_plan_data: next as unknown as Json,
    })
    .select("*")
    .single();
  if (error) throw new Error("Bolt AI plan proposal could not be saved.");
  return mapPlanChangePreview(data);
}

export async function createGeneratedPlanProposal(input: {
  output: BoltPlanOutput;
  preferences: BoltPlanGenerationPreferences;
  reason: string;
  goalDate: string;
}): Promise<BoltPlanChangePreview> {
  const user = await requireUser();
  const supabase = await createClient();
  const plan = normalizeGeneratedPlan(input.output);
  validateGeneratedPlan(plan, input.preferences, input.goalDate);
  const allExisting = await getAllTrainingPlanItems();
  const existing = allExisting
    .filter((item) => item.date >= getTodayIso())
    .map((item): StoredPlanEntry => ({ action: "update", targetId: item.id, session: planItemToSession(item) }));
  const completedIdentities = new Set(allExisting
    .filter((item) => item.date >= getTodayIso() && item.status === "completed")
    .map((item) => `${item.date}:${item.title.toLocaleLowerCase("es")}`));
  const generated = plan.sessions
    .filter((session) => !completedIdentities.has(`${session.date}:${session.title.toLocaleLowerCase("es")}`))
    .map((session): StoredPlanEntry => ({
    action: "add",
    targetId: null,
    session: { ...session, status: "pending" },
    }));

  const { error: preferenceError } = await supabase
    .from("athlete_ai_preferences")
    .upsert({
      user_id: user.id,
      experience_level: input.preferences.experienceLevel,
      running_days: input.preferences.runningDays,
      strength_days: input.preferences.strengthDays,
      preferred_long_run_day: input.preferences.preferredLongRunDay,
      current_weekly_km: input.preferences.currentWeeklyKm,
      longest_recent_run_km: input.preferences.longestRecentRunKm,
      time_constraints: input.preferences.timeConstraints,
      training_notes: input.preferences.trainingNotes,
    }, { onConflict: "user_id" });
  if (preferenceError) throw new Error("Bolt AI preferences could not be saved.");

  const { data, error } = await supabase
    .from("ai_plan_changes")
    .insert({
      user_id: user.id,
      kind: "plan_generation",
      reason: input.reason,
      summary: plan.planSummary,
      previous_plan_data: existing as unknown as Json,
      new_plan_data: generated as unknown as Json,
    })
    .select("*")
    .single();
  if (error) throw new Error("Bolt AI plan proposal could not be saved.");
  return mapPlanChangePreview(data);
}

export async function applyPlanChange(changeId: string, confirmed: boolean): Promise<number> {
  assertExplicitConfirmation(confirmed);
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_bolt_plan_change", {
    p_change_id: changeId,
    p_confirm: confirmed,
  });
  if (error) throw new Error("No pudimos aplicar este cambio. El plan no fue modificado.");
  return data;
}

export async function rejectPlanChange(changeId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_plan_changes")
    .update({ status: "rejected" })
    .eq("id", changeId)
    .eq("user_id", user.id)
    .eq("status", "proposed");
  if (error) throw new Error("No pudimos cancelar la propuesta.");
}

export async function getPlanChangePreview(changeId: string): Promise<BoltPlanChangePreview | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_plan_changes")
    .select("*")
    .eq("id", changeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("No pudimos cargar la propuesta.");
  return data ? mapPlanChangePreview(data) : null;
}

export function mapPlanChangePreview(row: TableRow<"ai_plan_changes">): BoltPlanChangePreview {
  const previous = parseStoredEntries(row.previous_plan_data);
  const next = parseStoredEntries(row.new_plan_data);
  return {
    id: row.id,
    kind: row.kind as BoltPlanChangePreview["kind"],
    status: row.status as BoltPlanChangePreview["status"],
    reason: row.reason,
    summary: row.summary,
    previousPlan: previous.map((entry) => entry.session),
    newPlan: next.map((entry) => entry.session),
    userConfirmed: row.user_confirmed,
    createdAt: row.created_at,
  };
}

function parseStoredEntries(value: Json): StoredPlanEntry[] {
  if (!Array.isArray(value)) throw new Error("Invalid stored plan proposal.");
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid stored plan entry.");
    const action = entry.action;
    const targetId = entry.targetId;
    if (action !== "add" && action !== "update" && action !== "skip") throw new Error("Invalid plan action.");
    return {
      action,
      targetId: typeof targetId === "string" ? targetId : null,
      session: boltPlanSessionSchema.parse(entry.session),
    };
  });
}

function planItemToSession(item: TrainingPlanItem): BoltPlanSession {
  return {
    date: item.date,
    week: item.weekNumber,
    sessionType: item.sessionType,
    title: item.title,
    distanceKm: item.distanceKm,
    targetPaceText: item.targetPaceText ?? item.targetPace,
    targetRpeText: item.targetRpeText ?? item.targetRpe,
    effortType: item.effortType,
    estimatedDurationMin: item.estimatedDurationMin,
    warmup: item.warmup ?? null,
    mainWorkout: item.mainSet ?? null,
    cooldown: item.cooldown ?? null,
    strength: item.gym ?? null,
    nutrition: item.nutrition ?? null,
    recoveryNotes: item.recovery ?? null,
    status: item.status === "completed" ? "modified" : item.status,
  };
}

function mergePlanWithChanges(plan: TrainingPlanItem[], changes: StoredPlanEntry[]): BoltPlanSession[] {
  const changedIds = new Set(changes.flatMap((change) => change.targetId ? [change.targetId] : []));
  const unchanged = plan
    .filter((item) => !changedIds.has(item.id) && item.date >= getTodayIso() && item.status !== "skipped")
    .map(planItemToSession);
  return [...unchanged, ...changes.filter((entry) => entry.action !== "skip").map((entry) => entry.session)];
}
