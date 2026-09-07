import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus, TimerReset } from "lucide-react";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { PageHeader } from "@/components/ui/PageHeader";
import { workoutLogs } from "@/data/mockDashboard";
import { formatDuration } from "@/lib/format";

export const metadata: Metadata = { title: "Entrenamientos" };

export default function WorkoutsPage() {
  const totalKm = workoutLogs.reduce((total, workout) => total + workout.distanceKm, 0);
  const totalSeconds = workoutLogs.reduce((total, workout) => total + workout.durationSeconds, 0);

  return (
    <>
      <PageHeader
        eyebrow="Historial"
        title="Entrenamientos"
        description="Lo que realmente hiciste, separado del plan que estaba programado."
        action={
          <Link href="/workouts/new" className="pressable grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_8px_20px_rgba(36,120,238,.22)]" aria-label="Registrar entrenamiento">
            <Plus size={22} />
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Sesiones" value={workoutLogs.length.toString()} />
        <Stat label="Distancia" value={`${totalKm.toFixed(1)} km`} />
        <div className="col-span-2 sm:col-span-1"><Stat label="Tiempo total" value={formatDuration(totalSeconds)} /></div>
      </div>

      <RecentWorkouts workouts={workoutLogs} />

      <Link href="/workouts/new" className="pressable mt-5 flex min-h-14 items-center justify-center gap-2 rounded-[20px] bg-ink px-5 text-sm font-bold text-white sm:w-fit sm:min-w-64">
        Registrar entrenamiento <ArrowUpRight size={17} />
      </Link>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card p-4 sm:p-5">
      <TimerReset size={17} className="mb-4 text-muted" />
      <p className="text-xl font-bold tracking-[-0.04em] sm:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
