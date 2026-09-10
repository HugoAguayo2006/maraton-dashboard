"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { profileInputSchema } from "@/lib/profile/validation";

export interface AuthActionState {
  error?: string;
  message?: string;
  fieldErrors?: {
    name?: string[];
    date_of_birth?: string[];
    weight_kg?: string[];
    sex?: string[];
    email?: string[];
    password?: string[];
    password_confirmation?: string[];
  };
}

const authSchema = z.object({
  email: z.email("Escribe un correo válido.").trim().toLowerCase(),
  password: z
    .string({ error: "Escribe tu contraseña." })
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  password_confirmation: z.preprocess(
    (value) => value ?? undefined,
    z.string({ error: "Confirma tu contraseña." }).optional(),
  ),
  auth_intent: z.preprocess(
    (value) => value ?? "login",
    z.enum(["login", "signup"]),
  ),
});

export async function authenticate(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Configura Supabase antes de iniciar sesión." };
  }

  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
    auth_intent: formData.get("auth_intent"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { email, password, password_confirmation: confirmation, auth_intent: intent } = parsed.data;

  if (intent === "signup") {
    const profile = profileInputSchema.safeParse({
      name: formData.get("name"),
      date_of_birth: formData.get("date_of_birth"),
      weight_kg: formData.get("weight_kg"),
      sex: formData.get("sex"),
    });

    if (!profile.success || password !== confirmation) {
      return {
        fieldErrors: {
          ...(profile.success ? {} : profile.error.flatten().fieldErrors),
          ...(password === confirmation
            ? {}
            : { password_confirmation: ["Las contraseñas no coinciden."] }),
        },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profile.data.name,
          date_of_birth: profile.data.date_of_birth,
          weight_kg: profile.data.weight_kg,
          sex: profile.data.sex,
        },
      },
    });

    if (error) return { error: getFriendlyAuthError(error.code) };

    if (!data.session) {
      return {
        message: "Cuenta creada. Revisa tu correo para confirmar el acceso.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: getFriendlyAuthError(error.code) };
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
