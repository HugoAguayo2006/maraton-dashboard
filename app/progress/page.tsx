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
import { getProgressData } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Progreso" };

const toneClasses = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export default async function ProgressPage() {
  const { summary, mileageHistory } = await getProgressData();
  const stats = [
    { label: "Esta semana", value: `${summary.weeklyKilometers} km`, detail: "kilómetros reales", icon: Footprints, tone: "accent" },
    { label: "Kilómetros acumulados", value: `${summary.totalKilometers} km`, detail: "todos los registros", icon: TrendingUp, tone: "success" },
    { label: "Tirada más larga", value: summary.longestRunKm === null ? "—" : `${summary.longestRunKm} km`, detail: summary.longestRunKm === null ? "sin datos" : "mejor distancia", icon: Route, tone: "accent" },
    { label: "RPE promedio", value: summary.averageRpe?.toString() ?? "—", detail: summary.averageRpe === null ? "sin datos" : "esfuerzo percibido", icon: CircleGauge, tone: "warning" },
    { label: "Dolor promedio", value: summary.averagePain === null ? "—" : `${summary.averagePain}/10`, detail: summary.averagePain === null ? "sin datos" : "registros reales", icon: Activity, tone: "warning" },
    { label: "Cumplimiento", value: summary.planCompliance === null ? "—" : `${summary.planCompliance}%`, detail: summary.planCompliance === null ? "sin sesiones vencidas" : "del plan hasta hoy", icon: Award, tone: "success" },
    { label: "Pace promedio", value: summary.averagePace ?? "—", detail: summary.averagePace === null ? "sin datos" : "pace global", icon: Activity, tone: "accent" },
  ] as const;

  return (
    <>
      <PageHeader eyebrow="Tu evolución" title="Progreso" description="Tendencias calculadas exclusivamente a partir de tu plan y tus registros reales." />
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
      <ProgressCharts data={mileageHistory} />
    </>
  );
}
