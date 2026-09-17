import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { isBoltConfigured } from "@/lib/ai/config";
import { BoltRateLimitError } from "@/lib/ai/data";
import { boltPlanGenerationRequestSchema } from "@/lib/ai/schemas";
import { runBoltPlanGeneration } from "@/lib/ai/service";
import { isTrustedJsonMutation } from "@/lib/http/security";

export const maxDuration = 180;

export async function POST(request: Request) {
  if (!isTrustedJsonMutation(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  if (!isBoltConfigured()) return unavailable();
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = boltPlanGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa la disponibilidad ingresada." }, { status: 400 });
  }
  try {
    const { reason, ...preferences } = parsed.data;
    return NextResponse.json(await runBoltPlanGeneration({ preferences, reason }), { status: 201 });
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
    return unavailable();
  }
}

function unavailable() {
  return NextResponse.json({
    error: "Bolt AI no está disponible en este momento. Tu plan y tus entrenamientos siguen funcionando normalmente.",
  }, { status: 503 });
}
