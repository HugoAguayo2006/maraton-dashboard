import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPace } from "@/lib/format";
import { getStravaActivities, StravaError } from "@/lib/strava/client";
import type { StravaActivitySummary } from "@/types/training";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });

  const url = new URL(request.url);
  const requestedPage = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  try {
    const activities = await getStravaActivities(page, 30);
    const ids = activities.map((activity) => String(activity.id));
    const supabase = await createClient();
    const { data: imported, error } = ids.length
      ? await supabase
          .from("workout_logs")
          .select("id,strava_activity_id")
          .eq("user_id", user.id)
          .in("strava_activity_id", ids)
      : { data: [], error: null };
    if (error) throw error;
    const importedByStravaId = new Map(
      (imported ?? []).map((row) => [row.strava_activity_id, row.id]),
    );
    const result: StravaActivitySummary[] = activities.map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      sportType: activity.sport_type,
      date: activity.start_date_local.slice(0, 10),
      distanceKm: Math.round((activity.distance / 1000) * 100) / 100,
      durationSeconds: activity.moving_time,
      averagePace: formatPace(activity.moving_time, activity.distance / 1000),
      elevationGain: typeof activity.total_elevation_gain === "number"
        ? activity.total_elevation_gain
        : null,
      averageHeartRate: typeof activity.average_heartrate === "number"
        ? Math.round(activity.average_heartrate)
        : null,
      importedWorkoutId: importedByStravaId.get(String(activity.id)) ?? null,
    }));
    return NextResponse.json({ activities: result, page, hasMore: activities.length === 30 });
  } catch (error) {
    const status = error instanceof StravaError ? error.status : 500;
    const message = error instanceof StravaError
      ? error.message
      : "No pudimos cargar tus actividades de Strava.";
    return NextResponse.json({ error: message }, { status });
  }
}

