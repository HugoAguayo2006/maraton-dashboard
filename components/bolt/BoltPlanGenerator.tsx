"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  Footprints,
  Gauge,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type {
  BoltPlanChangePreview,
  BoltPlanGenerationPreferences,
  BoltPlanSession,
} from "@/lib/ai/types";

const weekdays = [
  { value: 1, short: "L", label: "Lunes" },
  { value: 2, short: "M", label: "Martes" },
  { value: 3, short: "Mi", label: "Miércoles" },
  { value: 4, short: "J", label: "Jueves" },
  { value: 5, short: "V", label: "Viernes" },
  { value: 6, short: "S", label: "Sábado" },
  { value: 7, short: "D", label: "Domingo" },
];

const experienceLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const sessionTypeLabels: Record<BoltPlanSession["sessionType"], string> = {
  easy: "Suave",
  "long-run": "Tirada larga",
  tempo: "Tempo",
  intervals: "Intervalos",
  gym: "Gimnasio",
  strength: "Fuerza",
  recovery: "Recuperación",
  rest: "Descanso",
};

interface GeneratorProps {
  initialPreferences: BoltPlanGenerationPreferences | null;
  goalName: string;
  goalDate: string;
  hasExistingPlan: boolean;
  enabled: boolean;
}

export function BoltPlanGenerator({
  initialPreferences,
  goalName,
  goalDate,
  hasExistingPlan,
  enabled,
}: GeneratorProps) {
  const router = useRouter();
  const [experienceLevel, setExperienceLevel] = useState<BoltPlanGenerationPreferences["experienceLevel"]>(initialPreferences?.experienceLevel ?? "intermediate");
  const [runningDays, setRunningDays] = useState(initialPreferences?.runningDays ?? [2, 4, 7]);
  const [strengthDays, setStrengthDays] = useState(initialPreferences?.strengthDays ?? [3, 6]);
  const [preferredLongRunDay, setPreferredLongRunDay] = useState(initialPreferences?.preferredLongRunDay ?? 7);
  const [currentWeeklyKm, setCurrentWeeklyKm] = useState(initialPreferences?.currentWeeklyKm ?? 20);
  const [longestRecentRunKm, setLongestRecentRunKm] = useState(initialPreferences?.longestRecentRunKm ?? 8);
  const [timeConstraints, setTimeConstraints] = useState(initialPreferences?.timeConstraints ?? "");
  const [trainingNotes, setTrainingNotes] = useState(initialPreferences?.trainingNotes ?? "");
  const [reason, setReason] = useState(hasExistingPlan ? "Actualizar el plan con mi disponibilidad actual." : "Crear mi primer plan hacia la carrera objetivo.");
  const [proposal, setProposal] = useState<BoltPlanChangePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = useMemo(() => groupByWeek(proposal?.newPlan ?? []), [proposal]);
  const runningSessionCount = proposal?.newPlan.filter(isRunningSession).length ?? 0;
  const strengthSessionCount = proposal?.newPlan.filter((session) => session.sessionType === "gym" || session.sessionType === "strength").length ?? 0;

  function toggleDay(value: number, kind: "run" | "strength") {
    if (kind === "run") {
      setRunningDays((current) => {
        const next = current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort();
        if (!next.includes(preferredLongRunDay) && next.length) setPreferredLongRunDay(next[next.length - 1]);
        return next;
      });
      return;
    }
    setStrengthDays((current) => current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort());
  }

  async function generatePlan() {
    if (runningDays.length < 2) {
      setError("Selecciona al menos dos días disponibles para correr.");
      return;
    }
    if (!runningDays.includes(preferredLongRunDay)) {
      setError("La tirada larga debe coincidir con uno de tus días para correr.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (proposal?.status === "proposed") {
        await fetch(`/api/bolt/plan-changes/${proposal.id}`, { method: "DELETE" });
      }
      const response = await fetch("/api/bolt/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel,
          runningDays,
          strengthDays,
          preferredLongRunDay,
          currentWeeklyKm,
          longestRecentRunKm,
          timeConstraints: timeConstraints.trim() || null,
          trainingNotes: trainingNotes.trim() || null,
          reason: reason.trim(),
        }),
      });
      const payload: { error?: string; proposal?: BoltPlanChangePreview } = await response.json();
      if (!response.ok || !payload.proposal) throw new Error(payload.error ?? "No pudimos generar el plan.");
      setProposal(payload.proposal);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos generar el plan.");
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!proposal || proposal.status !== "proposed") return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/bolt/plan-changes/${proposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No pudimos guardar el plan.");
      router.push("/plan?bolt=saved");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar el plan.");
      setSaving(false);
    }
  }

  if (!enabled) {
    return (
      <section className="app-card mx-auto max-w-2xl p-6 text-center sm:p-9">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-subtle text-muted"><Zap size={21} /></span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">Bolt AI está desactivado</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">El plan manual, tus entrenamientos y el resto de Run Dashboard siguen disponibles normalmente.</p>
        <Link href="/plan" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white"><ArrowLeft size={17} /> Volver al plan</Link>
      </section>
    );
  }

  if (proposal) {
    return (
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2"><span className="eyebrow">Propuesta de Bolt AI</span><span className="rounded-full bg-warning-soft px-3 py-1 text-[10px] font-bold text-warning">Aún no guardada</span></div>
          <h1 className="mt-4 text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.7rem]">Tu plan está listo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{proposal.summary}</p>
          <button type="button" onClick={() => document.getElementById("bolt-plan-preview")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-accent px-4 text-xs font-bold text-white">Ver plan <ArrowRight size={16} /></button>
        </header>

        <section className="app-card mb-5 grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <PlanStat icon={CalendarDays} label="Semanas" value={String(weeks.length)} />
          <PlanStat icon={Footprints} label="Sesiones de carrera" value={String(runningSessionCount)} />
          <PlanStat icon={Dumbbell} label="Sesiones de fuerza" value={String(strengthSessionCount)} />
        </section>

        {hasExistingPlan && (
          <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-warning/15 bg-warning-soft p-4 text-xs leading-5 text-warning">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <p><strong>Reemplazará únicamente las sesiones futuras no completadas.</strong> Tus entrenamientos reales y las sesiones completadas se conservan.</p>
          </div>
        )}

        <div id="bolt-plan-preview" className="scroll-mt-5 space-y-3">
          {weeks.map(([week, sessions], index) => (
            <details key={week} open={index < 2} className="group app-card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-xs font-bold text-accent">S{week}</span>
                <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Semana {week}</h2><p className="mt-1 text-[11px] text-muted">{sessions.length} días · {weeklyDistance(sessions)} km de carrera</p></div>
                <ChevronDown size={17} className="text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="divide-y divide-line/70 border-t border-line/80 bg-surface-subtle/55 px-4 sm:px-5">
                {sessions.map((session) => <GeneratedSession key={`${session.date}-${session.title}`} session={session} />)}
              </div>
            </details>
          ))}
        </div>

        {error && <p role="alert" className="mt-5 rounded-2xl bg-danger-soft p-4 text-xs font-medium text-danger">{error}</p>}
        <div className="sticky bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-20 mt-6 rounded-[24px] border border-line bg-white/95 p-3 shadow-[0_16px_46px_rgba(17,17,20,.14)] backdrop-blur sm:flex sm:items-center sm:justify-between lg:bottom-4">
          <p className="hidden max-w-sm px-2 text-[11px] leading-5 text-muted sm:block"><ShieldCheck size={14} className="mr-1 inline" /> Bolt AI no modificará nada hasta que confirmes.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={saving} onClick={() => setProposal(null)} className="min-h-11 rounded-2xl border border-line bg-white px-4 text-xs font-bold text-muted">Editar datos</button>
            <button type="button" disabled={saving || loading} onClick={() => void generatePlan()} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-accent/15 bg-accent-soft px-4 text-xs font-bold text-accent"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Regenerar</button>
            <button type="button" disabled={saving || loading} onClick={() => void savePlan()} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-xs font-bold text-white">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Guardar plan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/plan" className="mb-5 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-muted hover:text-ink"><ArrowLeft size={17} /> Volver al plan</Link>
      <header className="app-card relative overflow-hidden bg-[linear-gradient(145deg,#111114,#292933)] p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -top-24 -right-20 size-56 rounded-full border-[42px] border-white/[.035]" />
        <span className="relative grid size-12 place-items-center rounded-2xl bg-white text-ink"><Zap size={21} fill="currentColor" /></span>
        <p className="relative mt-6 text-[10px] font-bold tracking-[.12em] text-white/50 uppercase">Bolt AI · Plan estructurado</p>
        <h1 className="relative mt-3 text-[2rem] leading-none font-bold tracking-[-0.05em] sm:text-[2.7rem]">Construyamos tu preparación</h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/60">Ajustaré el plan hacia {goalName} del {formatDate(goalDate)} con tu disponibilidad e historial real.</p>
      </header>

      <div className="mt-5 space-y-5">
        <FormSection number="01" title="Tu experiencia" description="Ayuda a elegir una progresión acorde a tu base actual.">
          <div className="grid gap-2 sm:grid-cols-3">{(Object.keys(experienceLabels) as Array<keyof typeof experienceLabels>).map((value) => <ChoiceButton key={value} selected={experienceLevel === value} onClick={() => setExperienceLevel(value)}>{experienceLabels[value]}</ChoiceButton>)}</div>
        </FormSection>

        <FormSection number="02" title="Disponibilidad semanal" description="Selecciona los días en que normalmente puedes entrenar.">
          <DayPicker label="Días para correr" selected={runningDays} onToggle={(day) => toggleDay(day, "run")} />
          <DayPicker label="Días para fuerza" selected={strengthDays} onToggle={(day) => toggleDay(day, "strength")} />
          <label className="block"><span className="mb-2 block text-xs font-bold text-muted">Día preferido para tirada larga</span><select value={preferredLongRunDay} onChange={(event) => setPreferredLongRunDay(Number(event.target.value))} className="auth-input px-4">{runningDays.map((day) => <option key={day} value={day}>{weekdays.find((item) => item.value === day)?.label}</option>)}</select></label>
        </FormSection>

        <FormSection number="03" title="Carga reciente" description="Usa valores aproximados; Bolt AI también consultará tus registros reales.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Kilómetros por semana" value={currentWeeklyKm} max={300} onChange={setCurrentWeeklyKm} />
            <NumberField label="Tirada más larga reciente" value={longestRecentRunKm} max={100} onChange={setLongestRecentRunKm} />
          </div>
        </FormSection>

        <FormSection number="04" title="Restricciones y preferencias" description="Comparte solo información útil para organizar tu entrenamiento.">
          <label className="block"><span className="mb-2 block text-xs font-bold text-muted">Restricciones de horario · opcional</span><textarea value={timeConstraints} onChange={(event) => setTimeConstraints(event.target.value)} maxLength={1000} rows={3} placeholder="Ej. entre semana solo puedo entrenar 60 minutos" className="w-full resize-y rounded-2xl border border-line bg-surface-subtle p-4 text-sm leading-6" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold text-muted">Notas de entrenamiento · opcional</span><textarea value={trainingNotes} onChange={(event) => setTrainingNotes(event.target.value)} maxLength={1500} rows={3} placeholder="Ej. prefiero gimnasio ligero después de días suaves" className="w-full resize-y rounded-2xl border border-line bg-surface-subtle p-4 text-sm leading-6" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold text-muted">Motivo de este plan</span><input list="bolt-plan-reasons" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={600} className="auth-input px-4" /><datalist id="bolt-plan-reasons"><option value="Cambió mi disponibilidad semanal." /><option value="Cambió la fecha de mi carrera." /><option value="Quiero un enfoque diferente." /><option value="Tuve una pausa en el entrenamiento." /><option value="Aumentó mi volumen reciente." /><option value="Disminuyó mi volumen reciente." /></datalist></label>
        </FormSection>
      </div>

      {hasExistingPlan && <p className="mt-5 flex items-start gap-2 rounded-2xl bg-warning-soft p-4 text-xs leading-5 text-warning"><TriangleAlert size={17} className="shrink-0" /> Podrás revisar todo antes de reemplazar las sesiones futuras no completadas.</p>}
      {error && <p role="alert" className="mt-5 rounded-2xl bg-danger-soft p-4 text-xs font-medium text-danger">{error}</p>}
      <button type="button" disabled={loading || reason.trim().length === 0} onClick={() => void generatePlan()} className="pressable mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,120,238,.22)] disabled:opacity-45">
        {loading ? <><LoaderCircle size={18} className="animate-spin" /> Bolt AI está construyendo tu plan…</> : <><Sparkles size={18} /> Generar vista previa <ArrowRight size={17} /></>}
      </button>
      <p className="mt-3 text-center text-[11px] leading-5 text-muted">La propuesta no se guarda automáticamente. Primero podrás revisar cada semana.</p>
    </div>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="app-card p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-[10px] font-bold text-accent">{number}</span><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-[11px] leading-5 text-muted">{description}</p></div></div><div className="space-y-5">{children}</div></section>;
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-12 rounded-2xl border px-4 text-xs font-bold transition-colors ${selected ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-muted"}`}>{children}</button>;
}

function DayPicker({ label, selected, onToggle }: { label: string; selected: number[]; onToggle: (day: number) => void }) {
  return <fieldset><legend className="mb-2 text-xs font-bold text-muted">{label}</legend><div className="grid grid-cols-7 gap-1.5 sm:gap-2">{weekdays.map((day) => <button key={day.value} type="button" title={day.label} aria-label={day.label} aria-pressed={selected.includes(day.value)} onClick={() => onToggle(day.value)} className={`aspect-square min-w-0 rounded-xl border text-xs font-bold transition-colors sm:aspect-auto sm:min-h-12 ${selected.includes(day.value) ? "border-accent bg-accent text-white" : "border-line bg-white text-muted"}`}>{day.short}</button>)}</div></fieldset>;
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-muted">{label}</span><div className="relative"><input type="number" min="0" max={max} step="0.1" inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value))} className="auth-input px-4 pr-12" /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-muted">km</span></div></label>;
}

function PlanStat({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-surface-subtle p-4"><span className="grid size-10 place-items-center rounded-xl bg-white text-accent shadow-sm"><Icon size={18} /></span><div><p className="text-xl font-bold">{value}</p><p className="text-[10px] font-bold text-muted uppercase">{label}</p></div></div>;
}

function GeneratedSession({ session }: { session: BoltPlanSession }) {
  const strength = session.sessionType === "gym" || session.sessionType === "strength";
  return <article className="flex gap-3 py-4"><span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${strength ? "bg-warning-soft text-warning" : session.sessionType === "rest" ? "bg-white text-muted" : "bg-accent-soft text-accent"}`}>{strength ? <Dumbbell size={16} /> : <Footprints size={16} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-bold">{session.title}</h3><span className="text-[10px] font-semibold text-muted">{formatDate(session.date)}</span></div><p className="mt-1 text-[11px] font-semibold text-muted">{sessionTypeLabels[session.sessionType]} · {session.distanceKm === null ? session.estimatedDurationMin ? `${session.estimatedDurationMin} min` : "Sin distancia" : `${session.distanceKm} km`} · {session.targetRpeText ?? "RPE —"}</p>{session.mainWorkout && <p className="mt-2 text-xs leading-5 text-muted">{session.mainWorkout}</p>}</div></article>;
}

function groupByWeek(sessions: BoltPlanSession[]): Array<[number, BoltPlanSession[]]> {
  const grouped = new Map<number, BoltPlanSession[]>();
  [...sessions].sort((a, b) => a.date.localeCompare(b.date)).forEach((session) => grouped.set(session.week, [...(grouped.get(session.week) ?? []), session]));
  return [...grouped.entries()].sort(([left], [right]) => left - right);
}

function weeklyDistance(sessions: BoltPlanSession[]): number {
  return Math.round(sessions.filter(isRunningSession).reduce((total, session) => total + (session.distanceKm ?? 0), 0) * 10) / 10;
}

function isRunningSession(session: BoltPlanSession): boolean {
  return ["easy", "long-run", "tempo", "intervals"].includes(session.sessionType);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}
