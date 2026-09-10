import type { Metadata } from "next";
import { Activity, Trophy } from "lucide-react";
import { StrengthProgressChart } from "@/components/strength/StrengthProgressChart";
import { StrengthSectionNav } from "@/components/strength/StrengthSectionNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAthleteProfile } from "@/lib/data/athlete";
import { getExerciseLibrary, getStrengthProgress } from "@/lib/data/strength";
import { convertKilograms, formatStrengthValue } from "@/lib/strength/constants";

export const metadata: Metadata = { title: "Progresión de fuerza" };

export default async function StrengthProgressPage({ searchParams }: { searchParams: Promise<{ exercise?: string }> }) {
  const [query, exercises, profile] = await Promise.all([searchParams, getExerciseLibrary(), getAthleteProfile()]);
  const selected = exercises.find((exercise) => exercise.id === query.exercise) ?? exercises[0] ?? null;
  const points = selected ? await getStrengthProgress(selected.id) : [];
  const unit = profile?.strengthUnit ?? "kg";
  const latest = points.at(-1);
  const maximum = points.length ? Math.max(...points.map((point) => point.maximumKg)) : 0;

  return (
    <>
      <PageHeader eyebrow="Carga con contexto" title="Progresión" description="Observa tendencias por ejercicio; persigue consistencia, no récords que afecten tu carrera." />
      <StrengthSectionNav />
      <form method="get" className="app-card mb-4 p-4 sm:flex sm:items-end sm:gap-3 sm:p-5">
        <label className="block min-w-0 flex-1"><span className="mb-2 block text-xs font-bold text-muted">Ejercicio</span><select name="exercise" defaultValue={selected?.id} className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold">{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.nameEs} · {exercise.muscleGroup}</option>)}</select></label>
        <button type="submit" className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-5 text-xs font-bold text-white sm:mt-0 sm:w-auto">Ver ejercicio</button>
      </form>
      {selected && <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric icon={Trophy} label="Peso máximo" value={maximum ? `${formatStrengthValue(convertKilograms(maximum, unit))} ${unit}` : "—"} /><Metric icon={Activity} label="Últimas reps" value={latest ? String(latest.maximumRepetitions) : "—"} /><div className="col-span-2 sm:col-span-1"><Metric icon={Activity} label="Sesiones" value={String(points.length)} /></div></section>}
      <StrengthProgressChart data={points} unit={unit} />
      {points.length > 0 && <section className="app-card mt-4 overflow-hidden"><header className="border-b border-line p-4 sm:px-5"><p className="text-sm font-bold">Últimas marcas</p></header><div className="divide-y divide-line">{[...points].reverse().slice(0, 8).map((point) => <div key={point.sessionId} className="flex items-center justify-between gap-4 px-4 py-3 text-xs sm:px-5"><span className="font-semibold text-muted">{point.date}</span><span className="font-bold">{formatStrengthValue(convertKilograms(point.maximumKg, unit))} {unit} · {point.maximumRepetitions} reps</span></div>)}</div></section>}
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return <div className="app-card flex min-h-20 items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon size={16} /></span><span className="min-w-0"><span className="block truncate text-base font-bold">{value}</span><span className="mt-0.5 block truncate text-[9px] font-bold tracking-wide text-muted uppercase">{label}</span></span></div>;
}

