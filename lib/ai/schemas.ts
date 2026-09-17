import { z } from "zod";

const nullableShortText = z.string().trim().max(1000).nullable().default(null);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "La fecha no es válida.");

export const boltPlanSessionSchema = z.object({
  date: isoDate,
  week: z.number().int().positive().max(104),
  sessionType: z.enum(["easy", "long-run", "tempo", "intervals", "gym", "strength", "recovery", "rest"]),
  title: z.string().trim().min(1).max(160),
  distanceKm: z.number().min(0).max(100).nullable().default(null),
  targetPaceText: z.string().trim().max(120).nullable().default(null),
  targetRpeText: z.string().trim().max(120).nullable().default(null),
  effortType: z.enum(["recovery", "easy", "steady_moderate", "tempo_threshold", "intervals_speed", "long_run", "rest"]).nullable().default(null),
  estimatedDurationMin: z.number().int().positive().max(1440).nullable().default(null),
  warmup: nullableShortText,
  mainWorkout: nullableShortText,
  cooldown: nullableShortText,
  strength: nullableShortText,
  nutrition: nullableShortText,
  recoveryNotes: nullableShortText,
  status: z.enum(["pending", "modified", "skipped"]).default("pending"),
});

const changeInstructionSchema = z.object({
  action: z.enum(["add", "update", "skip"]),
  date: isoDate,
  currentTitle: z.string().trim().max(160).nullable(),
  session: boltPlanSessionSchema,
});

export const boltAIResponseSchema = z.object({
  title: z.string().trim().min(1).max(100),
  answer: z.string().trim().min(1).max(3000),
  relevantData: z.array(z.string().trim().min(1).max(240)).max(6),
  recommendation: z.string().trim().min(1).max(1000).nullable(),
  suggestedPrompts: z.array(z.string().trim().min(1).max(120)).max(4),
  safetyNotice: z.string().trim().min(1).max(500).nullable(),
  planChange: z.object({
    reason: z.string().trim().min(1).max(600),
    summary: z.string().trim().min(1).max(600),
    changes: z.array(changeInstructionSchema).min(1).max(7),
  }).nullable(),
});

export const boltPlanOutputSchema = z.object({
  planSummary: z.string().trim().min(1).max(1200),
  weeks: z.number().int().positive().max(104),
  runningDaysPerWeek: z.number().int().min(1).max(7),
  strengthDaysPerWeek: z.number().int().min(0).max(4),
  sessions: z.array(boltPlanSessionSchema).min(1).max(740),
}).superRefine((plan, context) => {
  const identities = new Set<string>();
  for (const session of plan.sessions) {
    const identity = `${session.date}:${session.title.toLocaleLowerCase("es")}`;
    if (identities.has(identity)) {
      context.addIssue({ code: "custom", message: `Sesión duplicada: ${session.date} ${session.title}` });
    }
    identities.add(identity);
  }
});

export const boltChatRequestSchema = z.object({
  conversationId: z.uuid().nullable().optional(),
  message: z.string().trim().min(1).max(2000),
  contextType: z.enum(["global", "dashboard", "plan", "workout", "progress", "guide"]).default("global"),
  contextRefId: z.string().trim().max(200).nullable().optional(),
});

export const boltPlanGenerationRequestSchema = z.object({
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  runningDays: z.array(z.number().int().min(1).max(7)).min(2).max(7),
  strengthDays: z.array(z.number().int().min(1).max(7)).max(4),
  preferredLongRunDay: z.number().int().min(1).max(7),
  currentWeeklyKm: z.number().min(0).max(300),
  longestRecentRunKm: z.number().min(0).max(100),
  timeConstraints: z.string().trim().max(1000).nullable(),
  trainingNotes: z.string().trim().max(1500).nullable(),
  reason: z.string().trim().min(1).max(600),
}).superRefine((preferences, context) => {
  if (!preferences.runningDays.includes(preferences.preferredLongRunDay)) {
    context.addIssue({ code: "custom", path: ["preferredLongRunDay"], message: "La tirada larga debe coincidir con un día disponible para correr." });
  }
  if (new Set(preferences.runningDays).size !== preferences.runningDays.length) {
    context.addIssue({ code: "custom", path: ["runningDays"], message: "No repitas días disponibles." });
  }
});

export type BoltPlanSessionInput = z.infer<typeof boltPlanSessionSchema>;
