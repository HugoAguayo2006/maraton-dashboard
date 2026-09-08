"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthActionState {
  error?: string;
  message?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}

const authSchema = z.object({
  email: z.email("Escribe un correo válido.").trim().toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
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
    auth_intent: formData.get("auth_intent"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { email, password, auth_intent: intent } = parsed.data;

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });

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
