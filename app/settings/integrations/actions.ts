"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { disconnectStrava } from "@/lib/strava/client";

export async function disconnectStravaAction() {
  await disconnectStrava();
  revalidatePath("/settings/integrations");
  revalidatePath("/workouts/new");
  redirect("/settings/integrations?disconnected=1");
}

