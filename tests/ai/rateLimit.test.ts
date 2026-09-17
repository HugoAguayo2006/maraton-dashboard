import assert from "node:assert/strict";
import test from "node:test";
import { BoltRateLimitError, buildBoltRateLimitMessage } from "@/lib/ai/rateLimit";

test("explica el límite de 30 mensajes y su reinicio", () => {
  const message = buildBoltRateLimitMessage({
    limitType: "messages",
    maximum: 30,
    windowSeconds: 3_600,
    retryAfterSeconds: 45 * 60,
  });
  assert.match(message, /tokens para mensajes/);
  assert.match(message, /30 mensajes/);
  assert.match(message, /60 minutos/);
  assert.match(message, /se reinicia en 45 minutos/);
});

test("explica el límite de planes y conserva el momento de reinicio", () => {
  const now = Date.parse("2026-09-16T12:00:00.000Z");
  const error = new BoltRateLimitError({
    operation: "plan_generation",
    maximum: 4,
    windowSeconds: 86_400,
    resetAt: "2026-09-17T11:30:00.000Z",
    now,
  });
  assert.equal(error.limitType, "plan_generations");
  assert.equal(error.resetAt, "2026-09-17T11:30:00.000Z");
  assert.match(error.message, /tokens para planes/);
  assert.match(error.message, /4 generaciones/);
  assert.match(error.message, /24 horas/);
  assert.match(error.message, /se reinicia en 23 horas y 30 minutos/);
});
