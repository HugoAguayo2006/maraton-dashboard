"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, TriangleAlert } from "lucide-react";
import { login, type AuthActionState } from "@/app/actions/auth";
import { AuthField, PasswordField } from "@/components/auth/AuthField";

const initialState: AuthActionState = {};

export function LoginForm({
  configured,
  nextPath,
}: {
  configured: boolean;
  nextPath?: string;
}) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />

      <AuthField label="Correo electrónico" htmlFor="email" icon={Mail} error={state.fieldErrors?.email?.[0]}>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="hugo@ejemplo.com" className="auth-input" />
      </AuthField>

      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        placeholder="Mínimo 8 caracteres"
        error={state.fieldErrors?.password?.[0]}
      />

      {(state.error || state.message || !configured) && (
        <div role="status" className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium ${state.message ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {state.message ? <CheckCircle2 size={16} className="shrink-0" /> : <TriangleAlert size={16} className="shrink-0" />}
          <span>{state.message ?? state.error ?? "Faltan las variables de entorno de Supabase."}</span>
        </div>
      )}

      <button type="submit" disabled={pending || !configured} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-not-allowed disabled:opacity-45">
        {pending ? "Comprobando…" : "Iniciar sesión"}
        {!pending && <ArrowRight size={17} />}
      </button>

      <Link href="/signup" className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-line bg-white px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle">
        Crear cuenta
      </Link>
    </form>
  );
}
