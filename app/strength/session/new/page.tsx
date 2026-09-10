import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkoutTracker } from "@/components/strength/WorkoutTracker";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAthleteProfile } from "@/lib/data/athlete";
import { getExerciseLibrary, getStrengthPlanItem, getStrengthRoutines } from "@/lib/data/strength";
import { getTodayIso } from "@/lib/date";

export const metadata: Metadata = { title: "Registrar fuerza" };

export default async function NewStrengthSessionPage({ searchParams }: { searchParams: Promise<{ routine?: string; plan?: string }> }) {
  const query = await searchParams;
  const [exercises, routines, planItem, profile] = await Promise.all([
    getExerciseLibrary(),
    getStrengthRoutines(),
    getStrengthPlanItem(query.plan ?? null),
    getAthleteProfile(),
  ]);
  const requestedRoutine = routines.find((routine) => routine.id === query.routine) ?? null;
  const initialRoutine = requestedRoutine ?? findPlanRoutine(routines, planItem?.title, planItem?.gym);

  return (
    <>
      <PageHeader eyebrow="Registro en vivo" title="Sesión de fuerza" description="Completa cada serie al terminarla; solo se guardarán las series marcadas." action={<Link href="/strength" className="grid size-11 place-items-center rounded-2xl bg-white text-muted shadow-sm" aria-label="Volver a Fuerza"><ArrowLeft size={19} /></Link>} />
      <WorkoutTracker exercises={exercises} routines={routines} initialRoutine={initialRoutine} planItem={planItem} defaultDate={getTodayIso()} defaultUnit={profile?.strengthUnit ?? "kg"} />
    </>
  );
}

function findPlanRoutine(routines: Awaited<ReturnType<typeof getStrengthRoutines>>, title?: string, details?: string) {
  const text = `${title ?? ""} ${details ?? ""}`.toLowerCase();
  const token = /(?:gym|rutina|fuerza)\s*(a|b|light|ligera)/i.exec(text)?.[1]?.toLowerCase();
  if (!token) return null;
  return routines.find((routine) => {
    const name = routine.name.toLowerCase();
    return token === "a" ? /(?:^|\s)a$/.test(name) : token === "b" ? /(?:^|\s)b$/.test(name) : name.includes("liger");
  }) ?? null;
}

