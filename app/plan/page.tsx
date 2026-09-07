import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { PlanDayCard } from "@/components/plan/PlanDayCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { dashboardData, trainingPlan } from "@/data/mockDashboard";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Semana 1 de 9"
        title="Tu plan"
        description="Una semana equilibrada: suma kilómetros sin perder de vista la recuperación."
        action={
          <span className="hidden size-12 place-items-center rounded-2xl bg-white text-accent shadow-sm sm:grid">
            <CalendarRange size={22} />
          </span>
        }
      />

      <section className="mb-5 rounded-[24px] bg-ink p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-white/50 uppercase">Objetivo semanal</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.035em]">{dashboardData.weeklySummary.plannedKm} km · {dashboardData.weeklySummary.totalWorkouts} sesiones</p>
        </div>
        <div className="mt-4 w-full sm:mt-0 sm:w-56">
          <div className="mb-2 flex justify-between text-[11px] font-semibold text-white/55">
            <span>{dashboardData.weeklySummary.completedKm} km completados</span><span>{Math.round((dashboardData.weeklySummary.completedKm / dashboardData.weeklySummary.plannedKm) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(dashboardData.weeklySummary.completedKm / dashboardData.weeklySummary.plannedKm) * 100}%` }} />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {trainingPlan.map((item) => <PlanDayCard key={item.id} item={item} />)}
      </div>
    </>
  );
}
