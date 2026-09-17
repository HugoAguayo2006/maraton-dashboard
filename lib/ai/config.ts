import "server-only";

const DEFAULT_MODEL = "gemini-3.6-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash";
const DEFAULT_PLAN_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_PLAN_FALLBACK_MODEL = "gemini-3.5-flash-lite";

export interface BoltAIConfig {
  apiKey: string;
  model: string;
  fallbackModel: string;
  planModel: string;
  planFallbackModel: string;
  maxChatRequests: number;
  maxPlanGenerations: number;
}

export function isBoltFeatureEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

export function isBoltConfigured(): boolean {
  return isBoltFeatureEnabled() && Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getBoltAIConfig(): BoltAIConfig {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!isBoltFeatureEnabled() || !apiKey) {
    throw new Error("Bolt AI server configuration is unavailable.");
  }
  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    fallbackModel: process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL,
    planModel: process.env.GEMINI_PLAN_MODEL?.trim() || DEFAULT_PLAN_MODEL,
    planFallbackModel: process.env.GEMINI_PLAN_FALLBACK_MODEL?.trim() || DEFAULT_PLAN_FALLBACK_MODEL,
    maxChatRequests: parsePositiveInteger(process.env.AI_MAX_CHAT_REQUESTS, 30),
    maxPlanGenerations: parsePositiveInteger(process.env.AI_MAX_PLAN_GENERATIONS, 4),
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
