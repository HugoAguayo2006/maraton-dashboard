"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveAthleteProfile } from "@/lib/data/athlete";
import {
  getOptionalAvatarFile,
  replaceAvatarForUser,
  validateAvatarFile,
} from "@/lib/data/avatar";
import { DataAccessError } from "@/lib/data/errors";
import { profileInputSchema } from "@/lib/profile/validation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<
    | "name"
    | "date_of_birth"
    | "weight_kg"
    | "sex"
    | "goal_event_name"
    | "goal_event_distance_km"
    | "goal_event_date"
    | "goal_event_location"
    | "goal_event_objective"
    | "strength_unit",
    string[]
  >>;
}

export async function saveProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileInputSchema.safeParse({
    name: formData.get("name"),
    date_of_birth: formData.get("date_of_birth"),
    weight_kg: formData.get("weight_kg"),
    sex: formData.get("sex"),
    goal_event_name: formData.get("goal_event_name"),
    goal_event_distance_km: formData.get("goal_event_distance_km"),
    goal_event_date: formData.get("goal_event_date"),
    goal_event_location: formData.get("goal_event_location"),
    goal_event_objective: formData.get("goal_event_objective"),
    strength_unit: formData.get("strength_unit"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const avatar = getOptionalAvatarFile(formData.get("avatar"));
    const removeAvatar = formData.get("remove_avatar") === "true";
    validateAvatarFile(avatar);
    await saveAthleteProfile(parsed.data);
    if (avatar || removeAvatar) {
      const user = await requireUser();
      const supabase = await createClient();
      await replaceAvatarForUser(supabase, user.id, avatar, removeAvatar);
    }
  } catch (error) {
    return {
      error: error instanceof DataAccessError
        ? error.message
        : "No pudimos guardar tu perfil. Intenta nuevamente.",
    };
  }

  revalidatePath("/", "layout");

  if (formData.get("profile_intent") === "onboarding") {
    redirect("/dashboard");
  }

  return { message: "Perfil actualizado correctamente." };
}
