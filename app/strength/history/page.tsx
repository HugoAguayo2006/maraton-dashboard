import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { StrengthSectionNav } from "@/components/strength/StrengthSectionNav";
import { StrengthSessionCard } from "@/components/strength/StrengthSessionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAthleteProfile } from "@/lib/data/athlete";
import { getStrengthHistory } from "@/lib/data/strength";
import { Dumbbell } from "lucide-react";

export const metadata: Metadata = { title: "Historial de fuerza" };

export default async function StrengthHistoryPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, profile, sessions] = await Promise.all([searchParams, getAthleteProfile(), getStrengthHistory(100)]);
  const unit = profile?.strengthUnit ?? "kg";
  return (
    <>
      <PageHeader eyebrow="Sesiones realizadas" title="Historial de fuerza" description="Consulta cargas, repeticiones, notas y volumen de cada entrenamiento." action={<Link href="/strength/session/new" className="pressable grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_8px_20px_rgba(36,120,238,.22)]" aria-label="Registrar fuerza"><Plus size={21} /></Link>} />
      <StrengthSectionNav />
      {saved === "1" && <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-success-soft p-4 text-xs font-bold text-success"><CheckCircle2 size={17} /> Sesión guardada correctamente.</div>}
      {sessions.length ? <div className="space-y-3">{sessions.map((session) => <StrengthSessionCard key={session.id} session={session} displayUnit={unit} />)}</div> : <EmptyState icon={Dumbbell} title="Aún no hay sesiones de fuerza" description="Inicia una rutina y completa al menos una serie para verla aquí." actionLabel="Iniciar sesión" actionHref="/strength/session/new" />}
    </>
  );
}

