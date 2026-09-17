import Link from "next/link";
import { ArrowRight, Check, Footprints } from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import type { WorkoutLog } from "@/types/training";

export function RecentWorkouts({ workouts }: { workouts: WorkoutLog[] }) {
  return (
    <section className="area-recent card-enter app-card p-5 sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <span className="eyebrow">Entrenamientos recientes</span>
          <p className="mt-2 text-xs font-medium text-muted">Tus últimas sesiones registradas</p>
        </div>
        <Link href="/workouts" className="flex shrink-0 items-center gap-1 text-xs font-bold text-accent">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>
      {workouts.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-surface-subtle px-4 py-8 text-center">
          <p className="text-sm font-bold">Aún no hay entrenamientos</p>
          <p className="mt-1 text-xs text-muted">Tu primera sesión aparecerá aquí al registrarla.</p>
        </div>
      ) : <div className="mt-5 divide-y divide-line/80">
        {workouts.map((workout) => (
          <Link href={`/workouts/${workout.id}`} key={workout.id} className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 py-3.5 first:pt-0 last:pb-0 sm:flex">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface-subtle text-muted">
              <Footprints size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-5 font-bold group-hover:text-accent sm:line-clamp-1">{workout.routeName ?? workout.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted first-letter:uppercase">
                <span>{formatDayAndDate(workout.date)}</span>
                {workout.source === "strava" && <span className="rounded-full bg-[#fff0ea] px-1.5 py-0.5 text-[9px] font-bold text-[#fc4c02]">Strava</span>}
              </p>
            </div>
            <div className="col-start-2 mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 text-left sm:mt-0 sm:block sm:shrink-0 sm:text-right">
              <p className="text-sm font-bold">{workout.distanceKm} km</p>
              <p className="text-[11px] font-medium text-muted sm:mt-0.5">
                {workout.averagePace.replace(" ", "")} · RPE {workout.rpe ?? "—"}
              </p>
            </div>
            <span className="hidden size-5 place-items-center rounded-full bg-success-soft text-success sm:grid">
              <Check size={12} strokeWidth={3} />
            </span>
          </Link>
        ))}
      </div>}
    </section>
  );
}
