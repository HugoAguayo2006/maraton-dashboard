import Link from "next/link";
import { ArrowUpRight, CalendarClock, Dumbbell } from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import type { StrengthSession, TrainingPlanItem } from "@/types/training";

export function StrengthDashboardCard({ latest, nextPlan }: { latest: StrengthSession | null; nextPlan: TrainingPlanItem | null }) {
  return (
    <section className="area-strength card-enter app-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Fuerza</p><p className="mt-2 text-sm font-bold">Tu gimnasio, sin ruido</p></div><span className="grid size-10 place-items-center rounded-2xl bg-warning-soft text-warning"><Dumbbell size={19} /></span></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <StrengthRow icon={Dumbbell} label="Última sesión" value={latest ? `${latest.routineName ?? "Sesión libre"} · ${latest.durationMinutes ? `${latest.durationMinutes} min` : `${latest.setCount} series`}` : "Aún sin registros"} />
        <StrengthRow icon={CalendarClock} label="Próximo gimnasio" value={nextPlan ? `${formatDayAndDate(nextPlan.date)} · ${nextPlan.title}` : "Sin sesión próxima"} />
      </div>
      <Link href={nextPlan ? `/strength/session/new?plan=${nextPlan.id}` : "/strength"} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-xs font-bold text-white">{nextPlan ? "Registrar sesión" : "Abrir Fuerza"}<ArrowUpRight size={15} /></Link>
    </section>
  );
}

function StrengthRow({ icon: Icon, label, value }: { icon: typeof Dumbbell; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-surface-subtle p-3"><Icon size={16} className="shrink-0 text-muted" /><span className="min-w-0"><span className="block text-[9px] font-bold tracking-wide text-muted uppercase">{label}</span><span className="mt-0.5 block truncate text-xs font-semibold">{value}</span></span></div>;
}

