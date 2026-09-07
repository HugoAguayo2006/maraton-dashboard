import type { Metadata } from "next";
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
import { dashboardData } from "@/data/mockDashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader athlete={dashboardData.athlete} date={dashboardData.referenceDate} />
      <div className="dashboard-grid">
        <TodayWorkoutCard workout={dashboardData.today} log={dashboardData.todayLog} />
        <WeeklyProgressCard summary={dashboardData.weeklySummary} />
        <TomorrowWorkoutCard workout={dashboardData.tomorrow} />
        <LongRunCard workout={dashboardData.nextLongRun} daysUntil={dashboardData.daysToLongRun} />
        <MarathonCountdown raceName={dashboardData.athlete.raceName} raceDate={dashboardData.athlete.raceDate} days={dashboardData.daysToRace} progress={dashboardData.raceProgress} />
        <RecoveryCard recovery={dashboardData.recovery} />
        <WeeklyMileageChart data={dashboardData.mileageHistory} />
        <RecentWorkouts workouts={dashboardData.recentWorkouts} />
        <QuickActions />
      </div>
    </>
  );
}
