import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { DataAccessError } from "@/lib/data/errors";
import { mapAthleteProfile } from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/profile/calculateAge";
import type { ProfileInput } from "@/lib/profile/validation";
import type { TableInsert, TableUpdate } from "@/types/database";
import type { AthleteProfile } from "@/types/training";

export const getAthleteProfile = cache(async (): Promise<AthleteProfile | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new DataAccessError("No pudimos cargar tu perfil.");
  return data ? mapAthleteProfile(data) : null;
});

export async function saveAthleteProfile(input: ProfileInput): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const age = calculateAge(input.date_of_birth);
  const { data: existing, error: lookupError } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) throw new DataAccessError("No pudimos comprobar tu perfil.");

  if (existing) {
    const update: TableUpdate<"athlete_profiles"> = {
      name: input.name,
      age,
      date_of_birth: input.date_of_birth,
      weight_kg: input.weight_kg,
      sex: input.sex,
    };
    const { error } = await supabase
      .from("athlete_profiles")
      .update(update)
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) throw new DataAccessError("No pudimos actualizar tu perfil.");
    return;
  }

  const insert: TableInsert<"athlete_profiles"> = {
    user_id: user.id,
    name: input.name,
    age,
    date_of_birth: input.date_of_birth,
    weight_kg: input.weight_kg,
    sex: input.sex,
    marathon_name: "Maratón de Guadalajara",
    marathon_date: "2026-11-08",
    goal: "Terminar bien y sin lesiones",
    natural_pace_seconds: 360,
  };
  const { error } = await supabase.from("athlete_profiles").insert(insert);

  if (error) throw new DataAccessError("No pudimos crear tu perfil.");
}
