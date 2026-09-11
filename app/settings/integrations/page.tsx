import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronLeft, Link2, RefreshCcw, ShieldCheck } from "lucide-react";
import { disconnectStravaAction } from "@/app/settings/integrations/actions";
import { getStravaIntegrationStatus } from "@/lib/data/integrations";
import { isStravaConfigured } from "@/lib/strava/config";

export const metadata: Metadata = { title: "Integraciones" };

const errorMessages: Record<string, string> = {
  configuration: "Faltan variables de Strava en el servidor.",
  state: "La autorización expiró o no pudo verificarse. Inténtalo otra vez.",
  denied: "Cancelaste la autorización en Strava.",
  missing_code: "Strava no devolvió un código de autorización.",
  scope: "Autoriza el acceso a tus actividades para poder importarlas.",
  exchange: "No pudimos completar la conexión con Strava.",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; disconnected?: string; error?: string }>;
}) {
  const [status, query] = await Promise.all([
    getStravaIntegrationStatus(),
    searchParams,
  ]);
  const configured = isStravaConfigured();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/settings" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted hover:text-ink">
        <ChevronLeft size={17} /> Configuración
      </Link>
      <header className="mb-7">
        <p className="eyebrow mb-3">Servicios conectados</p>
        <h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">Integraciones</h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Importa tus carreras reales sin duplicar registros.</p>
      </header>

      {(query.connected || query.disconnected) && (
        <p role="status" className="mb-4 rounded-2xl bg-success-soft p-4 text-sm font-semibold text-success">
          {query.connected ? "Strava quedó conectado correctamente." : "Strava quedó desconectado."}
        </p>
      )}
      {query.error && (
        <p role="alert" className="mb-4 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger">
          {errorMessages[query.error] ?? "No pudimos completar la operación."}
        </p>
      )}

      <section className="app-card overflow-hidden">
        <div className="bg-[#fc4c02] p-5 text-white sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Link2 size={23} /></span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold">
              {status.connected ? "Conectado" : "Sin conectar"}
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em]">Strava</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Sincroniza distancia, tiempo, ritmo, elevación, frecuencia cardiaca, parciales y recorrido.</p>
        </div>
        <div className="p-5 sm:p-7">
          {status.connected ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-success">
                <Check size={18} strokeWidth={3} />
                <div><p className="text-sm font-bold">Cuenta lista para importar</p><p className="mt-0.5 text-xs opacity-75">Atleta Strava #{status.providerUserId}</p></div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/workouts/new/strava" className="pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-5 text-sm font-bold text-white">
                  Ver actividades <ArrowUpRight size={17} />
                </Link>
                <form action={disconnectStravaAction}>
                  <button type="submit" className="min-h-12 w-full rounded-2xl border border-line px-5 text-sm font-bold text-muted">Desconectar</button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-surface-subtle p-4">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-xs leading-5 text-muted">La conexión usa OAuth. Tus tokens se guardan cifrados y nunca se exponen al navegador.</p>
              </div>
              {configured ? (
                <a href="/api/strava/connect" className="pressable mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-5 text-sm font-bold text-white sm:w-fit">
                  Conectar con Strava <ArrowUpRight size={17} />
                </a>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-warning-soft p-4 text-warning">
                  <RefreshCcw size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs leading-5">Agrega las cuatro variables privadas de Strava al archivo <code>.env.local</code> y reinicia el servidor.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
