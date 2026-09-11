import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";
import { getAssignablePlanItems } from "@/lib/data/trainingPlan";
import { getTodayIso } from "@/lib/date";

export const metadata: Metadata = { title: "Registro manual" };

export default async function ManualWorkoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; date?: string }> }) {
  const query = await searchParams;
  const today = getTodayIso();
  const requestedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : today;
  const planItems = await getAssignablePlanItems(requestedDate);
  const requestedPlanItem = planItems.find((item) => item.id === query.plan);
  const defaultDate = requestedPlanItem?.date ?? requestedDate;
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/workouts/new" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted hover:text-ink"><ChevronLeft size={17} /> Elegir registro</Link>
      <header className="mb-7"><p className="eyebrow mb-3">Registro manual</p><h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">¿Cómo te fue?</h1><p className="mt-2 text-sm leading-6 text-muted sm:text-base">Guarda lo que realmente hiciste. El pace se calcula automáticamente.</p></header>
      <WorkoutForm planItems={planItems} defaultDate={defaultDate} initialPlanItemId={requestedPlanItem?.id} />
    </div>
  );
}

