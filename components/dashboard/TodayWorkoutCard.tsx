import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CircleDotDashed,
  Clock3,
  Droplets,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  ListChecks,
  RefreshCcw,
  Route,
  Snowflake,
} from "lucide-react";
import { formatDuration } from "@/lib/format";
import { EffortTypeBadge } from "@/components/training/EffortTypeBadge";
import {
  hasRunningComponent,
  hasStrengthComponent,
  isPlanItemFullyCompleted,
} from "@/lib/training/planComponents";
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
  strengthCompleted: boolean;
}

export function TodayWorkoutCard({ workout, log, strengthCompleted }: TodayWorkoutCardProps) {
  const hasRun = hasRunningComponent(workout);
  const hasStrength = hasStrengthComponent(workout);
  const strengthOnly = hasStrength && !hasRun;
  const runCompleted = Boolean(log?.planItemId === workout.id);
  const completed = isPlanItemFullyCompleted(workout, runCompleted, strengthCompleted);
  const displayStatus: WorkoutStatus = completed
    ? "completed"
    : workout.status === "completed"
      ? "pending"
      : workout.status;
  const strengthDuration = workout.gym?.match(/\d+\s*[–-]\s*\d+\s*min/i)?.[0] ?? null;
  const PrimaryIcon = strengthOnly ? Dumbbell : Route;
  const detailCount = [
    workout.warmup,
    workout.mainSet,
    workout.cooldown,
    workout.gym,
    workout.nutrition,
    workout.recovery,
  ].filter(Boolean).length;

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
            {statusLabel[displayStatus]}
          </span>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_8px_22px_rgba(36,120,238,0.25)]">
            <PrimaryIcon size={23} />
          </div>
          <h2 className="text-[1.55rem] font-bold tracking-[-0.035em] sm:text-[1.75rem]">
            {workout.title}
          </h2>
          {workout.effortType && <div className="mt-3"><EffortTypeBadge effortType={workout.effortType} /></div>}
          {strengthOnly ? (
            <p className="mt-2 text-[2.6rem] leading-none font-bold tracking-[-0.055em] sm:text-[3.25rem]">
              Fuerza
              <span className="ml-2 text-base font-semibold tracking-[-0.02em] text-muted sm:text-lg">programada</span>
            </p>
          ) : (
            <p className="mt-1 text-[3.25rem] leading-none font-bold tracking-[-0.065em] sm:text-[4rem]">
              {runCompleted && log ? log.distanceKm : workout.distanceKm}
              <span className="ml-2 text-xl font-semibold tracking-[-0.02em] text-muted">km</span>
            </p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric
            icon={strengthOnly ? <Dumbbell size={16} /> : <Gauge size={16} />}
            label={strengthOnly ? "Modalidad" : runCompleted ? "Pace real" : "Pace objetivo"}
            value={strengthOnly ? "Gimnasio" : runCompleted && log ? log.averagePace.replace(" ", "") : workout.targetPace ?? "—"}
          />
          <Metric
            icon={<HeartPulse size={16} />}
            label="RPE"
            value={runCompleted && log ? `${log.rpe} / 10` : workout.targetRpe ?? "—"}
          />
          <Metric
            icon={<Clock3 size={16} />}
            label={runCompleted ? "Tiempo" : "Duración"}
            value={runCompleted && log
              ? formatDuration(log.durationSeconds)
              : workout.estimatedDurationMin
                ? `≈ ${workout.estimatedDurationMin} min`
                : strengthDuration ?? "—"}
          />
        </div>

        {detailCount > 0 && (
          <section className="mt-7 rounded-[24px] border border-line/80 bg-white/76 p-4 shadow-sm backdrop-blur-sm sm:p-5">
            <header className="flex items-center justify-between gap-3 border-b border-line/75 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <ListChecks size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Detalles de la sesión</p>
                  <p className="mt-0.5 text-[11px] text-muted">Indicaciones completas de tu plan</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-bold text-muted">
                {detailCount} {detailCount === 1 ? "detalle" : "detalles"}
              </span>
            </header>

            <div className="mt-5 grid min-w-0 gap-x-7 gap-y-5 sm:grid-cols-2">
              {workout.warmup && (
                <SessionDetail icon={<Flame size={15} />} label="Calentamiento" text={workout.warmup} tone="warning" />
              )}
              {workout.mainSet && (
                <SessionDetail icon={<CircleDotDashed size={15} />} label="Trabajo principal" text={workout.mainSet} tone="accent" />
              )}
              {workout.cooldown && (
                <SessionDetail icon={<Snowflake size={15} />} label="Enfriamiento" text={workout.cooldown} tone="accent" />
              )}
              {workout.nutrition && (
                <SessionDetail icon={<Droplets size={15} />} label="Nutrición e hidratación" text={workout.nutrition} tone="success" />
              )}
              {workout.gym && (
                <SessionDetail icon={<Dumbbell size={15} />} label="Gimnasio" text={workout.gym} tone="warning" wide />
              )}
              {workout.recovery && (
                <SessionDetail icon={<RefreshCcw size={15} />} label="Recuperación" text={workout.recovery} tone="success" wide={Boolean(workout.gym)} />
              )}
            </div>
          </section>
        )}

        <div className="mt-auto pt-7">
          {completed && (
            <div className="mb-4 flex items-center justify-between border-t border-line/80 pt-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-success">
                <span className="grid size-5 place-items-center rounded-full bg-success text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                Sesión completada
              </span>
              {runCompleted && log && <span className="text-xs font-medium text-muted">Dolor {log.pain}/10</span>}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {hasRun && (runCompleted ? (
              <TodayLink href="/workouts" variant="completed" icon={<Check size={16} />}>Ver carrera</TodayLink>
            ) : workout.status !== "skipped" ? (
              <TodayLink href={`/workouts/new?plan=${workout.id}&date=${workout.date}`} variant="run" icon={<Route size={17} />}>Registrar carrera</TodayLink>
            ) : null)}
            {hasStrength && (strengthCompleted ? (
              <TodayLink href="/strength/history" variant="completed" icon={<Check size={16} />}>Ver fuerza</TodayLink>
            ) : workout.status !== "skipped" ? (
              <TodayLink href={`/strength/session/new?plan=${workout.id}`} variant="strength" icon={<Dumbbell size={17} />}>Registrar fuerza</TodayLink>
            ) : null)}
            {!hasRun && !hasStrength && workout.status !== "skipped" && (
              <TodayLink href={`/workouts/new?date=${workout.date}`} variant="strength" icon={<Route size={17} />}>Registrar actividad libre</TodayLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionDetail({
  icon,
  label,
  text,
  tone,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  tone: "accent" | "warning" | "success";
  wide?: boolean;
}) {
  const tones = {
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  };

  return (
    <div className={`flex min-w-0 items-start gap-3 ${wide ? "sm:col-span-2" : ""}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">{label}</p>
        <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-5 font-medium text-ink/88">{text}</p>
      </div>
    </div>
  );
}

function TodayLink({
  href,
  variant,
  icon,
  children,
}: {
  href: string;
  variant: "run" | "strength" | "completed";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = variant === "run"
    ? "bg-accent text-white shadow-[0_8px_20px_rgba(36,120,238,.2)]"
    : variant === "strength"
      ? "bg-ink text-white"
      : "border border-success/20 bg-success-soft text-success";

  return (
    <Link href={href} className={`pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold sm:w-fit sm:min-w-48 ${styles}`}>
      {icon} {children}
      {variant !== "completed" && <ArrowUpRight size={16} />}
    </Link>
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
