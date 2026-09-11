import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, CloudDownload, PenLine } from "lucide-react";
import { getStravaIntegrationStatus } from "@/lib/data/integrations";

export const metadata: Metadata = { title: "Registrar entrenamiento" };

export default async function NewWorkoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; date?: string }> }) {
  const query = await searchParams;
  const status = await getStravaIntegrationStatus();
  const suffix = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted transition-colors hover:text-ink">
        <ChevronLeft size={17} /> Volver
      </Link>
      <header className="mb-7">
        <p className="eyebrow mb-3">Registrar carrera</p>
        <h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">¿De dónde vienen los datos?</h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Puedes capturarlos tú o traer la actividad completa desde Strava.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice href={`/workouts/new/manual${suffix ? `?${suffix}` : ""}`} icon={<PenLine size={24} />} eyebrow="Captura propia" title="Registro manual" description="Distancia, tiempo, sensaciones, ubicación y parciales." tone="manual" />
        <Choice href={status.connected ? `/workouts/new/strava${suffix ? `?${suffix}` : ""}` : "/settings/integrations"} icon={<CloudDownload size={24} />} eyebrow={status.connected ? "Cuenta conectada" : "Requiere conexión"} title="Importar de Strava" description="Ruta, elevación, frecuencia cardiaca y splits desde tu reloj." tone="strava" />
      </div>
    </div>
  );
}

function Choice({ href, icon, eyebrow, title, description, tone }: { href: string; icon: React.ReactNode; eyebrow: string; title: string; description: string; tone: "manual" | "strava" }) {
  return <Link href={href} className="app-card group flex min-h-64 flex-col p-5 transition-transform hover:-translate-y-0.5 sm:p-6"><span className={`grid size-12 place-items-center rounded-2xl ${tone === "strava" ? "bg-[#fff0ea] text-[#fc4c02]" : "bg-accent-soft text-accent"}`}>{icon}</span><p className="mt-8 text-[10px] font-bold tracking-[0.1em] text-muted uppercase">{eyebrow}</p><h2 className="mt-2 text-xl font-bold tracking-[-0.035em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p><span className="mt-auto flex items-center gap-2 pt-6 text-xs font-bold text-ink">Continuar <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span></Link>;
}
