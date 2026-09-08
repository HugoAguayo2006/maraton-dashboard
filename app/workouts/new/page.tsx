import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";
import { getAssignablePlanItems } from "@/lib/data/trainingPlan";
import { getTodayIso } from "@/lib/date";

export const metadata: Metadata = { title: "Registrar entrenamiento" };

export default async function NewWorkoutPage() {
  const today = getTodayIso();
  const planItems = await getAssignablePlanItems(today);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted transition-colors hover:text-ink">
        <ChevronLeft size={17} /> Volver
      </Link>
      <header className="mb-7">
        <p className="eyebrow mb-3">Registro</p>
        <h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">¿Cómo te fue?</h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Guarda lo que realmente hiciste. El pace se calcula automáticamente.</p>
      </header>
      <WorkoutForm planItems={planItems} defaultDate={today} />
    </div>
  );
}
