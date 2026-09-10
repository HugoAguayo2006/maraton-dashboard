"use client";

import { useActionState, useMemo, useState } from "react";
import { Clock3, Gauge, HeartPulse, MoonStar, Route, TriangleAlert } from "lucide-react";
import { createWorkout, type WorkoutActionState } from "@/app/workouts/new/actions";
import { formatPace } from "@/lib/format";
import { formatDayAndDate } from "@/lib/format";
import type { TrainingPlanItem } from "@/types/training";

const gastrointestinalOptions = [
  { label: "Ninguno", value: "none" },
  { label: "Leves", value: "mild" },
  { label: "Moderados", value: "moderate" },
  { label: "Fuertes", value: "severe" },
] as const;

const initialState: WorkoutActionState = {};

export function WorkoutForm({ planItems, defaultDate }: { planItems: TrainingPlanItem[]; defaultDate: string }) {
  const defaultPlanItem = planItems.find((item) => item.date === defaultDate);
  const [formState, formAction, pending] = useActionState(createWorkout, initialState);
  const [date, setDate] = useState(defaultDate);
  const [selectedPlanItemId, setSelectedPlanItemId] = useState(defaultPlanItem?.id ?? "");
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("0");
  const [rpe, setRpe] = useState(3);
  const [pain, setPain] = useState(0);
  const [fatigue, setFatigue] = useState(2);
  const [gastrointestinal, setGastrointestinal] = useState("none");

  const durationSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  const pace = useMemo(
    () => formatPace(durationSeconds, Number(distance)),
    [distance, durationSeconds],
  );
  const matchingPlanItems = useMemo(
    () => planItems.filter((item) => item.date === date),
    [date, planItems],
  );

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    const matches = planItems.filter((item) => item.date === nextDate);
    setSelectedPlanItemId(matches.length === 1 ? matches[0].id : "");
  }

  return (
    <form action={formAction} className="space-y-4">
      <section className="app-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent"><Route size={19} /></span>
          <div><p className="text-base font-bold">Datos principales</p><p className="mt-0.5 text-xs text-muted">Fecha, distancia y tiempo total</p></div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Fecha">
            <input name="date" type="date" value={date} onChange={(event) => handleDateChange(event.target.value)} required className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold" />
          </Field>
          <Field label="Distancia (km)">
            <div className="relative">
              <input name="distance" type="number" min="0.1" step="0.01" inputMode="decimal" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="10.0" required className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 pr-12 text-base font-bold placeholder:text-muted/40" />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted">km</span>
            </div>
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Sesión del plan (opcional)">
            <select name="training_plan_item_id" value={selectedPlanItemId} onChange={(event) => setSelectedPlanItemId(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold">
              <option value="">Entrenamiento libre</option>
              {matchingPlanItems.map((item) => (
                <option key={item.id} value={item.id}>{formatDayAndDate(item.date)} · {item.title}</option>
              ))}
            </select>
            {matchingPlanItems.length === 0 && (
              <p className="mt-1.5 text-[11px] text-muted">No hay una carrera pendiente del plan para esta fecha.</p>
            )}
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-xs font-bold text-muted">Duración</legend>
          <div className="grid grid-cols-3 gap-2.5">
            <DurationField label="Horas" name="hours" value={hours} onChange={setHours} max={24} />
            <DurationField label="Minutos" name="minutes" value={minutes} onChange={setMinutes} max={59} />
            <DurationField label="Segundos" name="seconds" value={seconds} onChange={setSeconds} max={59} />
          </div>
        </fieldset>

        <div className="mt-5 flex items-center justify-between rounded-[20px] bg-ink p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-white/10"><Gauge size={18} /></span>
            <div><p className="text-[10px] font-bold tracking-wide text-white/50 uppercase">Pace calculado</p><p className="mt-0.5 text-xs text-white/55">Tiempo ÷ distancia</p></div>
          </div>
          <output className="text-xl font-bold tracking-[-0.04em]" aria-live="polite">{pace.replace(" ", "")}</output>
        </div>
      </section>

      <section className="app-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-warning-soft text-warning"><HeartPulse size={19} /></span>
          <div><p className="text-base font-bold">Cómo se sintió</p><p className="mt-0.5 text-xs text-muted">Tu percepción importa tanto como el reloj</p></div>
        </div>

        <fieldset>
          <div className="flex items-center justify-between">
            <legend className="text-xs font-bold text-muted">Esfuerzo percibido (RPE)</legend>
            <span className="text-xs font-bold text-accent">{rpe}/10</span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <button key={value} type="button" onClick={() => setRpe(value)} aria-pressed={rpe === value} className={`grid h-11 place-items-center rounded-xl text-sm font-bold transition-all ${rpe === value ? "bg-accent text-white shadow-[0_5px_14px_rgba(36,120,238,.24)]" : "border border-line bg-surface-subtle text-muted"}`}>
                {value}
              </button>
            ))}
          </div>
          <input type="hidden" name="rpe" value={rpe} />
        </fieldset>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <SliderField label="Dolor" name="pain" value={pain} onChange={setPain} lowLabel="Nada" highLabel="Mucho" />
          <SliderField label="Fatiga" name="fatigue" value={fatigue} onChange={setFatigue} lowLabel="Fresco" highLabel="Agotado" />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <Field label="Horas de sueño">
            <div className="relative">
              <MoonStar size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
              <input name="sleep_hours" type="number" min="0" max="16" step="0.1" inputMode="decimal" placeholder="7.5" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle pr-12 pl-11 text-sm font-semibold placeholder:text-muted/45" />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted">h</span>
            </div>
          </Field>
          <Field label="Frecuencia cardíaca promedio (opcional)">
            <div className="relative">
              <input name="average_heart_rate" type="number" min="30" max="240" inputMode="numeric" placeholder="148" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 pr-14 text-sm font-semibold placeholder:text-muted/45" />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted">ppm</span>
            </div>
          </Field>
          <Field label="Frecuencia cardíaca máxima (opcional)">
            <div className="relative">
              <input name="max_heart_rate" type="number" min="30" max="260" inputMode="numeric" placeholder="172" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 pr-14 text-sm font-semibold placeholder:text-muted/45" />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted">ppm</span>
            </div>
          </Field>
        </div>
      </section>

      <section className="app-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-success-soft text-success"><Clock3 size={19} /></span>
          <div><p className="text-base font-bold">Nutrición y contexto</p><p className="mt-0.5 text-xs text-muted">Detalles útiles para detectar patrones</p></div>
        </div>

        <fieldset>
          <legend className="mb-3 text-xs font-bold text-muted">Síntomas gastrointestinales</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {gastrointestinalOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => setGastrointestinal(option.value)} aria-pressed={gastrointestinal === option.value} className={`min-h-11 rounded-xl px-2 text-xs font-bold transition-colors ${gastrointestinal === option.value ? "bg-ink text-white" : "border border-line bg-surface-subtle text-muted"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="gastrointestinal_symptoms" value={gastrointestinal} />
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Comida previa"><input name="pre_run_food" type="text" placeholder="Ej. avena, plátano y café" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-medium placeholder:text-muted/55" /></Field>
          <Field label="Hidratación"><input name="hydration" type="text" placeholder="Ej. 650 ml de agua" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-medium placeholder:text-muted/55" /></Field>
          <Field label="Geles"><input name="gels" type="text" placeholder="Ej. 2 geles de 25 g" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-medium placeholder:text-muted/55" /></Field>
          <Field label="Notas"><textarea name="notes" rows={3} placeholder="¿Cómo salió la sesión?" className="w-full resize-none rounded-2xl border border-line bg-surface-subtle px-4 py-3 text-sm leading-5 font-medium placeholder:text-muted/55" /></Field>
        </div>
      </section>

      {formState.error && (
        <div role="alert" className="flex items-start gap-3 rounded-[20px] border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p><strong className="block">No pudimos guardar</strong><span className="text-danger/80">{formState.error}</span></p>
        </div>
      )}

      <button type="submit" disabled={pending} className="pressable min-h-14 w-full rounded-[20px] bg-accent px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.24)] disabled:cursor-wait disabled:opacity-60 sm:w-fit sm:min-w-72">
        {pending ? "Guardando…" : "Guardar entrenamiento"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-muted">{label}</span>{children}</label>;
}

function DurationField({ label, name, value, onChange, max }: { label: string; name: string; value: string; onChange: (value: string) => void; max: number }) {
  return (
    <label className="rounded-2xl border border-line bg-surface-subtle p-3">
      <span className="block text-[10px] font-bold text-muted uppercase">{label}</span>
      <input name={name} type="number" min="0" max={max} inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-xl font-bold" required />
    </label>
  );
}

function SliderField({ label, name, value, onChange, lowLabel, highLabel }: { label: string; name: string; value: number; onChange: (value: number) => void; lowLabel: string; highLabel: string }) {
  return (
    <label>
      <span className="flex items-center justify-between text-xs font-bold text-muted"><span>{label}</span><span className={value > 5 ? "text-danger" : "text-ink"}>{value}/10</span></span>
      <input name={name} type="range" min="0" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-4 h-2 w-full cursor-pointer" />
      <span className="mt-1.5 flex justify-between text-[10px] font-medium text-muted"><span>{lowLabel}</span><span>{highLabel}</span></span>
    </label>
  );
}
