import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoutineBuilder } from "@/components/strength/RoutineBuilder";
import { PageHeader } from "@/components/ui/PageHeader";
import { getExerciseLibrary } from "@/lib/data/strength";
import { getStrengthPreset } from "@/lib/strength/presets";

export const metadata: Metadata = { title: "Nueva rutina" };

export default async function NewStrengthRoutinePage({ searchParams }: { searchParams: Promise<{ preset?: string }> }) {
  const { preset: presetId } = await searchParams;
  const [exercises, preset] = await Promise.all([getExerciseLibrary(), Promise.resolve(getStrengthPreset(presetId))]);
  const initialExerciseIds = preset?.exerciseNames.flatMap((name) => {
    const exercise = exercises.find((item) => item.nameEs === name);
    return exercise ? [exercise.id] : [];
  }) ?? [];

  return (
    <>
      <PageHeader eyebrow="Constructor" title="Nueva rutina" description="Selecciona, ordena y anota los ejercicios que quieres repetir." action={<Link href="/strength" className="grid size-11 place-items-center rounded-2xl bg-white text-muted shadow-sm" aria-label="Volver a Fuerza"><ArrowLeft size={19} /></Link>} />
      <RoutineBuilder exercises={exercises} defaultName={preset?.name} defaultDescription={preset?.description} initialExerciseIds={initialExerciseIds} />
    </>
  );
}

