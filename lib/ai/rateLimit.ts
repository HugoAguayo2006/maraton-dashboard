import type { BoltOperation } from "@/lib/ai/types";

export type BoltRateLimitType = "messages" | "plan_generations";

interface BoltRateLimitErrorInput {
  operation: BoltOperation;
  maximum: number;
  windowSeconds: number;
  resetAt: string;
  now?: number;
}

export class BoltRateLimitError extends Error {
  readonly code = "BOLT_RATE_LIMIT";
  readonly limitType: BoltRateLimitType;
  readonly maximum: number;
  readonly windowSeconds: number;
  readonly resetAt: string;
  readonly retryAfterSeconds: number;

  constructor(input: BoltRateLimitErrorInput) {
    const now = input.now ?? Date.now();
    const resetTime = new Date(input.resetAt).getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
    const limitType = input.operation === "plan_generation" ? "plan_generations" : "messages";
    super(buildBoltRateLimitMessage({
      limitType,
      maximum: input.maximum,
      windowSeconds: input.windowSeconds,
      retryAfterSeconds,
    }));
    this.name = "BoltRateLimitError";
    this.limitType = limitType;
    this.maximum = input.maximum;
    this.windowSeconds = input.windowSeconds;
    this.resetAt = input.resetAt;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function buildBoltRateLimitMessage(input: {
  limitType: BoltRateLimitType;
  maximum: number;
  windowSeconds: number;
  retryAfterSeconds: number;
}): string {
  const resetIn = formatRemainingTime(input.retryAfterSeconds);
  const window = input.windowSeconds === 3_600
    ? "60 minutos"
    : input.windowSeconds === 86_400
      ? "24 horas"
      : formatRemainingTime(input.windowSeconds);

  if (input.limitType === "plan_generations") {
    return `Acabaste tus tokens para planes. Ya utilizaste las ${input.maximum} generaciones disponibles en ${window}. El límite de generación de planes se reinicia en ${resetIn}.`;
  }
  return `Acabaste tus tokens para mensajes. Ya utilizaste los ${input.maximum} mensajes disponibles en ${window}. El límite del chat se reinicia en ${resetIn}.`;
}

function formatRemainingTime(totalSeconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} ${totalMinutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hoursText = `${hours} ${hours === 1 ? "hora" : "horas"}`;
  return minutes === 0
    ? hoursText
    : `${hoursText} y ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}
