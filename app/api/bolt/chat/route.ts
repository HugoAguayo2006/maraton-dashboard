import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { isBoltConfigured } from "@/lib/ai/config";
import { getLatestConversation, BoltRateLimitError } from "@/lib/ai/data";
import { boltChatRequestSchema } from "@/lib/ai/schemas";
import { runBoltChat, BoltUnavailableError } from "@/lib/ai/service";
import type { BoltContextType } from "@/lib/ai/types";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  if (!isBoltConfigured()) return unavailable();
  const url = new URL(request.url);
  const contextType = normalizeContextType(url.searchParams.get("contextType"));
  const contextRefId = url.searchParams.get("contextRefId");
  try {
    return NextResponse.json(await getLatestConversation({ contextType, contextRefId }));
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  if (!isBoltConfigured()) return unavailable();
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = boltChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe una pregunta válida para Bolt AI." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runBoltChat(parsed.data));
  } catch (error) {
    if (error instanceof BoltRateLimitError) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        limitType: error.limitType,
        resetAt: error.resetAt,
      }, {
        status: 429,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      });
    }
    return unavailable(error instanceof BoltUnavailableError ? error.message : undefined);
  }
}

function unavailable(message?: string) {
  return NextResponse.json({
    error: message ?? "Bolt AI no está disponible en este momento. Tu plan y tus entrenamientos siguen funcionando normalmente.",
  }, { status: 503 });
}

function normalizeContextType(value: string | null): BoltContextType {
  return value === "dashboard" || value === "plan" || value === "workout" || value === "progress" || value === "guide"
    ? value
    : "global";
}
