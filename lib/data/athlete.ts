import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { DataAccessError } from "@/lib/data/errors";
import { mapAthleteProfile } from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
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
