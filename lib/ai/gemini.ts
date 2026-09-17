import "server-only";

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getBoltAIConfig } from "@/lib/ai/config";
import { normalizeGeneratedPlan, stabilizeGeneratedPlan, validateGeneratedPlan } from "@/lib/ai/planValidation";
import { BOLT_PLAN_PROMPT, BOLT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { boltAIResponseSchema, boltPlanOutputSchema } from "@/lib/ai/schemas";
import type { AIProvider, AIProviderResult, BoltAIResponse, BoltPlanOutput } from "@/lib/ai/types";

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] };
const sessionProperties = {
  date: { type: "string" },
  week: { type: "integer" },
  sessionType: { type: "string", enum: ["easy", "long-run", "tempo", "intervals", "gym", "strength", "recovery", "rest"] },
  title: { type: "string" },
  distanceKm: nullableNumber,
  targetPaceText: nullableString,
  targetRpeText: nullableString,
  effortType: { anyOf: [{ type: "string", enum: ["recovery", "easy", "steady_moderate", "tempo_threshold", "intervals_speed", "long_run", "rest"] }, { type: "null" }] },
  estimatedDurationMin: nullableNumber,
  warmup: nullableString,
  mainWorkout: nullableString,
  cooldown: nullableString,
  strength: nullableString,
  nutrition: nullableString,
  recoveryNotes: nullableString,
  status: { type: "string", enum: ["pending", "modified", "skipped"] },
};
const sessionRequired = ["date", "week", "sessionType", "title", "status"];
const sessionJsonSchema = {
  type: "object",
  properties: sessionProperties,
  required: sessionRequired,
  additionalProperties: false,
};

const chatJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    answer: { type: "string" },
    relevantData: { type: "array", items: { type: "string" }, maxItems: 6 },
    recommendation: nullableString,
    suggestedPrompts: { type: "array", items: { type: "string" }, maxItems: 4 },
    safetyNotice: nullableString,
    planChange: {
      anyOf: [
        {
          type: "object",
          properties: {
            reason: { type: "string" },
            summary: { type: "string" },
            changes: {
              type: "array",
              minItems: 1,
              maxItems: 7,
              items: {
                type: "object",
                properties: {
                  action: { type: "string", enum: ["add", "update", "skip"] },
                  date: { type: "string" },
                  currentTitle: nullableString,
                  session: sessionJsonSchema,
                },
                required: ["action", "date", "currentTitle", "session"],
                additionalProperties: false,
              },
            },
          },
          required: ["reason", "summary", "changes"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
  },
  required: ["title", "answer", "relevantData", "recommendation", "suggestedPrompts", "safetyNotice", "planChange"],
  additionalProperties: false,
};

const planJsonSchema = {
  type: "object",
  properties: {
    planSummary: { type: "string" },
    weeks: { type: "integer" },
    runningDaysPerWeek: { type: "integer" },
    strengthDaysPerWeek: { type: "integer" },
    sessions: { type: "array", items: sessionJsonSchema },
  },
  required: ["planSummary", "weeks", "runningDaysPerWeek", "strengthDaysPerWeek", "sessions"],
  additionalProperties: false,
};

export class GeminiAIProvider implements AIProvider {
  async generateChat(input: Parameters<AIProvider["generateChat"]>[0]): Promise<AIProviderResult<BoltAIResponse>> {
    const config = getBoltAIConfig();
    const ai = createAIClient(config.apiKey);
    return generateWithFallback(config.model, config.fallbackModel, async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: JSON.stringify({
          athleteContext: input.context,
          recentConversation: input.history.slice(-12),
          userMessage: input.message,
        }),
        config: {
          systemInstruction: BOLT_SYSTEM_PROMPT,
          temperature: 0.25,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
          responseJsonSchema: chatJsonSchema,
        },
      });
      return {
        data: boltAIResponseSchema.parse(parseResponseText(response.text)),
        tokenCount: response.usageMetadata?.totalTokenCount ?? null,
      };
    });
  }

  async generatePlan(input: Parameters<AIProvider["generatePlan"]>[0]): Promise<AIProviderResult<BoltPlanOutput>> {
    const config = getBoltAIConfig();
    const ai = createAIClient(config.apiKey);
    const startDate = input.context.generatedAt.slice(0, 10);
    const goalDate = input.context.goal?.date ?? startDate;
    const allowedRunningDates = getAllowedDates(startDate, goalDate, input.preferences.runningDays);
    const allowedStrengthDates = getAllowedDates(startDate, goalDate, input.preferences.strengthDays);
    return generateWithFallback(config.planModel, config.planFallbackModel, async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: JSON.stringify({
          athleteContext: { ...input.context, applicationHelp: undefined },
          availabilityAndExperience: {
            ...input.preferences,
            weekdayConvention: "1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo",
            allowedRunningDates,
            allowedStrengthDates,
          },
          generationReason: input.reason,
        }),
        config: {
          systemInstruction: `${BOLT_SYSTEM_PROMPT}\n\n${BOLT_PLAN_PROMPT}`,
          temperature: 0.2,
          maxOutputTokens: 20000,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseJsonSchema: planJsonSchema,
        },
      });
      try {
        const normalized = normalizeGeneratedPlan(boltPlanOutputSchema.parse(parseResponseText(response.text)));
        const data = stabilizeGeneratedPlan(normalized, input.preferences);
        validateGeneratedPlan(data, input.preferences, goalDate, startDate);
        return {
          data,
          tokenCount: response.usageMetadata?.totalTokenCount ?? null,
        };
      } catch {
        throw new InvalidProviderResponseError();
      }
    }, { primary: 1, fallback: 1 });
  }
}

function createAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 75_000,
      retryOptions: { attempts: 1 },
    },
  });
}

function parseResponseText(value: string | undefined): unknown {
  if (!value) throw new InvalidProviderResponseError();
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    throw new InvalidProviderResponseError();
  }
}

class InvalidProviderResponseError extends Error {
  constructor() {
    super("Bolt AI returned an invalid structured response.");
    this.name = "InvalidProviderResponseError";
  }
}

const RETRYABLE_PROVIDER_STATUSES = new Set([429, 500, 502, 503, 504]);
const PRIMARY_PROVIDER_ATTEMPTS = 2;
const FALLBACK_PROVIDER_ATTEMPTS = 2;

async function generateWithFallback<T>(
  primaryModel: string,
  fallbackModel: string,
  operation: (model: string) => Promise<T>,
  attempts: { primary: number; fallback: number } = {
    primary: PRIMARY_PROVIDER_ATTEMPTS,
    fallback: FALLBACK_PROVIDER_ATTEMPTS,
  },
): Promise<T> {
  try {
    return await retryTransientProviderError(() => operation(primaryModel), attempts.primary);
  } catch (error) {
    if (!shouldUseFallbackModel(error) || fallbackModel === primaryModel) throw error;
    return retryTransientProviderError(() => operation(fallbackModel), attempts.fallback);
  }
}

async function retryTransientProviderError<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isTransientProviderError(error)) throw error;
      await delay(350 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

function isTransientProviderError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; name?: unknown; code?: unknown };
  if (typeof candidate.status === "number" && RETRYABLE_PROVIDER_STATUSES.has(candidate.status)) return true;
  if (candidate.name === "InvalidProviderResponseError" || candidate.name === "ZodError") return true;
  if (candidate.name === "TypeError" && candidate.code !== "ERR_INVALID_ARG_TYPE") return true;
  return candidate.code === "ECONNRESET" || candidate.code === "ETIMEDOUT" || candidate.code === "EAI_AGAIN";
}

function shouldUseFallbackModel(error: unknown): boolean {
  if (isTransientProviderError(error)) return true;
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return status === 404;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getAllowedDates(startDate: string, endDate: string, weekdays: number[]): string[] {
  const allowed = new Set(weekdays);
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const dates: string[] = [];
  while (cursor <= end) {
    const weekday = cursor.getUTCDay() || 7;
    if (allowed.has(weekday)) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
