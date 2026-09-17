import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, CalendarX2, Sparkles } from "lucide-react";
import { PlanDayCard } from "@/components/plan/PlanDayCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getAllTrainingPlanItems,
  getCurrentWeekPlan,
} from "@/lib/data/trainingPlan";
import { getRecordedStrengthPlanItemIds } from "@/lib/data/strength";
import {
  getRecordedWorkoutPlanItemIds,
  getWorkoutLogsBetween,
} from "@/lib/data/workouts";
import { getTodayIso, getWeekRange } from "@/lib/date";
import { formatDistance } from "@/lib/format";
import { isEligiblePlanSession } from "@/lib/training/compliance";
import { isBoltConfigured } from "@/lib/ai/config";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage() {
  const boltEnabled = isBoltConfigured();
  const today = getTodayIso();
  const { start, end } = getWeekRange(today);
  const [
    trainingPlan,
    currentWeekPlan,
    weeklyWorkouts,
    recordedRunIds,
    recordedStrengthIds,
  ] = await Promise.all([
    getAllTrainingPlanItems(),
    getCurrentWeekPlan(today),
    getWorkoutLogsBetween(start, end),
    getRecordedWorkoutPlanItemIds(),
    getRecordedStrengthPlanItemIds(),
  ]);
  const runIds = new Set(recordedRunIds);
  const strengthIds = new Set(recordedStrengthIds);
  const plannedKm = currentWeekPlan.reduce(
    (total, item) => total + (item.distanceKm ?? 0),
    0,
  );
  const completedKm = weeklyWorkouts.reduce(
    (total, workout) => total + workout.distanceKm,
    0,
  );
  const weeklySessions = currentWeekPlan.filter(isEligiblePlanSession);
  const completion = plannedKm > 0
    ? Math.min(100, Math.round((completedKm / plannedKm) * 100))
    : 0;
  const weeks = Array.from(
    new Set(trainingPlan.map((item) => item.weekNumber)),
  ).sort((a, b) => a - b);

  return (
    <>
      <PageHeader
        eyebrow={weeks.length ? `${weeks.length} semanas cargadas` : "Plan de entrenamiento"}
        title="Tu plan"
        description="Consulta cada sesión prescrita y abre sus indicaciones cuando las necesites."
        action={<div className="hidden items-center gap-2 sm:flex">
          <Link href="/guide" className="flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold text-accent shadow-sm transition-colors hover:bg-accent-soft"><BookOpenText size={18} /> Interpretar ritmos</Link>
          {boltEnabled && <Link href="/plan/generate" className="flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-4 text-xs font-bold text-white"><Sparkles size={17} /> {trainingPlan.length ? "Regenerar con Bolt AI" : "Crear con Bolt AI"}</Link>}
        </div>}
      />

      {boltEnabled && trainingPlan.length > 0 && <Link href="/plan/generate" className="mb-5 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-xs font-bold text-white sm:hidden"><Sparkles size={16} /> Regenerar con Bolt AI</Link>}

      {trainingPlan.length > 0 && (
        <section className="mb-5 rounded-[24px] bg-ink p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-white/50 uppercase">Objetivo semanal</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.035em]">
              {formatDistance(plannedKm)} km · {weeklySessions.length} sesiones
            </p>
          </div>
          <div className="mt-4 w-full sm:mt-0 sm:w-56">
            <div className="mb-2 flex justify-between text-[11px] font-semibold text-white/55">
              <span>{formatDistance(completedKm)} km completados</span>
              <span>{completion}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </section>
      )}

      {trainingPlan.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Tu plan aún está vacío"
          description={boltEnabled ? "Cuéntale a Bolt AI tu disponibilidad y revisa una propuesta completa antes de guardarla." : "Carga un plan para comenzar tu preparación."}
          actionLabel={boltEnabled ? "Crear plan con Bolt AI" : undefined}
          actionHref={boltEnabled ? "/plan/generate" : undefined}
        />
      ) : (
        <div className="space-y-7">
          {weeks.map((week) => (
            <section key={week}>
              <div className="mb-3 flex items-center gap-3">
                <span className="eyebrow">Semana {week}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-3">
                {trainingPlan
                  .filter((item) => item.weekNumber === week)
                  .map((item) => (
                    <PlanDayCard
                      key={item.id}
                      item={item}
                      runCompleted={runIds.has(item.id)}
                      strengthCompleted={strengthIds.has(item.id)}
                      boltEnabled={boltEnabled}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
