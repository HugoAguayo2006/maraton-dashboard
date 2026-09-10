import { Dumbbell, Footprints, Gauge, Timer } from "lucide-react";
import { EffortTypeBadge } from "@/components/training/EffortTypeBadge";
import type { TrainingPlanItem } from "@/types/training";

export function TomorrowWorkoutCard({ workout }: { workout: TrainingPlanItem }) {
  const duration = workout.estimatedDurationMin;
  const hasDistance = Boolean(workout.distanceKm && workout.distanceKm > 0);
  const strengthDuration = workout.gym?.match(/\d+\s*[–-]\s*\d+\s*min/i)?.[0];
  const Icon = hasDistance ? Footprints : Dumbbell;
  return (
    <section className="area-tomorrow card-enter app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Mañana</span>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.035em]">{workout.title}</h2>
          {workout.effortType && <div className="mt-2"><EffortTypeBadge effortType={workout.effortType} /></div>}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-subtle text-muted">
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
        <span className="flex items-center gap-1.5"><Timer size={15} /> {duration ? `≈ ${duration} min` : strengthDuration ?? "Consulta el detalle"}</span>
        <span className="size-1 rounded-full bg-line" />
        <span className="flex items-center gap-1.5">{hasDistance ? <Footprints size={15} /> : <Dumbbell size={15} />}{hasDistance ? `${workout.distanceKm} km` : "Sin carrera"}</span>
        <span className="size-1 rounded-full bg-line" />
        <span className="flex items-center gap-1.5"><Gauge size={15} /> {workout.targetRpe ?? "RPE —"}</span>
      </div>
    </section>
  );
}
