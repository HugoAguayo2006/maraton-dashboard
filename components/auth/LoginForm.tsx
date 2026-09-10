"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Scale,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { authenticate, type AuthActionState } from "@/app/actions/auth";
import { athleteSexOptions } from "@/lib/profile/profile";
import type { AthleteSex } from "@/types/training";

const initialState: AuthActionState = {};

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(authenticate, initialState);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [sex, setSex] = useState<AthleteSex>("male");
  const signup = mode === "signup";

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="auth_intent" value={mode} />

      {signup && (
        <>
          <AuthField label="Nombre" htmlFor="name" icon={UserRound} error={state.fieldErrors?.name?.[0]}>
            <input id="name" name="name" type="text" autoComplete="name" required placeholder="Tu nombre completo" className="auth-input" />
          </AuthField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Fecha de nacimiento" htmlFor="date_of_birth" icon={CalendarDays} error={state.fieldErrors?.date_of_birth?.[0]}>
              <input id="date_of_birth" name="date_of_birth" type="date" required className="auth-input" />
            </AuthField>
            <AuthField label="Peso en kg" htmlFor="weight_kg" icon={Scale} error={state.fieldErrors?.weight_kg?.[0]}>
              <input id="weight_kg" name="weight_kg" type="number" min="1" max="500" step="0.1" inputMode="decimal" required placeholder="80.0" className="auth-input" />
            </AuthField>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold text-muted">Sexo</legend>
            <div className="grid grid-cols-3 gap-2">
              {athleteSexOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={sex === option.value}
                  onClick={() => setSex(option.value)}
                  className={`min-h-12 rounded-xl border px-2 text-[10px] font-bold transition-colors ${
                    sex === option.value
                      ? "border-accent bg-accent-soft text-accent-dark"
                      : "border-line bg-surface-subtle text-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="sex" value={sex} />
            {state.fieldErrors?.sex?.[0] && <FieldError>{state.fieldErrors.sex[0]}</FieldError>}
          </fieldset>
        </>
      )}

      <AuthField label="Correo electrónico" htmlFor="email" icon={Mail} error={state.fieldErrors?.email?.[0]}>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="hugo@ejemplo.com" className="auth-input" />
      </AuthField>

      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete={signup ? "new-password" : "current-password"}
        placeholder="Mínimo 8 caracteres"
        error={state.fieldErrors?.password?.[0]}
      />

      {signup && (
        <PasswordField
          id="password_confirmation"
          name="password_confirmation"
          label="Confirmar contraseña"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          error={state.fieldErrors?.password_confirmation?.[0]}
        />
      )}

      {(state.error || state.message || !configured) && (
        <div role="status" className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium ${state.message ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {state.message ? <CheckCircle2 size={16} className="shrink-0" /> : <TriangleAlert size={16} className="shrink-0" />}
          <span>{state.message ?? state.error ?? "Faltan las variables de entorno de Supabase."}</span>
        </div>
      )}

      <button type="submit" disabled={pending || !configured} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-not-allowed disabled:opacity-45">
        {pending ? "Comprobando…" : signup ? "Crear mi cuenta" : "Iniciar sesión"}
        {!pending && <ArrowRight size={17} />}
      </button>

      <button type="button" onClick={() => setMode(signup ? "login" : "signup")} disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle disabled:opacity-45">
        {signup && <ArrowLeft size={16} />}
        {signup ? "Ya tengo una cuenta" : "Crear cuenta"}
      </button>
    </form>
  );
}

function AuthField({ label, htmlFor, icon: Icon, error, children }: { label: string; htmlFor: string; icon: typeof Mail; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-bold text-muted">{label}</label>
      <span className="relative block">
        <Icon size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        {children}
      </span>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField label={label} htmlFor={id} icon={LockKeyhole} error={error}>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={8}
        required
        placeholder={placeholder}
        className="auth-input auth-input-with-action"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white hover:text-ink"
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </AuthField>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="mt-1.5 block text-xs font-medium text-danger">{children}</span>;
}
