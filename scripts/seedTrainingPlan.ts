import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableUpdate } from "../types/database";
import { trainingPlanSeed } from "./trainingPlan.seed";

dotenv.config({ path: ".env.local", quiet: true });

async function seed() {
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

  if (authError || !authData.user) {
    throw new Error("No fue posible autenticar al usuario del seed.");
  }

  const userId = authData.user.id;
  if (expectedUserId && expectedUserId !== userId) {
    throw new Error("SEED_USER_ID no coincide con el usuario autenticado.");
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileLookupError) throw new Error("No fue posible comprobar el perfil del atleta.");
  if (!existingProfile) {
    throw new Error("Completa el onboarding antes de ejecutar el seed.");
  }

  const profile: TableUpdate<"athlete_profiles"> = {
    marathon_name: "Maratón de Guadalajara",
    marathon_date: "2026-11-08",
    goal: "Terminar bien y sin lesiones",
    natural_pace_seconds: 360,
  };

  const { error: profileError } = await supabase
    .from("athlete_profiles")
    .update(profile)
    .eq("id", existingProfile.id)
    .eq("user_id", userId);

  if (profileError) throw new Error("No fue posible cargar el perfil del atleta.");

  if (trainingPlanSeed.length > 0) {
    const planRows: TableInsert<"training_plan_items">[] = trainingPlanSeed.map(
      (item) => ({ ...item, user_id: userId }),
    );
    const { error: planError } = await supabase
      .from("training_plan_items")
      .upsert(planRows, { onConflict: "user_id,date,title" });

    if (planError) throw new Error("No fue posible cargar el plan de entrenamiento.");
  }

  await supabase.auth.signOut();
  console.log(
    `Seed completado: perfil de ${email} actualizado y ${trainingPlanSeed.length} sesiones procesadas.`,
  );
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(`Seed cancelado: ${message}`);
  process.exitCode = 1;
});
