import type { Metadata } from "next";
import {
  Activity,
  Award,
  CircleGauge,
  Footprints,
  Route,
  TrendingUp,
} from "lucide-react";
import { ProgressCharts } from "@/components/progress/ProgressCharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { dashboardData, progressSummary } from "@/data/mockDashboard";

export const metadata: Metadata = { title: "Progreso" };

const stats = [
  { label: "Esta semana", value: `${progressSummary.weeklyKilometers} km`, detail: `de ${dashboardData.weeklySummary.plannedKm} km`, icon: Footprints, tone: "accent" },
  { label: "Kilómetros acumulados", value: `${progressSummary.totalKilometers} km`, detail: "bloque actual", icon: TrendingUp, tone: "success" },
  { label: "Tirada más larga", value: `${progressSummary.longestRunKm} km`, detail: "mejor distancia", icon: Route, tone: "accent" },
  { label: "RPE promedio", value: progressSummary.averageRpe.toString(), detail: "esfuerzo controlado", icon: CircleGauge, tone: "warning" },
  { label: "Cumplimiento", value: `${progressSummary.planCompliance}%`, detail: "del plan", icon: Award, tone: "success" },
  { label: "Pace promedio", value: progressSummary.averagePace, detail: "todos los rodajes", icon: Activity, tone: "accent" },
] as const;

const toneClasses = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export default function ProgressPage() {
  return (
    <>
      <PageHeader eyebrow="Tu evolución" title="Progreso" description="Tendencias claras para saber si el trabajo se está acumulando de forma sostenible." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="app-card p-4 sm:p-5">
              <span className={`grid size-9 place-items-center rounded-2xl ${toneClasses[stat.tone]}`}><Icon size={17} /></span>
              <p className="mt-5 text-xl leading-none font-bold tracking-[-0.045em] sm:text-2xl">{stat.value}</p>
              <p className="mt-2 text-[11px] font-bold text-muted">{stat.label}</p>
              <p className="mt-0.5 text-[10px] text-muted/75">{stat.detail}</p>
            </article>
          );
        })}
      </div>
      <ProgressCharts data={dashboardData.mileageHistory} />
    </>
  );
}
