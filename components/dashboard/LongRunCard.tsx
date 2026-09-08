import { MapPinned, Route } from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import type { TrainingPlanItem } from "@/types/training";

export function LongRunCard({ workout, daysUntil }: { workout: TrainingPlanItem; daysUntil: number | null }) {
  const day = formatDayAndDate(workout.date).split(",")[0];

  return (
    <section className="area-longrun card-enter app-card pressable p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Próxima tirada larga</span>
        <MapPinned size={18} className="text-accent" />
      </div>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold capitalize text-muted">{day}</p>
          <p className="mt-1 text-[2.5rem] leading-none font-bold tracking-[-0.055em]">
            {workout.distanceKm}<span className="ml-1.5 text-base font-semibold text-muted">km</span>
          </p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Route size={22} />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-4 text-xs font-semibold">
        <span className="text-muted">{workout.targetPace ?? "Ritmo libre"} · RPE {workout.targetRpe ?? "—"}</span>
        <span className="text-accent">{daysUntil === null ? "Fecha pendiente" : daysUntil === 0 ? "Hoy" : `Faltan ${daysUntil} días`}</span>
      </div>
    </section>
  );
}
