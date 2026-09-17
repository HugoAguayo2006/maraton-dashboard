import "server-only";

import { isBoltConfigured } from "@/lib/ai/config";
import { buildBoltContext } from "@/lib/ai/context";
import {
  beginBoltUsage,
  completeBoltUsage,
  getConversationMessages,
  getOrCreateConversation,
  saveBoltMessage,
  type BoltUsageHandle,
} from "@/lib/ai/data";
import { getAIProvider } from "@/lib/ai/provider";
import { boltWriteTools } from "@/lib/ai/writeTools";
import type {
  BoltAIResponse,
  BoltContextType,
  BoltMessage,
  BoltPlanChangePreview,
  BoltPlanGenerationPreferences,
} from "@/lib/ai/types";

export class BoltUnavailableError extends Error {
  constructor() {
    super("Bolt AI no está disponible en este momento. Tu plan y tus entrenamientos siguen funcionando normalmente.");
    this.name = "BoltUnavailableError";
  }
}

export async function runBoltChat(input: {
  conversationId?: string | null;
  message: string;
  contextType: BoltContextType;
  contextRefId?: string | null;
}): Promise<{
  conversationId: string;
  userMessage: BoltMessage;
  assistantMessage: BoltMessage;
  response: BoltAIResponse;
  proposal: BoltPlanChangePreview | null;
}> {
  assertAvailable();
  const usage = await beginBoltUsage(input.contextType === "progress" ? "progress_analysis" : "chat");
  let tokenCount: number | null = null;
  let failureStage = "conversation";
  try {
    const conversation = await getOrCreateConversation({
      conversationId: input.conversationId,
      contextType: input.contextType,
      contextRefId: input.contextRefId,
      firstMessage: input.message,
    });
    failureStage = "conversation_history";
    const previousMessages = await getConversationMessages(conversation.id, 12);
    failureStage = "user_message";
    const userMessage = await saveBoltMessage({
      conversationId: conversation.id,
      role: "user",
      content: input.message,
    });
    failureStage = "context";
    const context = await buildBoltContext({ type: input.contextType, refId: input.contextRefId });
    failureStage = "provider";
    const result = await getAIProvider().generateChat({
      context,
      history: previousMessages.map((message) => ({ role: message.role, content: message.content })),
      message: input.message,
    });
    tokenCount = result.tokenCount;
    let response = result.data;
    let proposal: BoltPlanChangePreview | null = null;
    if (response.planChange) {
      failureStage = "plan_change_preview";
      try {
        proposal = await boltWriteTools.propose_plan_change({
          suggestion: response.planChange,
          conversationId: conversation.id,
        });
      } catch {
        response = {
          ...response,
          planChange: null,
          safetyNotice: response.safetyNotice
            ?? "La idea requiere más validación antes de convertirse en un cambio aplicable. Tu plan no fue modificado.",
        };
      }
    }
    failureStage = "assistant_message";
    const assistantMessage = await saveBoltMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: response.answer,
      metadata: {
        title: response.title,
        relevantData: response.relevantData,
        recommendation: response.recommendation,
        suggestedPrompts: response.suggestedPrompts,
        safetyNotice: response.safetyNotice,
        planChangeId: proposal?.id ?? null,
      },
    });
    await completeAndLog(usage, true, tokenCount, input.contextType === "progress" ? "progress_analysis" : "chat");
    return { conversationId: conversation.id, userMessage, assistantMessage, response, proposal };
  } catch (error) {
    await completeAndLog(usage, false, tokenCount, input.contextType === "progress" ? "progress_analysis" : "chat");
    logBoltFailure(usage.requestId, failureStage, error);
    if (error instanceof BoltUnavailableError) throw error;
    throw new BoltUnavailableError();
  }
}

export async function runBoltPlanGeneration(input: {
  preferences: BoltPlanGenerationPreferences;
  reason: string;
}): Promise<{ proposal: BoltPlanChangePreview; tokenCount: number | null }> {
  assertAvailable();
  const usage = await beginBoltUsage("plan_generation");
  let tokenCount: number | null = null;
  let failureStage = "context";
  try {
    const context = await buildBoltContext({ type: "plan" });
    if (!context.goal) throw new Error("A goal event is required.");
    failureStage = "provider";
    const result = await getAIProvider().generatePlan({
      context,
      preferences: input.preferences,
      reason: input.reason,
    });
    tokenCount = result.tokenCount;
    failureStage = "plan_validation";
    const proposal = await boltWriteTools.propose_generated_plan({
      output: result.data,
      preferences: input.preferences,
      reason: input.reason,
      goalDate: context.goal.date,
    });
    await completeAndLog(usage, true, tokenCount, "plan_generation");
    return { proposal, tokenCount };
  } catch (error) {
    await completeAndLog(usage, false, tokenCount, "plan_generation");
    logBoltFailure(usage.requestId, failureStage, error);
    throw new BoltUnavailableError();
  }
}

function assertAvailable(): void {
  if (!isBoltConfigured()) throw new BoltUnavailableError();
}

async function completeAndLog(
  usage: BoltUsageHandle,
  success: boolean,
  tokenCount: number | null,
  operation: string,
): Promise<void> {
  await completeBoltUsage(usage, success, tokenCount);
  console.info("Bolt AI request", JSON.stringify({
    requestId: usage.requestId,
    operation,
    success,
    durationMs: Math.max(0, Date.now() - usage.startedAt),
    tokenEstimate: tokenCount,
  }));
}

function logBoltFailure(requestId: string, stage: string, error: unknown): void {
  const record: Record<string, unknown> = {
    requestId,
    stage,
    errorName: error instanceof Error ? error.name : "UnknownError",
  };
  if (error && typeof error === "object") {
    const candidate = error as { status?: unknown; code?: unknown; issues?: unknown[] };
    if (typeof candidate.status === "number") record.status = candidate.status;
    if (typeof candidate.code === "string" || typeof candidate.code === "number") record.code = candidate.code;
    if (Array.isArray(candidate.issues)) {
      record.validationIssues = candidate.issues.slice(0, 8).map((issue) => {
        if (!issue || typeof issue !== "object") return { code: "unknown" };
        const value = issue as { code?: unknown; path?: unknown };
        return {
          code: typeof value.code === "string" ? value.code : "unknown",
          path: Array.isArray(value.path) ? value.path.map(String).join(".") : "",
        };
      });
    }
  }
  console.error("Bolt AI failure", JSON.stringify(record));
}
