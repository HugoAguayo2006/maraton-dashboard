import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Dumbbell, Plus, Sparkles } from "lucide-react";
import { StrengthSectionNav } from "@/components/strength/StrengthSectionNav";
import { StrengthSessionCard } from "@/components/strength/StrengthSessionCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAthleteProfile } from "@/lib/data/athlete";
import { getNextStrengthPlanItem, getStrengthHistory, getStrengthRoutines } from "@/lib/data/strength";
import { formatDayAndDate } from "@/lib/format";
import { convertKilograms, formatStrengthValue } from "@/lib/strength/constants";
import { strengthPresets } from "@/lib/strength/presets";

export const metadata: Metadata = { title: "Fuerza" };

export default async function StrengthPage() {
  const [profile, routines, history, nextPlan] = await Promise.all([
    getAthleteProfile(),
    getStrengthRoutines(),
    getStrengthHistory(20),
    getNextStrengthPlanItem(),
  ]);
  const unit = profile?.strengthUnit ?? "kg";
  const volumeKg = history.reduce((total, session) => total + session.totalVolumeKg, 0);

  return (
    <>
      <PageHeader eyebrow="Entrenamiento complementario" title="Fuerza" description="Rutinas simples para correr mejor: registra únicamente lo que importa y vuelve a tu plan." action={<Link href="/strength/session/new" className="pressable flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(36,120,238,.22)]"><Plus size={18} /><span className="hidden sm:inline">Iniciar sesión</span></Link>} />
      <StrengthSectionNav />

      <section className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        <Stat label="Rutinas" value={String(routines.length)} />
        <Stat label="Sesiones" value={String(history.length)} />
        <Stat label="Volumen" value={`${formatStrengthValue(convertKilograms(volumeKg, unit), 0)} ${unit}`} />
      </section>

      {nextPlan && (
        <section className="mb-5 flex flex-col gap-4 rounded-[24px] bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-warning"><CalendarClock size={20} /></span><div className="min-w-0"><p className="text-[10px] font-bold tracking-wide text-white/50 uppercase">Próximo gimnasio del plan</p><p className="mt-1 truncate text-base font-bold">{formatDayAndDate(nextPlan.date)} · {nextPlan.title}</p></div></div>
          <Link href={`/strength/session/new?plan=${nextPlan.id}`} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold text-ink">Registrar sesión <ArrowUpRight size={15} /></Link>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.7fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Tus rutinas</p><h2 className="mt-2 text-xl font-bold">Listas para entrenar</h2></div><Link href="/strength/routines/new" className="flex min-h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-[11px] font-bold text-accent shadow-sm"><Plus size={15} /> Nueva</Link></div>
          {routines.length ? <div className="grid gap-3 sm:grid-cols-2">{routines.map((routine) => (
            <article key={routine.id} className="app-card min-w-0 p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-warning-soft text-warning"><Dumbbell size={18} /></span><span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-bold text-muted">{routine.exercises.length} ejercicios</span></div><h3 className="mt-4 truncate text-base font-bold">{routine.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{routine.description ?? routine.exercises.map((entry) => entry.exercise.nameEs).join(" · ")}</p><Link href={`/strength/session/new?routine=${routine.id}`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-xs font-bold text-white">Iniciar rutina <ArrowUpRight size={15} /></Link></article>
          ))}</div> : <div className="app-card px-6 py-10 text-center"><Dumbbell size={26} className="mx-auto text-muted/35" /><p className="mt-3 text-sm font-bold">Aún no tienes rutinas</p><p className="mt-1 text-xs text-muted">Crea una desde cero o usa una plantilla para corredores.</p></div>}
        </section>

        <aside className="min-w-0">
          <p className="eyebrow">Plantillas del plan</p><h2 className="mt-2 text-xl font-bold">Empieza rápido</h2>
          <div className="mt-3 space-y-2">{strengthPresets.map((preset) => <Link key={preset.id} href={`/strength/routines/new?preset=${preset.id}`} className="group flex min-w-0 items-center gap-3 rounded-[20px] border border-line bg-white p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Sparkles size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{preset.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{preset.exerciseNames.length} ejercicios para corredor</span></span><ArrowUpRight size={15} className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}</div>
        </aside>
      </div>

      <section className="mt-7"><div className="mb-3"><p className="eyebrow">Actividad reciente</p><h2 className="mt-2 text-xl font-bold">Última sesión</h2></div>{history[0] ? <StrengthSessionCard session={history[0]} displayUnit={unit} /> : <div className="rounded-[22px] border border-dashed border-line bg-white/45 p-6 text-center text-xs text-muted">Tu primera sesión aparecerá aquí.</div>}</section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="app-card min-w-0 p-3.5 sm:p-5"><p className="truncate text-lg font-bold tracking-[-0.035em] sm:text-2xl">{value}</p><p className="mt-1 truncate text-[9px] font-bold tracking-wide text-muted uppercase sm:text-[10px]">{label}</p></div>;
}

