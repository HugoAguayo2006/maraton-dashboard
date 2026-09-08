import { Dumbbell, Timer } from "lucide-react";
import type { TrainingPlanItem } from "@/types/training";

export function TomorrowWorkoutCard({ workout }: { workout: TrainingPlanItem }) {
  const duration = workout.estimatedDurationMin;
  return (
    <section className="area-tomorrow card-enter app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Mañana</span>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.035em]">{workout.title}</h2>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-subtle text-muted">
          <Dumbbell size={20} />
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
        <span className="flex items-center gap-1.5"><Timer size={15} /> {duration ? `${Math.max(1, duration - 5)}–${duration + 5} min` : "Duración pendiente"}</span>
        <span className="size-1 rounded-full bg-line" />
        <span>Sin carrera</span>
        <span className="size-1 rounded-full bg-line" />
        <span>RPE {workout.targetRpe ?? "—"}</span>
      </div>
    </section>
  );
}
