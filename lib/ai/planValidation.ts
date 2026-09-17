import { differenceInCalendarDays, getTodayIso, getWeekRange } from "@/lib/date";
import { boltPlanOutputSchema } from "@/lib/ai/schemas";
import type {
  BoltPlanGenerationPreferences,
  BoltPlanOutput,
  BoltPlanSession,
} from "@/lib/ai/types";

export function normalizeGeneratedPlan(output: BoltPlanOutput): BoltPlanOutput {
  const parsed = boltPlanOutputSchema.parse(output);
  const sorted = [...parsed.sessions].sort((left, right) => left.date.localeCompare(right.date));
  const firstWeekStart = getWeekRange(sorted[0].date).start;
  const sessions = sorted.map((session) => ({
    ...session,
    week: Math.floor(differenceInCalendarDays(firstWeekStart, session.date) / 7) + 1,
    status: "pending" as const,
  }));
  return {
    ...parsed,
    weeks: Math.max(...sessions.map((session) => session.week)),
    sessions,
  };
}

export function stabilizeGeneratedPlan(
  output: BoltPlanOutput,
  preferences: BoltPlanGenerationPreferences,
): BoltPlanOutput {
  const sessions = softenConsecutiveIntensity([...output.sessions].sort((left, right) => left.date.localeCompare(right.date)));
  const runningWeeks = new Map<number, BoltPlanSession[]>();
  for (const session of sessions) {
    if (!isRunningSession(session)) continue;
    runningWeeks.set(session.week, [...(runningWeeks.get(session.week) ?? []), session]);
  }

  let previousVolume = preferences.currentWeeklyKm > 0 ? preferences.currentWeeklyKm : null;
  const scaleByWeek = new Map<number, number>();
  for (const [week, running] of [...runningWeeks.entries()].sort(([left], [right]) => left - right)) {
    const volume = running.reduce((total, session) => total + (session.distanceKm ?? 0), 0);
    if (previousVolume !== null && volume > previousVolume * 1.2) {
      scaleByWeek.set(week, (previousVolume * 1.2) / volume);
    }
    const scale = scaleByWeek.get(week) ?? 1;
    previousVolume = running.reduce(
      (total, session) => total + scaleDistance(session.distanceKm, scale),
      0,
    );
  }

  return {
    ...output,
    sessions: sessions.map((session) => {
      const scale = scaleByWeek.get(session.week);
      return scale && isRunningSession(session)
        ? { ...session, distanceKm: scaleDistance(session.distanceKm, scale) }
        : session;
    }),
  };
}

export function validateGeneratedPlan(
  output: BoltPlanOutput,
  preferences: BoltPlanGenerationPreferences,
  goalDate?: string,
  referenceDate = getTodayIso(),
): void {
  const plan = boltPlanOutputSchema.parse(output);
  const runningByDate = new Set<string>();
  for (const session of plan.sessions) {
    if (session.date < referenceDate) throw new Error("El plan generado contiene fechas pasadas.");
    if (goalDate && session.date > goalDate) throw new Error("El plan generado contiene sesiones posteriores a la carrera objetivo.");
    if (session.status !== "pending") throw new Error("Las sesiones nuevas deben quedar pendientes.");
    const day = isoWeekday(session.date);
    if (isRunningSession(session) && !preferences.runningDays.includes(day)) {
      throw new Error("El plan generado no respeta los días disponibles para correr.");
    }
    if (isStrengthSession(session) && !preferences.strengthDays.includes(day)) {
      throw new Error("El plan generado no respeta los días disponibles para fuerza.");
    }
    if (session.sessionType === "long-run" && day !== preferences.preferredLongRunDay) {
      throw new Error("El plan generado no respeta el día de tirada larga.");
    }
    if (isRunningSession(session) && !(session.distanceKm && session.distanceKm > 0)) {
      throw new Error("Cada carrera del plan debe tener una distancia positiva.");
    }
    if (isRunningSession(session)) {
      if (runningByDate.has(session.date)) throw new Error("El plan no puede tener dos carreras el mismo día.");
      runningByDate.add(session.date);
    }
  }
  validatePlanSafety(plan.sessions);
}

export function validatePlanSafety(sessions: BoltPlanSession[]): void {
  const issue = getPlanSafetyIssues(sessions)[0];
  if (issue) throw new Error(issue.message);
}

export function validatePlanChangeSafety(
  before: BoltPlanSession[],
  after: BoltPlanSession[],
): void {
  const previousIssues = new Set(getPlanSafetyIssues(before).map((issue) => issue.key));
  const newIssue = getPlanSafetyIssues(after).find((issue) => !previousIssues.has(issue.key));
  if (newIssue) throw new Error(newIssue.message);
}

function getPlanSafetyIssues(sessions: BoltPlanSession[]): Array<{ key: string; message: string }> {
  const sorted = [...sessions].sort((left, right) => left.date.localeCompare(right.date));
  const issues: Array<{ key: string; message: string }> = [];
  const hardDates = sorted.filter(isHardSession).map((session) => session.date);
  for (let index = 1; index < hardDates.length; index += 1) {
    if (daysBetween(hardDates[index - 1], hardDates[index]) <= 1) {
      issues.push({
        key: `hard:${hardDates[index - 1]}:${hardDates[index]}`,
        message: "El plan no puede contener sesiones intensas en días consecutivos.",
      });
    }
  }

  const weekly = new Map<string, number>();
  sorted.filter(isRunningSession).forEach((session) => {
    const week = getWeekRange(session.date).start;
    weekly.set(week, (weekly.get(week) ?? 0) + (session.distanceKm ?? 0));
  });
  const weeks = [...weekly.entries()].sort(([left], [right]) => left.localeCompare(right));
  for (let index = 1; index < weeks.length; index += 1) {
    const previous = weeks[index - 1][1];
    const current = weeks[index][1];
    if (previous >= 10 && current > previous * 1.2) {
      issues.push({
        key: `volume:${weeks[index - 1][0]}:${weeks[index][0]}`,
        message: "El plan generado aumenta el volumen semanal de forma demasiado agresiva.",
      });
    }
  }
  return issues;
}

export function assertExplicitConfirmation(confirmed: boolean): void {
  if (!confirmed) throw new Error("La confirmación explícita es obligatoria.");
}

export function isRunningSession(session: BoltPlanSession): boolean {
  return ["easy", "long-run", "tempo", "intervals"].includes(session.sessionType)
    && session.status !== "skipped";
}

function isStrengthSession(session: BoltPlanSession): boolean {
  return (session.sessionType === "gym" || session.sessionType === "strength")
    && session.status !== "skipped";
}

function isHardSession(session: BoltPlanSession): boolean {
  return session.status !== "skipped"
    && (session.sessionType === "tempo" || session.sessionType === "intervals" || session.effortType === "tempo_threshold" || session.effortType === "intervals_speed");
}

function softenConsecutiveIntensity(sessions: BoltPlanSession[]): BoltPlanSession[] {
  let lastHardDate: string | null = null;
  return sessions.map((session) => {
    if (!isHardSession(session)) return session;
    if (lastHardDate && daysBetween(lastHardDate, session.date) <= 1) {
      return {
        ...session,
        sessionType: "easy",
        effortType: "easy",
        title: `Rodaje suave · ${session.title}`,
        targetRpeText: "RPE 3–4",
        mainWorkout: "Rodaje continuo cómodo, sin trabajo de intensidad.",
      };
    }
    lastHardDate = session.date;
    return session;
  });
}

function scaleDistance(distanceKm: number | null, scale: number): number {
  if (distanceKm === null) return 0;
  return Math.max(0.1, Math.floor(distanceKm * scale * 10) / 10);
}

function isoWeekday(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function daysBetween(left: string, right: string): number {
  return differenceInCalendarDays(left, right);
}
