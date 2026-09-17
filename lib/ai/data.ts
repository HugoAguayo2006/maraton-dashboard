import "server-only";

import { requireUser } from "@/lib/auth";
import { getBoltAIConfig } from "@/lib/ai/config";
import { BoltRateLimitError } from "@/lib/ai/rateLimit";
import { createClient } from "@/lib/supabase/server";
import type { Json, TableInsert, TableRow } from "@/types/database";
import type {
  BoltConversation,
  BoltContextType,
  BoltMessage,
  BoltMessageRole,
  BoltOperation,
} from "@/lib/ai/types";

export { BoltRateLimitError } from "@/lib/ai/rateLimit";

export interface BoltUsageHandle {
  eventId: string;
  requestId: string;
  startedAt: number;
}

export async function beginBoltUsage(operation: BoltOperation): Promise<BoltUsageHandle> {
  const user = await requireUser();
  const supabase = await createClient();
  const config = getBoltAIConfig();
  const planOperation = operation === "plan_generation";
  const maximum = planOperation ? config.maxPlanGenerations : config.maxChatRequests;
  const windowSeconds = planOperation ? 86_400 : 3_600;
  const { data, error } = await supabase.rpc("begin_bolt_ai_usage", {
    p_operation: operation,
    p_maximum: maximum,
    p_window_seconds: windowSeconds,
  });
  if (error?.message.includes("Bolt AI rate limit reached")) {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { data: firstUsage } = await supabase
      .from("ai_usage_events")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("operation", operation)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const resetAt = new Date(
      firstUsage?.created_at
        ? new Date(firstUsage.created_at).getTime() + windowSeconds * 1000
        : Date.now() + windowSeconds * 1000,
    ).toISOString();
    throw new BoltRateLimitError({ operation, maximum, windowSeconds, resetAt });
  }
  const event = data?.[0];
  if (error || !event) throw new Error("Bolt usage could not be recorded.");
  return { eventId: event.event_id, requestId: event.request_id, startedAt: Date.now() };
}

export async function completeBoltUsage(
  handle: BoltUsageHandle,
  success: boolean,
  tokenEstimate: number | null,
): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("complete_bolt_ai_usage", {
    p_event_id: handle.eventId,
    p_success: success,
    p_duration_ms: Math.max(0, Date.now() - handle.startedAt),
    p_token_estimate: tokenEstimate,
  });
}

export async function getOrCreateConversation(input: {
  conversationId?: string | null;
  contextType: BoltContextType;
  contextRefId?: string | null;
  firstMessage: string;
}): Promise<BoltConversation> {
  const user = await requireUser();
  const supabase = await createClient();
  if (input.conversationId) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", input.conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) throw new Error("Conversation is unavailable.");
    return mapConversation(data);
  }

  const record: TableInsert<"ai_conversations"> = {
    user_id: user.id,
    title: titleFromMessage(input.firstMessage),
    context_type: input.contextType,
    context_ref_id: input.contextRefId ?? null,
  };
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert(record)
    .select("*")
    .single();
  if (error) throw new Error("Conversation could not be created.");
  return mapConversation(data);
}

export async function getLatestConversation(input: {
  contextType: BoltContextType;
  contextRefId?: string | null;
}): Promise<{ conversation: BoltConversation | null; messages: BoltMessage[] }> {
  const user = await requireUser();
  const supabase = await createClient();
  let query = supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("context_type", input.contextType)
    .order("updated_at", { ascending: false })
    .limit(1);
  query = input.contextRefId
    ? query.eq("context_ref_id", input.contextRefId)
    : query.is("context_ref_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Conversation could not be loaded.");
  if (!data) return { conversation: null, messages: [] };
  return { conversation: mapConversation(data), messages: await getConversationMessages(data.id, 40) };
}

export async function getConversationMessages(conversationId: string, limit = 12): Promise<BoltMessage[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Messages could not be loaded.");
  return (data ?? []).reverse().map(mapMessage);
}

export async function saveBoltMessage(input: {
  conversationId: string;
  role: BoltMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<BoltMessage> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: input.conversationId,
      user_id: user.id,
      role: input.role,
      content: input.content,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error) throw new Error("Message could not be saved.");
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId)
    .eq("user_id", user.id);
  return mapMessage(data);
}

function mapConversation(row: TableRow<"ai_conversations">): BoltConversation {
  return {
    id: row.id,
    title: row.title,
    contextType: row.context_type as BoltContextType,
    contextRefId: row.context_ref_id,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: TableRow<"ai_messages">): BoltMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as BoltMessageRole,
    content: row.content,
    metadata: toRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function titleFromMessage(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 58 ? `${clean.slice(0, 57)}…` : clean;
}

function toRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
