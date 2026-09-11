import "server-only";

import { requireUser } from "@/lib/auth";
import { encryptSecret, decryptSecret } from "@/lib/integrations/crypto";
import { createClient } from "@/lib/supabase/server";
import { getStravaConfig } from "@/lib/strava/config";
import type { TableInsert } from "@/types/database";
import type { RunActivityType } from "@/types/training";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const RUN_SPORT_TYPES = new Set(["Run", "TrailRun", "VirtualRun", "Wheelchair"]);

export class StravaError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "StravaError";
  }
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope?: string;
  athlete?: { id: number | string };
}

export interface StravaSummaryActivityApi {
  id: number | string;
  name: string;
  sport_type: string;
  type?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain?: number;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
}

export interface StravaSplitApi {
  split: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_difference?: number;
}

export interface StravaDetailedActivityApi extends StravaSummaryActivityApi {
  calories?: number;
  workout_type?: number | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
  start_latlng?: [number, number] | [];
  map?: { summary_polyline?: string | null; polyline?: string | null };
  splits_metric?: StravaSplitApi[];
  device_name?: string | null;
}

interface StravaStream {
  data: number[];
}

export interface StravaStreamSet {
  distance?: StravaStream;
  altitude?: StravaStream;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const config = getStravaConfig();
  return requestToken({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
  });
}

export async function saveStravaConnection(tokens: StravaTokenResponse, scopes: string[]): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  if (!tokens.athlete?.id) throw new StravaError("Strava no devolvió la identidad del atleta.");

  const record: TableInsert<"connected_integrations"> = {
    user_id: user.id,
    provider: "strava",
    provider_user_id: String(tokens.athlete.id),
    access_token: encryptSecret(tokens.access_token),
    refresh_token: encryptSecret(tokens.refresh_token),
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    scopes,
  };
  const { error } = await supabase
    .from("connected_integrations")
    .upsert(record, { onConflict: "user_id,provider" });
  if (error) throw new StravaError("No pudimos guardar la conexión con Strava.");
}

export async function getStravaActivities(page = 1, perPage = 30): Promise<StravaSummaryActivityApi[]> {
  const activities = await stravaRequest<StravaSummaryActivityApi[]>(
    `/athlete/activities?page=${page}&per_page=${perPage}`,
  );
  return activities.filter((activity) => RUN_SPORT_TYPES.has(activity.sport_type));
}

export async function getStravaActivityBundle(activityId: string): Promise<{
  activity: StravaDetailedActivityApi;
  streams: StravaStreamSet;
}> {
  if (!/^\d+$/.test(activityId)) throw new StravaError("El identificador de Strava no es válido.", 400);
  const token = await getValidAccessToken();
  const [activity, streams] = await Promise.all([
    stravaFetch<StravaDetailedActivityApi>(`/activities/${activityId}`, token),
    stravaFetch<StravaStreamSet>(
      `/activities/${activityId}/streams?keys=distance,altitude&key_by_type=true`,
      token,
      true,
    ),
  ]);
  if (!RUN_SPORT_TYPES.has(activity.sport_type)) {
    throw new StravaError("Solo se pueden importar actividades de carrera.", 400);
  }
  return { activity, streams };
}

export function inferRunActivityType(activity: StravaDetailedActivityApi): RunActivityType {
  const normalizedName = activity.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (activity.workout_type === 1 || /carrera|race|maraton/.test(normalizedName)) return "race";
  if (activity.workout_type === 2 || /tirada|long run|larga/.test(normalizedName) || activity.distance >= 18000) return "long_run";
  if (/tempo|threshold|umbral/.test(normalizedName)) return "tempo";
  if (activity.workout_type === 3 || /interval|series|repeticiones/.test(normalizedName)) return "interval";
  if (/recovery|recuperacion|shakeout/.test(normalizedName)) return "recovery";
  return "easy";
}

export async function disconnectStrava(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("connected_integrations")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "strava")
    .maybeSingle();

  if (data?.access_token) {
    try {
      const token = decryptSecret(data.access_token);
      const config = getStravaConfig();
      const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
      await fetch("https://www.strava.com/oauth/revoke", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token, token_type_hint: "access_token" }),
        cache: "no-store",
      });
    } catch {
      // The local connection is still removed when Strava is temporarily unavailable.
    }
  }

  const { error } = await supabase
    .from("connected_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "strava");
  if (error) throw new StravaError("No pudimos desconectar Strava.");
}

async function stravaRequest<T>(path: string): Promise<T> {
  return stravaFetch<T>(path, await getValidAccessToken());
}

async function stravaFetch<T>(path: string, token: string, allowMissing = false): Promise<T> {
  const response = await fetch(`${STRAVA_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (allowMissing && response.status === 404) return {} as T;
  if (!response.ok) {
    const message = response.status === 429
      ? "Strava alcanzó temporalmente su límite de consultas. Intenta más tarde."
      : response.status === 401
        ? "La conexión con Strava venció. Vuelve a conectarla."
        : "Strava no pudo responder en este momento.";
    throw new StravaError(message, response.status);
  }
  return response.json() as Promise<T>;
}

async function getValidAccessToken(): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connected_integrations")
    .select("access_token,refresh_token,expires_at")
    .eq("user_id", user.id)
    .eq("provider", "strava")
    .maybeSingle();

  if (error || !data) throw new StravaError("Conecta tu cuenta de Strava para continuar.", 409);
  if (new Date(data.expires_at).getTime() > Date.now() + 60 * 60 * 1000) {
    return decryptSecret(data.access_token);
  }

  const config = getStravaConfig();
  const refreshed = await requestToken({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: decryptSecret(data.refresh_token),
    grant_type: "refresh_token",
  });
  const { error: updateError } = await supabase
    .from("connected_integrations")
    .update({
      access_token: encryptSecret(refreshed.access_token),
      refresh_token: encryptSecret(refreshed.refresh_token),
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    })
    .eq("user_id", user.id)
    .eq("provider", "strava");
  if (updateError) throw new StravaError("No pudimos renovar la conexión con Strava.");
  return refreshed.access_token;
}

async function requestToken(values: Record<string, string>): Promise<StravaTokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(values),
    cache: "no-store",
  });
  if (!response.ok) throw new StravaError("Strava rechazó la autorización. Intenta conectarte otra vez.", response.status);
  return response.json() as Promise<StravaTokenResponse>;
}
