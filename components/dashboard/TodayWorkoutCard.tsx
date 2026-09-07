import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Gauge,
  HeartPulse,
  Route,
} from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { TrainingPlanItem, WorkoutLog, WorkoutStatus } from "@/types/training";

const statusLabel: Record<WorkoutStatus, string> = {
  pending: "Pendiente",
  completed: "Completado",
  modified: "Modificado",
  skipped: "Omitido",
};

interface TodayWorkoutCardProps {
  workout: TrainingPlanItem;
  log?: WorkoutLog;
}

export function TodayWorkoutCard({ workout, log }: TodayWorkoutCardProps) {
  const completed = workout.status === "completed" && log;

  return (
    <section className="area-today card-enter app-card relative min-h-[390px] overflow-hidden bg-[linear-gradient(145deg,#ffffff_34%,#f3f8ff_100%)] p-5 sm:p-7 lg:min-h-[430px]">
      <div aria-hidden className="absolute -top-24 -right-28 size-64 rounded-full border-[42px] border-accent/5" />
      <div aria-hidden className="absolute top-10 -right-24 size-48 rounded-full border border-accent/10" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">Hoy</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            completed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
          }`}>
            {completed && <Check size={13} strokeWidth={3} />}
            {statusLabel[workout.status]}
          </span>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_8px_22px_rgba(36,120,238,0.25)]">
            <Route size={23} />
          </div>
          <h2 className="text-[1.55rem] font-bold tracking-[-0.035em] sm:text-[1.75rem]">
            {workout.title}
          </h2>
          <p className="mt-1 text-[3.25rem] leading-none font-bold tracking-[-0.065em] sm:text-[4rem]">
            {completed ? log.distanceKm : workout.distanceKm}
            <span className="ml-2 text-xl font-semibold tracking-[-0.02em] text-muted">km</span>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric
            icon={<Gauge size={16} />}
            label={completed ? "Pace real" : "Pace objetivo"}
            value={completed ? log.averagePace.replace(" ", "") : workout.targetPace ?? "—"}
          />
          <Metric
            icon={<HeartPulse size={16} />}
            label="RPE"
            value={completed ? `${log.rpe} / 10` : workout.targetRpe}
          />
          <Metric
            icon={<Clock3 size={16} />}
            label={completed ? "Tiempo" : "Duración"}
            value={completed ? formatDuration(log.durationSeconds) : `≈ ${workout.estimatedDurationMin} min`}
          />
        </div>

        <div className="mt-auto pt-7">
          {completed && (
            <div className="mb-4 flex items-center justify-between border-t border-line/80 pt-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-success">
                <span className="grid size-5 place-items-center rounded-full bg-success text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                Entrenamiento completado
              </span>
              <span className="text-xs font-medium text-muted">Dolor {log.pain}/10</span>
            </div>
          )}
          <Link
            href={completed ? "/workouts" : "/workouts/new"}
            className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white sm:w-fit sm:min-w-52"
          >
            {completed ? "Ver entrenamiento" : "Registrar entrenamiento"}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/70 bg-white/72 p-3 shadow-sm backdrop-blur-sm sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[10px] font-bold tracking-[0.05em] uppercase">{label}</span>
      </div>
      <p className="truncate text-sm font-bold tracking-[-0.02em] sm:text-base">{value}</p>
    </div>
  );
}
