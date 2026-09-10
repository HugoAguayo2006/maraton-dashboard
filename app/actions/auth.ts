"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getOptionalAvatarFile,
  replaceAvatarForUser,
  validateAvatarFile,
} from "@/lib/data/avatar";
import { DataAccessError } from "@/lib/data/errors";
import { profileInputSchema } from "@/lib/profile/validation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  message?: string;
  fieldErrors?: {
    name?: string[];
    date_of_birth?: string[];
    weight_kg?: string[];
    sex?: string[];
    goal_event_name?: string[];
    goal_event_distance_km?: string[];
    goal_event_date?: string[];
    goal_event_location?: string[];
    goal_event_objective?: string[];
    email?: string[];
    password?: string[];
    password_confirmation?: string[];
  };
}

const loginSchema = z.object({
  email: z.email("Escribe un correo válido.").trim().toLowerCase(),
  password: z
    .string({ error: "Escribe tu contraseña." })
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const signupAccountSchema = loginSchema.extend({
  password_confirmation: z.string({ error: "Confirma tu contraseña." }),
});

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Configura Supabase antes de iniciar sesión." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: getFriendlyAuthError(error.code) };

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(formData.get("next")));
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Configura Supabase antes de crear una cuenta." };
  }

  const account = signupAccountSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
  });
  const profile = profileInputSchema.safeParse({
    name: formData.get("name"),
    date_of_birth: formData.get("date_of_birth"),
    weight_kg: formData.get("weight_kg"),
    sex: formData.get("sex"),
    goal_event_name: formData.get("goal_event_name"),
    goal_event_distance_km: formData.get("goal_event_distance_km"),
    goal_event_date: formData.get("goal_event_date"),
    goal_event_location: formData.get("goal_event_location"),
    goal_event_objective: formData.get("goal_event_objective"),
  });

  const passwordMatches = account.success
    && account.data.password === account.data.password_confirmation;

  if (!account.success || !profile.success || !passwordMatches) {
    return {
      fieldErrors: {
        ...(account.success ? {} : account.error.flatten().fieldErrors),
        ...(profile.success ? {} : profile.error.flatten().fieldErrors),
        ...(passwordMatches
          ? {}
          : { password_confirmation: ["Las contraseñas no coinciden."] }),
      },
    };
  }

  const avatar = getOptionalAvatarFile(formData.get("avatar"));
  try {
    validateAvatarFile(avatar);
  } catch (error) {
    return { error: getFriendlyDataError(error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: account.data.email,
    password: account.data.password,
    options: {
      data: {
        name: profile.data.name,
        date_of_birth: profile.data.date_of_birth,
        weight_kg: profile.data.weight_kg,
        sex: profile.data.sex,
        goal_event_name: profile.data.goal_event_name,
        goal_event_distance_km: profile.data.goal_event_distance_km,
        goal_event_date: profile.data.goal_event_date,
        goal_event_location: profile.data.goal_event_location,
        goal_event_objective: profile.data.goal_event_objective,
      },
    },
  });

  if (error) return { error: getFriendlyAuthError(error.code) };

  if (!data.session || !data.user) {
    return {
      message: avatar
        ? "Cuenta creada. Confirma tu correo; después podrás agregar tu foto desde Configuración."
        : "Cuenta creada. Revisa tu correo para confirmar el acceso.",
    };
  }

  if (avatar) {
    try {
      await replaceAvatarForUser(supabase, data.user.id, avatar, false);
    } catch {
      revalidatePath("/", "layout");
      redirect("/settings?avatar=retry");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

function getSafeNextPath(value: FormDataEntryValue | null): string {
  return typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function getFriendlyAuthError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "El correo o la contraseña no son correctos.";
    case "email_not_confirmed":
      return "Confirma tu correo antes de iniciar sesión.";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con este correo.";
    case "weak_password":
      return "Elige una contraseña más segura.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    default:
      return "No pudimos completar el acceso. Intenta de nuevo.";
  }
}

function getFriendlyDataError(error: unknown): string {
  return error instanceof DataAccessError
    ? error.message
    : "No pudimos procesar la foto seleccionada.";
}
