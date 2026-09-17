import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleDotDashed,
  Dumbbell,
  Footprints,
  Gauge,
  Timer,
  Zap,
} from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import { EffortTypeBadge } from "@/components/training/EffortTypeBadge";
import {
  hasRunningComponent,
  hasStrengthComponent,
  isPlanItemFullyCompleted,
} from "@/lib/training/planComponents";
import type { TrainingPlanItem } from "@/types/training";
import { BoltPromptButton } from "@/components/bolt/BoltPromptButton";

const statusLabels = {
  pending: "Pendiente",
  completed: "Hecho",
  modified: "Modificado",
  skipped: "Omitido",
};

const statusStyles = {
  pending: "bg-surface-subtle text-muted",
  completed: "bg-success-soft text-success",
  modified: "bg-warning-soft text-warning",
  skipped: "bg-danger-soft text-danger",
};

export function PlanDayCard({
  item,
  runCompleted,
  strengthCompleted,
  boltEnabled,
}: {
  item: TrainingPlanItem;
  runCompleted: boolean;
  strengthCompleted: boolean;
  boltEnabled: boolean;
}) {
  const hasRun = hasRunningComponent(item);
  const hasStrength = hasStrengthComponent(item);
  const completed = isPlanItemFullyCompleted(item, runCompleted, strengthCompleted);
  const displayStatus = completed
    ? "completed"
    : item.status === "completed"
      ? "pending"
      : item.status;
  const Icon = hasStrength && !hasRun ? Dumbbell : Footprints;

  return (
    <details className="group app-card min-w-0 overflow-hidden">
      <summary className="pressable flex min-w-0 cursor-pointer list-none items-center gap-2.5 p-3.5 sm:gap-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl sm:size-11 ${
          completed ? "bg-success-soft text-success" : hasStrength && !hasRun ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent"
        }`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-muted capitalize">{formatDayAndDate(item.date)}</p>
          <h2 className="mt-1 line-clamp-2 text-sm leading-5 font-bold tracking-[-0.02em] sm:text-base">{item.title}</h2>
          <p className="mt-1 break-words text-[10px] leading-4 font-medium text-muted sm:hidden">
            {item.distanceKm ? `${item.distanceKm} km` : "Sin distancia"} · {item.targetPace ?? "Ritmo libre"} · {item.targetRpe ?? "RPE —"}
          </p>
          {item.effortType && <div className="mt-1.5 sm:hidden"><EffortTypeBadge effortType={item.effortType} /></div>}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold">{item.distanceKm ? `${item.distanceKm} km` : item.estimatedDurationMin ? `${item.estimatedDurationMin} min` : "Sin distancia"}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted">{item.targetPace ?? "Ritmo libre"} · {item.targetRpe ?? "RPE —"}</p>
          {item.effortType && <div className="mt-1.5 flex justify-end"><EffortTypeBadge effortType={item.effortType} /></div>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold sm:px-2.5 sm:text-[10px] ${statusStyles[displayStatus]}`}>
          {statusLabels[displayStatus]}
        </span>
        <ChevronDown size={17} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-t border-line/80 bg-surface-subtle/65 p-4 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-wrap gap-2 sm:hidden">
          {item.estimatedDurationMin && <Pill icon={<Timer size={13} />} text={`${item.estimatedDurationMin} min`} />}
          <Pill icon={<Gauge size={13} />} text={item.targetRpe ?? "RPE —"} />
          {item.distanceKm && <Pill icon={<Footprints size={13} />} text={`${item.distanceKm} km`} />}
          {item.effortType && <EffortTypeBadge effortType={item.effortType} />}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {item.warmup && <Detail label="Calentamiento" text={item.warmup} />}
          {item.mainSet && <Detail label="Trabajo principal" text={item.mainSet} />}
          {item.cooldown && <Detail label="Enfriamiento" text={item.cooldown} />}
          {item.gym && <Detail label="Gimnasio" text={item.gym} />}
          {item.nutrition && <Detail label="Nutrición" text={item.nutrition} />}
          {item.recovery && <Detail label="Recuperación" text={item.recovery} />}
        </div>
        {(hasRun || hasStrength) && item.status !== "skipped" && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {hasRun && (runCompleted ? (
              <CompletionPill icon={<Footprints size={16} />} text="Carrera registrada" />
            ) : (
              <Link href={`/workouts/new?plan=${item.id}&date=${item.date}`} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-xs font-bold text-white sm:min-w-52">
                <Footprints size={17} /> Registrar carrera
              </Link>
            ))}
            {hasStrength && (strengthCompleted ? (
              <CompletionPill icon={<Dumbbell size={16} />} text="Fuerza registrada" />
            ) : (
              <Link href={`/strength/session/new?plan=${item.id}`} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-xs font-bold text-white sm:min-w-56">
                <Dumbbell size={17} /> Registrar sesión de fuerza
              </Link>
            ))}
          </div>
        )}
        {boltEnabled && (
          <div className="mt-3 border-t border-line/70 pt-3">
            <BoltPromptButton
              prompt={`Explícame la sesión ${item.title} y dime cómo ejecutarla hoy.`}
              contextType="plan"
              contextRefId={item.id}
              className="flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-accent hover:bg-accent-soft"
            >
              <Zap size={15} fill="currentColor" /> Preguntar a Bolt AI sobre esta sesión
            </BoltPromptButton>
          </div>
        )}
      </div>
    </details>
  );
}

function CompletionPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-success/20 bg-success-soft px-5 text-xs font-bold text-success sm:min-w-48">
      {icon} {text}
    </span>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-muted">{icon}{text}</span>;
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white text-accent shadow-sm">
        {label === "Trabajo principal" ? <CircleDotDashed size={13} /> : <Check size={12} />}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">{label}</p>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-5 font-medium">{text}</p>
      </div>
    </div>
  );
}
