import type { Metadata } from "next";
import { Bell, ChevronRight, Database, Shield, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { athleteProfile } from "@/data/mockDashboard";

export const metadata: Metadata = { title: "Configuración" };

const rows = [
  { label: "Perfil del atleta", detail: "Datos personales y objetivo", icon: UserRound },
  { label: "Notificaciones", detail: "Recordatorios de entrenamiento", icon: Bell },
  { label: "Conexión con Supabase", detail: "Pendiente de configuración", icon: Database },
  { label: "Privacidad y acceso", detail: "Autenticación próximamente", icon: Shield },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configuración" description="Tu perfil de entrenamiento y las preferencias de la aplicación." />
      <section className="app-card mb-5 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-ink text-lg font-bold text-white">H</span>
          <div>
            <h2 className="text-lg font-bold">{athleteProfile.firstName} {athleteProfile.lastName}</h2>
            <p className="mt-0.5 text-sm text-muted">20 años · 80 kg · Primer maratón</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-surface-subtle p-4">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">Objetivo principal</p>
          <p className="mt-1.5 text-sm font-semibold">{athleteProfile.goal}.</p>
        </div>
      </section>
      <section className="app-card divide-y divide-line/80 overflow-hidden px-4">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <button key={row.label} type="button" className="flex min-h-[72px] w-full items-center gap-3 px-1 text-left">
              <span className="grid size-9 place-items-center rounded-xl bg-surface-subtle text-muted"><Icon size={18} /></span>
              <span className="flex-1"><span className="block text-sm font-bold">{row.label}</span><span className="mt-0.5 block text-xs text-muted">{row.detail}</span></span>
              <ChevronRight size={17} className="text-muted" />
            </button>
          );
        })}
      </section>
    </>
  );
}
