import { CheckCircle2 } from "lucide-react";
import type { WeeklySummary } from "@/types/training";

export function WeeklyProgressCard({ summary }: { summary: WeeklySummary }) {
  const percentage = Math.round((summary.completedKm / summary.plannedKm) * 100);
  const remaining = summary.totalWorkouts - summary.completedWorkouts;

  return (
    <section className="area-weekly card-enter app-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Semana {summary.weekNumber}</span>
        <span className="text-sm font-bold text-accent">{percentage}%</span>
      </div>
      <div className="mt-6 flex items-end gap-2">
        <p className="text-[2.15rem] leading-none font-bold tracking-[-0.055em]">
          {summary.completedKm}
        </p>
        <p className="pb-0.5 text-sm font-semibold text-muted">/ {summary.plannedKm} km</p>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-label="Progreso semanal"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-muted">
        <CheckCircle2 size={15} className="text-success" />
        {remaining} entrenamientos restantes
      </p>
    </section>
  );
}
