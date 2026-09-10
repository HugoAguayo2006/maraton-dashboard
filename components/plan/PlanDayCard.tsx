import {
  Check,
  ChevronDown,
  CircleDotDashed,
  Dumbbell,
  Footprints,
  Gauge,
  Timer,
} from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import { EffortTypeBadge } from "@/components/training/EffortTypeBadge";
import type { TrainingPlanItem } from "@/types/training";

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

export function PlanDayCard({ item }: { item: TrainingPlanItem }) {
  const isGym = item.sessionType === "gym" || item.sessionType === "strength";
  const completed = item.status === "completed";
  const Icon = isGym ? Dumbbell : Footprints;

  return (
    <details className="group app-card overflow-hidden">
      <summary className="pressable flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
          completed ? "bg-success-soft text-success" : isGym ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent"
        }`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-muted capitalize">{formatDayAndDate(item.date)}</p>
          <h2 className="mt-1 truncate text-base font-bold tracking-[-0.02em]">{item.title}</h2>
          <p className="mt-1 text-[11px] font-medium text-muted sm:hidden">
            {item.distanceKm ? `${item.distanceKm} km` : "Sin distancia"} · {item.targetPace ?? "Ritmo libre"} · {item.targetRpe ?? "RPE —"}
          </p>
          {item.effortType && <div className="mt-1.5 sm:hidden"><EffortTypeBadge effortType={item.effortType} /></div>}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold">{item.distanceKm ? `${item.distanceKm} km` : item.estimatedDurationMin ? `${item.estimatedDurationMin} min` : "Sin distancia"}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted">{item.targetPace ?? "Ritmo libre"} · {item.targetRpe ?? "RPE —"}</p>
          {item.effortType && <div className="mt-1.5 flex justify-end"><EffortTypeBadge effortType={item.effortType} /></div>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[item.status]}`}>
          {statusLabels[item.status]}
        </span>
        <ChevronDown size={17} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-t border-line/80 bg-surface-subtle/65 p-5 sm:px-6 sm:py-6">
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
      </div>
    </details>
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
      <div>
        <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">{label}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-5 font-medium">{text}</p>
      </div>
    </div>
  );
}
