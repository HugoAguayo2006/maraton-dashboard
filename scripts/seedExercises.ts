import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

dotenv.config({ path: ".env.local", quiet: true });

async function seedExercises() {
  const url = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = requireEnvironmentVariable("SEED_EMAIL");
  const password = requireEnvironmentVariable("SEED_PASSWORD");
  const expectedUserId = process.env.SEED_USER_ID?.trim();
  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError || !authData.user) throw new Error("No fue posible autenticar al usuario del seed.");
  if (expectedUserId && expectedUserId !== authData.user.id) {
    throw new Error("SEED_USER_ID no coincide con el usuario autenticado.");
  }

  const { data: processed, error: seedError } = await supabase.rpc("seed_exercise_library");
  if (seedError) throw new Error("No fue posible cargar el catálogo de ejercicios.");

  const { count, error: countError } = await supabase
    .from("exercise_library")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error("No fue posible verificar el catálogo.");

  await supabase.auth.signOut();
  console.log(`Catálogo listo: ${processed} filas procesadas, ${count ?? 0} ejercicios disponibles.`);
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

seedExercises().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(`Seed cancelado: ${message}`);
  process.exitCode = 1;
});

