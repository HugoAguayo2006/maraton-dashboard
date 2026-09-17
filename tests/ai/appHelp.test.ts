import assert from "node:assert/strict";
import test from "node:test";
import { boltAppHelp } from "@/lib/ai/appHelp";
import { BOLT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

test("el manual de Bolt cubre las secciones principales de Run Dashboard", () => {
  const paths = new Set(boltAppHelp.features.map((feature) => feature.path));
  for (const path of [
    "/dashboard",
    "/plan",
    "/plan/generate",
    "/workouts",
    "/workouts/new/manual",
    "/settings/integrations",
    "/strength",
    "/progress",
    "/guide",
    "/settings",
  ]) {
    assert.ok(paths.has(path), `Falta documentar ${path}`);
  }
  assert.ok(boltAppHelp.features.every((feature) => feature.steps.length >= 3));
});

test("Bolt recibe reglas para explicar funciones sin inventarlas", () => {
  assert.match(BOLT_SYSTEM_PROMPT, /explicar cualquier funcionalidad de Run Dashboard/);
  assert.match(BOLT_SYSTEM_PROMPT, /no inventes rutas, botones ni capacidades/);
  assert.match(BOLT_SYSTEM_PROMPT, /No afirmes que pulsaste botones/);
});
