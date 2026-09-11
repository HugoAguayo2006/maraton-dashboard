import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StravaActivityPicker } from "@/components/workouts/StravaActivityPicker";
import { getStravaIntegrationStatus } from "@/lib/data/integrations";

export const metadata: Metadata = { title: "Importar desde Strava" };

export default async function StravaImportPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const [query, status] = await Promise.all([searchParams, getStravaIntegrationStatus()]);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/workouts/new" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted hover:text-ink"><ChevronLeft size={17} /> Elegir registro</Link>
      <header className="mb-7"><p className="eyebrow mb-3">Strava</p><h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">Importar carrera</h1><p className="mt-2 text-sm leading-6 text-muted sm:text-base">Elige una actividad. Solo se guarda cuando confirmas la importación.</p></header>
      {status.connected ? <StravaActivityPicker planItemId={query.plan} /> : (
        <section className="app-card p-6 text-center sm:p-8"><p className="text-base font-bold">Conecta Strava primero</p><p className="mt-2 text-sm text-muted">La autorización se administra desde Configuración.</p><Link href="/settings/integrations" className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-[#fc4c02] px-5 text-sm font-bold text-white">Ir a integraciones</Link></section>
      )}
    </div>
  );
}

