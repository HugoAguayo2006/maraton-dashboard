import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el ejemplo de entorno no incluye valores ni secretos", async () => {
  const contents = await readFile(new URL("../../.env.example", import.meta.url), "utf8");
  const assignments = contents
    .split(/\r?\n/)
    .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line));

  assert.ok(assignments.length > 0);
  assert.ok(assignments.every((line) => line.endsWith("=")));
  assert.doesNotMatch(contents, /NEXT_PUBLIC_GEMINI|service_role/i);
});

test("la confirmación de correo usa verifyOtp en el servidor", async () => {
  const route = await readFile(new URL("../../app/auth/confirm/route.ts", import.meta.url), "utf8");
  assert.match(route, /verifyOtp/);
  assert.match(route, /token_hash/);
  assert.match(route, /getSafeRelativePath/);
});

test("las mutaciones JSON de Bolt y Strava validan el origen", async () => {
  for (const file of [
    "../../app/api/bolt/chat/route.ts",
    "../../app/api/bolt/plan/generate/route.ts",
    "../../app/api/bolt/plan-changes/[id]/route.ts",
    "../../app/api/strava/activities/[id]/import/route.ts",
  ]) {
    const route = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(route, /isTrustedJsonMutation\(request\)/);
  }
});

test("Storage de perfiles termina configurado como privado", async () => {
  const migration = await readFile(
    new URL("../../supabase/migrations/202609170001_private_profile_images.sql", import.meta.url),
    "utf8",
  );
  const athleteData = await readFile(new URL("../../lib/data/athlete.ts", import.meta.url), "utf8");
  assert.match(migration, /set public = false/);
  assert.match(athleteData, /createSignedUrl/);
});

test("las variables privadas no aparecen en Client Components", async () => {
  const clientFiles = [
    "../../components/bolt/BoltWidget.tsx",
    "../../components/bolt/BoltPlanGenerator.tsx",
    "../../components/workouts/StravaActivityPicker.tsx",
  ];
  for (const file of clientFiles) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /GEMINI_API_KEY|STRAVA_CLIENT_SECRET|INTEGRATION_ENCRYPTION_KEY/);
  }
});
