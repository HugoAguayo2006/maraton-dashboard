import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el cliente de Bolt AI no contiene secretos ni nombres del proveedor", async () => {
  const widget = await readFile(new URL("../../components/bolt/BoltWidget.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(widget, /GEMINI_API_KEY|GEMINI_MODEL|GoogleGenAI|Gemini/i);
});

test("reiniciar el chat crea una conversación nueva sin borrar el historial", async () => {
  const widget = await readFile(new URL("../../components/bolt/BoltWidget.tsx", import.meta.url), "utf8");
  assert.match(widget, />Reiniciar chat</);
  assert.match(widget, /setConversation\(null\)/);
  assert.match(widget, /setStartFresh\(true\)/);
  assert.doesNotMatch(widget, /fetch\([^\n]*\/api\/bolt\/chat[^\n]*method:\s*["']DELETE/);
});

test("el historial de Bolt queda aislado por la cuenta autenticada", async () => {
  const route = await readFile(new URL("../../app/api/bolt/chat/route.ts", import.meta.url), "utf8");
  const data = await readFile(new URL("../../lib/ai/data.ts", import.meta.url), "utf8");
  assert.match(route, /getAuthenticatedUser\(\)/);
  assert.match(data, /const user = await requireUser\(\)/);
  assert.match(data, /user_id: user\.id/);
  assert.match(data, /\.eq\("user_id", user\.id\)/);
});

test("los endpoints exponen un fallback seguro y no errores internos", async () => {
  const chatRoute = await readFile(new URL("../../app/api/bolt/chat/route.ts", import.meta.url), "utf8");
  assert.match(chatRoute, /Bolt AI no está disponible en este momento/);
  assert.doesNotMatch(chatRoute, /stack|GEMINI_API_KEY|GoogleGenAI/);
});

test("el endpoint y la función SQL requieren confirmación literal", async () => {
  const route = await readFile(new URL("../../app/api/bolt/plan-changes/[id]/route.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../../supabase/migrations/202609100006_phase4_bolt_ai.sql", import.meta.url), "utf8");
  assert.match(route, /z\.literal\(true\)/);
  assert.match(migration, /if p_confirm is not true/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
});

test("todas las tablas de Bolt tienen RLS", async () => {
  const migration = await readFile(new URL("../../supabase/migrations/202609100006_phase4_bolt_ai.sql", import.meta.url), "utf8");
  for (const table of ["ai_conversations", "ai_messages", "ai_plan_changes", "training_plan_versions", "athlete_ai_preferences", "ai_usage_events"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("los eventos de uso no pueden borrarse para evadir el límite", async () => {
  const migration = await readFile(new URL("../../supabase/migrations/202609100008_phase4_bolt_ai_rate_limit_hardening.sql", import.meta.url), "utf8");
  assert.match(migration, /revoke insert, update, delete on public\.ai_usage_events from authenticated/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /current_user_id uuid := \(select auth\.uid\(\)\)/);
});
