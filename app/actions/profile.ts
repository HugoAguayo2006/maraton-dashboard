"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveAthleteProfile } from "@/lib/data/athlete";
import { DataAccessError } from "@/lib/data/errors";
import { profileInputSchema } from "@/lib/profile/validation";

export interface ProfileActionState {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<"name" | "date_of_birth" | "weight_kg" | "sex", string[]>>;
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
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await saveAthleteProfile(parsed.data);
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
