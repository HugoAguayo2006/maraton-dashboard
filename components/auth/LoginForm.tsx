"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, TriangleAlert } from "lucide-react";
import { authenticate, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-muted">Correo electrónico</span>
        <span className="relative block">
          <Mail size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="hugo@ejemplo.com"
            className="h-13 w-full rounded-2xl border border-line bg-surface-subtle pr-4 pl-11 text-sm font-semibold placeholder:text-muted/45"
          />
        </span>
        {state.fieldErrors?.email && <p className="mt-1.5 text-xs font-medium text-danger">{state.fieldErrors.email[0]}</p>}
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-bold text-muted">Contraseña</span>
        <span className="relative block">
          <LockKeyhole size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
            placeholder="Mínimo 8 caracteres"
            className="h-13 w-full rounded-2xl border border-line bg-surface-subtle pr-4 pl-11 text-sm font-semibold placeholder:text-muted/45"
          />
        </span>
        {state.fieldErrors?.password && <p className="mt-1.5 text-xs font-medium text-danger">{state.fieldErrors.password[0]}</p>}
      </label>

      {(state.error || state.message || !configured) && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium ${
            state.message ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
          }`}
        >
          {state.message ? <CheckCircle2 size={16} className="shrink-0" /> : <TriangleAlert size={16} className="shrink-0" />}
          <span>{state.message ?? state.error ?? "Faltan las variables de entorno de Supabase."}</span>
        </div>
      )}

      <button
        type="submit"
        name="auth_intent"
        value="login"
        disabled={pending || !configured}
        className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pending ? "Comprobando…" : "Iniciar sesión"}
        {!pending && <ArrowRight size={17} />}
      </button>

      <button
        type="submit"
        name="auth_intent"
        value="signup"
        disabled={pending || !configured}
        className="min-h-12 w-full rounded-2xl border border-line bg-white px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45"
      >
        Crear cuenta
      </button>
    </form>
  );
}
