import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { DataAccessError } from "@/lib/data/errors";
import { createWorkoutLog } from "@/lib/data/workouts";
import { getStravaActivityBundle, inferRunActivityType, StravaError } from "@/lib/strava/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });

  try {
    const { id } = await params;
    const body = await readBody(request);
    const { activity, streams } = await getStravaActivityBundle(id);
    const distanceKm = activity.distance / 1000;
    if (!(distanceKm > 0) || !(activity.moving_time > 0)) {
      return NextResponse.json({ error: "La actividad no tiene distancia o tiempo válidos." }, { status: 400 });
    }

    const planItemId = typeof body.trainingPlanItemId === "string" && body.trainingPlanItemId
      ? body.trainingPlanItemId
      : null;
    const start = activity.start_latlng?.length === 2 ? activity.start_latlng : null;
    const workoutId = await createWorkoutLog({
      trainingPlanItemId: planItemId,
      date: activity.start_date_local.slice(0, 10),
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      durationSeconds: activity.moving_time,
      averagePaceSeconds: Math.round(activity.moving_time / distanceKm),
      rpe: null,
      pain: null,
      fatigue: null,
      sleepHours: null,
      averageHr: typeof activity.average_heartrate === "number"
        ? Math.round(activity.average_heartrate)
        : null,
      maxHr: typeof activity.max_heartrate === "number" ? Math.round(activity.max_heartrate) : null,
      giSymptoms: null,
      foodBefore: null,
      hydration: null,
      gels: null,
      notes: activity.device_name ? `Registrado con ${activity.device_name}.` : null,
      source: "strava",
      stravaActivityId: String(activity.id),
      activityType: inferRunActivityType(activity),
      providerActivityType: activity.sport_type,
      feeling: null,
      locationName: activity.name,
      locationCity: activity.location_city ?? null,
      routeName: activity.name,
      latitude: start?.[0] ?? null,
      longitude: start?.[1] ?? null,
      elevationGain: typeof activity.total_elevation_gain === "number"
        ? activity.total_elevation_gain
        : null,
      calories: typeof activity.calories === "number" ? activity.calories : null,
      weather: null,
      splits: (activity.splits_metric ?? [])
        .filter((split) => split.distance > 0 && split.moving_time > 0)
        .map((split) => ({
          kilometer: split.split,
          paceSeconds: Math.round(split.moving_time / (split.distance / 1000)),
          distanceMeters: split.distance,
          elevationDifference: typeof split.elevation_difference === "number"
            ? split.elevation_difference
            : null,
        })),
      route: activity.map?.polyline || activity.map?.summary_polyline
        ? {
            polyline: activity.map.polyline ?? activity.map.summary_polyline ?? "",
            distanceStream: streams.distance?.data ?? [],
            elevationStream: streams.altitude?.data ?? [],
          }
        : null,
    });

    ["/dashboard", "/workouts", "/plan", "/progress"].forEach((path) => revalidatePath(path));
    return NextResponse.json({ workoutId }, { status: 201 });
  } catch (error) {
    const status = error instanceof StravaError
      ? error.status
      : error instanceof DataAccessError
        ? 400
        : 500;
    const message = error instanceof StravaError || error instanceof DataAccessError
      ? error.message
      : "No pudimos importar la actividad.";
    return NextResponse.json({ error: message }, { status });
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

