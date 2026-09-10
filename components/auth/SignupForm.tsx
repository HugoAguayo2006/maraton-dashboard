"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flag,
  Mail,
  MapPin,
  Medal,
  Scale,
  Target,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { signup, type AuthActionState } from "@/app/actions/auth";
import { AuthField, FieldError, PasswordField } from "@/components/auth/AuthField";
import { AvatarField } from "@/components/profile/AvatarField";
import { athleteSexOptions } from "@/lib/profile/profile";
import type { AthleteSex } from "@/types/training";

const initialState: AuthActionState = {};

export function SignupForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [sex, setSex] = useState<AthleteSex>("male");
  const [name, setName] = useState("");

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <SignupSection number="01" title="Datos personales" description="La información básica para identificar tu perfil.">
        <AuthField label="Nombre" htmlFor="name" icon={UserRound} error={state.fieldErrors?.name?.[0]}>
          <input id="name" name="name" type="text" autoComplete="name" required placeholder="Tu nombre completo" className="auth-input" value={name} onChange={(event) => setName(event.target.value)} />
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
                className={`min-h-12 min-w-0 rounded-xl border px-1.5 text-[10px] leading-4 font-bold transition-colors ${sex === option.value ? "border-accent bg-accent-soft text-accent-dark" : "border-line bg-white text-muted"}`}
              >
                {option.value === "prefer_not_to_say" ? (
                  <><span className="sm:hidden">Privado</span><span className="hidden sm:inline">{option.label}</span></>
                ) : option.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="sex" value={sex} />
          {state.fieldErrors?.sex?.[0] && <FieldError>{state.fieldErrors.sex[0]}</FieldError>}
        </fieldset>

        <AvatarField name={name} />
      </SignupSection>

      <SignupSection number="02" title="Carrera objetivo" description="El evento que dará dirección a tu preparación.">
        <AuthField label="Nombre del evento" htmlFor="goal_event_name" icon={Flag} error={state.fieldErrors?.goal_event_name?.[0]}>
          <input id="goal_event_name" name="goal_event_name" type="text" required placeholder="Maratón de Guadalajara" className="auth-input" />
        </AuthField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="Distancia en km" htmlFor="goal_event_distance_km" icon={Medal} error={state.fieldErrors?.goal_event_distance_km?.[0]}>
            <input id="goal_event_distance_km" name="goal_event_distance_km" type="number" min="0.1" max="1000" step="0.001" inputMode="decimal" required placeholder="42.195" className="auth-input" />
          </AuthField>
          <AuthField label="Fecha del evento" htmlFor="goal_event_date" icon={CalendarDays} error={state.fieldErrors?.goal_event_date?.[0]}>
            <input id="goal_event_date" name="goal_event_date" type="date" required className="auth-input" />
          </AuthField>
        </div>

        <AuthField label="Ciudad o lugar · opcional" htmlFor="goal_event_location" icon={MapPin} error={state.fieldErrors?.goal_event_location?.[0]}>
          <input id="goal_event_location" name="goal_event_location" type="text" placeholder="Guadalajara, Jalisco" className="auth-input" />
        </AuthField>

        <AuthField label="Objetivo · opcional" htmlFor="goal_event_objective" icon={Target} error={state.fieldErrors?.goal_event_objective?.[0]}>
          <input id="goal_event_objective" name="goal_event_objective" type="text" placeholder="Terminar bien y sin lesiones" className="auth-input" />
        </AuthField>
      </SignupSection>

      <SignupSection number="03" title="Tu cuenta" description="Usa un correo al que tengas acceso para confirmar tu cuenta.">
        <AuthField label="Correo electrónico" htmlFor="email" icon={Mail} error={state.fieldErrors?.email?.[0]}>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="hugo@ejemplo.com" className="auth-input" />
        </AuthField>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField id="password" name="password" label="Contraseña" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={state.fieldErrors?.password?.[0]} />
          <PasswordField id="password_confirmation" name="password_confirmation" label="Confirmar contraseña" autoComplete="new-password" placeholder="Repite tu contraseña" error={state.fieldErrors?.password_confirmation?.[0]} />
        </div>
      </SignupSection>

      {(state.error || state.message || !configured) && (
        <div role="status" className={`flex items-start gap-2.5 rounded-2xl p-4 text-xs font-medium ${state.message ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {state.message ? <CheckCircle2 size={17} className="shrink-0" /> : <TriangleAlert size={17} className="shrink-0" />}
          <span>{state.message ?? state.error ?? "Faltan las variables de entorno de Supabase."}</span>
        </div>
      )}

      <button type="submit" disabled={pending || !configured || Boolean(state.message)} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-not-allowed disabled:opacity-45">
        {pending ? "Creando tu perfil…" : "Crear mi cuenta"}
        {!pending && <ArrowRight size={17} />}
      </button>

      <Link href="/login" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle">
        <ArrowLeft size={16} /> Ya tengo una cuenta
      </Link>
    </form>
  );
}

function SignupSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-line bg-surface-subtle/70 p-4 sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[10px] font-bold text-accent shadow-sm">{number}</span>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
