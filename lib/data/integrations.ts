import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationStatus } from "@/types/training";

export const getStravaIntegrationStatus = cache(async (): Promise<IntegrationStatus> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connected_integrations")
    .select("provider_user_id,expires_at,scopes")
    .eq("user_id", user.id)
    .eq("provider", "strava")
    .maybeSingle();

  if (error) throw new DataAccessError("No pudimos comprobar la conexión con Strava.");
  return {
    connected: Boolean(data),
    providerUserId: data?.provider_user_id ?? null,
    expiresAt: data?.expires_at ?? null,
    scopes: data?.scopes ?? [],
  };
});
