import type { Metadata } from "next";
import { CalendarDays, Database, Gauge, LogOut, MapPin, Medal, Shield, Target, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AthleteAvatar } from "@/components/profile/AthleteAvatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAthleteProfile } from "@/lib/data/athlete";
import { formatShortDate } from "@/lib/format";
import { getAthleteSexLabel } from "@/lib/profile/profile";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ avatar?: string }>;
}) {
  const profile = await getAthleteProfile();
  const { avatar } = await searchParams;

  return (
    <>
      <PageHeader title="Configuración" description="Tu perfil personal y el objetivo que guía el plan." />

      {avatar === "retry" && (
        <div role="status" className="mb-5 rounded-2xl bg-warning-soft p-4 text-xs font-medium text-warning">
          Tu cuenta quedó lista, pero no pudimos subir la foto. Puedes intentarlo nuevamente aquí.
        </div>
      )}

      {profile && (
        <>
          <section className="app-card mb-5 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <AthleteAvatar name={profile.name} src={profile.avatarUrl} className="size-14 text-sm" />
              <div>
                <h2 className="text-lg font-bold">{profile.name}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {profile.age ?? "—"} años · {profile.weightKg} kg · {getAthleteSexLabel(profile.sex)}
                </p>
              </div>
            </div>
          </section>

          <section className="app-card mb-5 p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent"><UserRound size={19} /></span>
              <div><h2 className="text-base font-bold">Perfil del atleta</h2><p className="mt-0.5 text-xs text-muted">La edad se calcula desde tu fecha de nacimiento.</p></div>
            </div>
            <ProfileForm profile={profile} intent="settings" />
          </section>

          <section className="app-card mb-5 p-5 sm:p-6">
            <p className="eyebrow mb-5">Carrera objetivo</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileDetail icon={Target} label="Carrera" value={profile.raceName} />
              <ProfileDetail icon={Medal} label="Distancia" value={profile.goalEventDistanceKm === null ? "—" : `${profile.goalEventDistanceKm} km`} />
              <ProfileDetail icon={CalendarDays} label="Fecha" value={formatShortDate(profile.raceDate)} />
              <ProfileDetail icon={MapPin} label="Lugar" value={profile.goalEventLocation ?? "Sin especificar"} />
              <ProfileDetail icon={Gauge} label="Pace natural" value={profile.naturalPace} />
              <ProfileDetail icon={Target} label="Objetivo" value={profile.goal} />
            </div>
          </section>
        </>
      )}

      <section className="app-card mb-5 grid gap-3 p-4 sm:grid-cols-2">
        <ProfileDetail icon={Database} label="Datos" value="Supabase conectado" />
        <ProfileDetail icon={Shield} label="Privacidad" value="Protegido con RLS" />
      </section>

      <form action={logout}>
        <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-danger/15 bg-danger-soft px-5 text-sm font-bold text-danger sm:w-fit">
          <LogOut size={17} /> Cerrar sesión
        </button>
      </form>
    </>
  );
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface-subtle p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-muted shadow-sm"><Icon size={17} /></span>
      <span><span className="block text-[10px] font-bold tracking-wide text-muted uppercase">{label}</span><span className="mt-0.5 block text-sm font-semibold first-letter:uppercase">{value}</span></span>
    </div>
  );
}
