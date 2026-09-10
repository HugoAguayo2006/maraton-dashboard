"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Save, TriangleAlert } from "lucide-react";
import { saveProfile, type ProfileActionState } from "@/app/actions/profile";
import { AvatarField } from "@/components/profile/AvatarField";
import { athleteSexOptions } from "@/lib/profile/profile";
import type { AthleteProfile, AthleteSex } from "@/types/training";

const initialState: ProfileActionState = {};

interface ProfileFormProps {
  profile: AthleteProfile | null;
  intent: "onboarding" | "settings";
}

export function ProfileForm({ profile, intent }: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfile, initialState);
  const [sex, setSex] = useState<AthleteSex>(profile?.sex ?? "male");
  const [name, setName] = useState(profile?.name ?? "");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="profile_intent" value={intent} />

      <section>
        <div className="mb-4">
          <p className="eyebrow">Datos personales</p>
          <p className="mt-2 text-xs leading-5 text-muted">Tu edad se calcula automáticamente desde tu fecha de nacimiento.</p>
        </div>
        <div className="space-y-5">
          <AvatarField name={name} initialUrl={profile?.avatarUrl} showRemove />
          <Field label="Nombre" error={state.fieldErrors?.name?.[0]}>
            <input
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre completo"
              className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50"
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Fecha de nacimiento" error={state.fieldErrors?.date_of_birth?.[0]}>
              <input
                name="date_of_birth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
                className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold"
                required
              />
            </Field>
            <Field label="Peso en kg" error={state.fieldErrors?.weight_kg?.[0]}>
              <input
                name="weight_kg"
                type="number"
                min="1"
                max="500"
                step="0.1"
                inputMode="decimal"
                defaultValue={profile?.weightKg ?? ""}
                placeholder="80.0"
                className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50"
                required
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold text-muted">Sexo</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {athleteSexOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={sex === option.value}
                  onClick={() => setSex(option.value)}
                  className={`min-h-14 rounded-2xl border px-3 text-left transition-colors ${
                    sex === option.value
                      ? "border-accent bg-accent-soft text-accent-dark"
                      : "border-line bg-surface-subtle text-ink"
                  }`}
                >
                  <span className="block text-xs font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] opacity-65">{option.description}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="sex" value={sex} />
            {state.fieldErrors?.sex?.[0] && (
              <p className="mt-1.5 text-xs font-medium text-danger">{state.fieldErrors.sex[0]}</p>
            )}
          </fieldset>
        </div>
      </section>

      <div className="h-px bg-line" />

      <section>
        <div className="mb-4">
          <p className="eyebrow">Carrera objetivo</p>
          <p className="mt-2 text-xs leading-5 text-muted">Estos datos alimentan el countdown y el objetivo principal del Dashboard.</p>
        </div>
        <div className="space-y-5">
          <Field label="Nombre del evento" error={state.fieldErrors?.goal_event_name?.[0]}>
            <input
              name="goal_event_name"
              type="text"
              defaultValue={profile?.goalEventName ?? ""}
              placeholder="Maratón de Guadalajara"
              className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50"
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Distancia en km" error={state.fieldErrors?.goal_event_distance_km?.[0]}>
              <input
                name="goal_event_distance_km"
                type="number"
                min="0.1"
                max="1000"
                step="0.001"
                inputMode="decimal"
                defaultValue={profile?.goalEventDistanceKm ?? ""}
                placeholder="42.195"
                className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50"
                required
              />
            </Field>
            <Field label="Fecha del evento" error={state.fieldErrors?.goal_event_date?.[0]}>
              <input
                name="goal_event_date"
                type="date"
                defaultValue={profile?.goalEventDate ?? ""}
                className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold"
                required
              />
            </Field>
          </div>

          <Field label="Ciudad o lugar · opcional" error={state.fieldErrors?.goal_event_location?.[0]}>
            <input
              name="goal_event_location"
              type="text"
              defaultValue={profile?.goalEventLocation ?? ""}
              placeholder="Guadalajara, Jalisco"
              className="h-13 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50"
            />
          </Field>

          <Field label="Objetivo · opcional" error={state.fieldErrors?.goal_event_objective?.[0]}>
            <textarea
              name="goal_event_objective"
              defaultValue={profile?.goalEventObjective ?? ""}
              placeholder="Terminar bien y sin lesiones"
              rows={3}
              className="w-full resize-none rounded-2xl border border-line bg-surface-subtle px-4 py-3 text-sm font-semibold placeholder:text-muted/50"
            />
          </Field>
        </div>
      </section>

      {(state.error || state.message) && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium ${
            state.message ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
          }`}
        >
          {state.message ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
          <span>{state.message ?? state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-wait disabled:opacity-60 sm:w-fit sm:min-w-64"
      >
        <Save size={17} />
        {pending ? "Guardando…" : intent === "onboarding" ? "Completar perfil" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
