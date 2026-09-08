import type { Metadata } from "next";
import { CalendarX2, Flag, Route } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LongRunCard } from "@/components/dashboard/LongRunCard";
import { MarathonCountdown } from "@/components/dashboard/MarathonCountdown";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { RecoveryCard } from "@/components/dashboard/RecoveryCard";
import { TodayWorkoutCard } from "@/components/dashboard/TodayWorkoutCard";
import { TomorrowWorkoutCard } from "@/components/dashboard/TomorrowWorkoutCard";
import { WeeklyMileageChart } from "@/components/dashboard/WeeklyMileageChart";
import { WeeklyProgressCard } from "@/components/dashboard/WeeklyProgressCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  return (
    <>
      <DashboardHeader athlete={dashboardData.athlete} date={dashboardData.referenceDate} />
      <div className="dashboard-grid">
        {dashboardData.today ? (
          <TodayWorkoutCard workout={dashboardData.today} log={dashboardData.todayLog} />
        ) : (
          <EmptyState icon={CalendarX2} title="Hoy no hay sesión programada" description="Disfruta la recuperación o registra una actividad libre." actionLabel="Registrar actividad" actionHref="/workouts/new" className="area-today min-h-[390px]" />
        )}
        <WeeklyProgressCard summary={dashboardData.weeklySummary} />
        {dashboardData.tomorrow ? (
          <TomorrowWorkoutCard workout={dashboardData.tomorrow} />
        ) : (
          <EmptyState icon={CalendarX2} title="Mañana está libre" description="No hay una sesión programada." className="area-tomorrow min-h-40" />
        )}
        {dashboardData.nextLongRun ? (
          <LongRunCard workout={dashboardData.nextLongRun} daysUntil={dashboardData.daysToLongRun} />
        ) : (
          <EmptyState icon={Route} title="Sin tirada larga próxima" description="Aparecerá cuando cargues el plan." className="area-longrun min-h-48" />
        )}
        {dashboardData.athlete && dashboardData.daysToRace !== null ? (
          <MarathonCountdown raceName={dashboardData.athlete.raceName} raceDate={dashboardData.athlete.raceDate} days={dashboardData.daysToRace} progress={dashboardData.raceProgress ?? 0} />
        ) : (
          <EmptyState icon={Flag} title="Configura tu carrera" description="Carga el perfil para activar el countdown." className="area-countdown min-h-48" />
        )}
        <RecoveryCard recovery={dashboardData.recovery} />
        <WeeklyMileageChart data={dashboardData.mileageHistory} />
        <RecentWorkouts workouts={dashboardData.recentWorkouts} />
        <QuickActions />
      </div>
    </>
  );
}
