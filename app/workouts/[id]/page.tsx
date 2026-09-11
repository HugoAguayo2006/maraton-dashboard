import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowUpRight, ChevronLeft, Clock3, Flame, Gauge, HeartPulse, MapPin, Mountain, Route, SmilePlus } from "lucide-react";
import { ElevationChart } from "@/components/workouts/ElevationChart";
import { RouteMap } from "@/components/workouts/RouteMap";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { formatDayAndDate, formatDuration, formatPaceSeconds } from "@/lib/format";
import type { RunActivityType } from "@/types/training";

export const metadata: Metadata = { title: "Detalle del entrenamiento" };

const activityLabels: Record<RunActivityType, string> = {
  easy: "Carrera suave",
  long_run: "Tirada larga",
  tempo: "Tempo",
  interval: "Intervalos",
  race: "Competencia",
  recovery: "Recuperación",
};

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getWorkoutDetail(id);
  if (!detail) notFound();
  const { workout, splits, route } = detail;
  const location = [workout.locationName, workout.locationCity].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/workouts" className="mb-5 inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-bold text-muted hover:text-ink"><ChevronLeft size={17} /> Entrenamientos</Link>

      <section className="app-card relative overflow-hidden bg-[linear-gradient(145deg,#fff_30%,#f3f8ff_100%)] p-5 sm:p-7 lg:p-9">
        <div aria-hidden className="absolute -top-28 -right-24 size-64 rounded-full border-[42px] border-accent/5" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="eyebrow first-letter:uppercase">{formatDayAndDate(workout.date)}</span><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${workout.source === "strava" ? "bg-[#fff0ea] text-[#fc4c02]" : "bg-accent-soft text-accent"}`}>{workout.source === "strava" ? "Importado de Strava" : "Registro manual"}</span></div>
          <span className="mt-8 grid size-12 place-items-center rounded-2xl bg-accent text-white"><Route size={22} /></span>
          <p className="mt-5 text-xs font-bold text-accent">{activityLabels[workout.activityType]}</p>
          <h1 className="mt-2 max-w-3xl text-[2rem] leading-tight font-bold tracking-[-0.05em] sm:text-[2.6rem]">{workout.routeName ?? workout.title}</h1>
          {location && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-muted"><MapPin size={15} /> {location}</p>}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroMetric icon={<Route size={16} />} label="Distancia" value={`${workout.distanceKm} km`} />
            <HeroMetric icon={<Clock3 size={16} />} label="Tiempo" value={formatDuration(workout.durationSeconds)} />
            <HeroMetric icon={<Gauge size={16} />} label="Pace promedio" value={workout.averagePace.replace(" ", "")} />
            <HeroMetric icon={<Mountain size={16} />} label="Desnivel" value={workout.elevationGain === null ? "—" : `${Math.round(workout.elevationGain)} m`} />
          </div>
          {workout.stravaActivityId && <a href={`https://www.strava.com/activities/${workout.stravaActivityId}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#fc4c02]">Ver actividad original <ArrowUpRight size={15} /></a>}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
        <div className="space-y-5">
          {route && <section className="app-card p-4 sm:p-5"><div className="mb-4"><p className="eyebrow">Recorrido</p><p className="mt-2 text-sm text-muted">Mapa basado en OpenStreetMap</p></div><RouteMap polyline={route.polyline} /></section>}
          {route && route.distanceStream.length > 1 && route.elevationStream.length > 1 && <section className="app-card p-5 sm:p-6"><p className="eyebrow">Perfil de elevación</p><p className="mt-2 mb-4 text-sm text-muted">Altitud a lo largo de la carrera</p><ElevationChart distances={route.distanceStream} elevations={route.elevationStream} /></section>}
          {splits.length > 0 && <section className="app-card overflow-hidden"><div className="p-5 sm:p-6"><p className="eyebrow">Parciales</p><p className="mt-2 text-sm text-muted">Ritmo y elevación por segmento</p></div><div className="divide-y divide-line/80 border-t border-line/80">{splits.map((split) => <div key={split.id} className="grid grid-cols-3 items-center px-5 py-3.5 text-sm sm:px-6"><span className="font-bold">Km {split.kilometer}</span><span className="text-center font-semibold">{formatPaceSeconds(split.paceSeconds)?.replace(" ", "")}</span><span className={`text-right text-xs font-semibold ${split.elevationDifference !== null && split.elevationDifference > 0 ? "text-warning" : "text-muted"}`}>{split.elevationDifference === null ? "—" : `${split.elevationDifference > 0 ? "+" : ""}${Math.round(split.elevationDifference)} m`}</span></div>)}</div></section>}
        </div>

        <aside className="space-y-5">
          <section className="app-card p-5 sm:p-6"><p className="eyebrow mb-5">Métricas</p><div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><SideMetric icon={<HeartPulse size={16} />} label="Frecuencia promedio" value={workout.averageHeartRate === null ? "—" : `${workout.averageHeartRate} ppm`} /><SideMetric icon={<Activity size={16} />} label="Frecuencia máxima" value={workout.maxHeartRate === null ? "—" : `${workout.maxHeartRate} ppm`} /><SideMetric icon={<Flame size={16} />} label="Calorías" value={workout.calories === null ? "—" : `${Math.round(workout.calories)} kcal`} /><SideMetric icon={<SmilePlus size={16} />} label="Sensación" value={workout.feeling === null ? "Sin captura" : `${workout.feeling}/10`} /><SideMetric icon={<Gauge size={16} />} label="RPE / dolor" value={`${workout.rpe ?? "—"} / ${workout.pain ?? "—"}`} /></div></section>
          {(workout.notes || workout.foodBefore || workout.hydration || workout.gels) && <section className="app-card p-5 sm:p-6"><p className="eyebrow mb-5">Contexto</p><div className="space-y-4 text-sm"><TextDetail label="Notas" value={workout.notes} /><TextDetail label="Comida previa" value={workout.foodBefore} /><TextDetail label="Hidratación" value={workout.hydration} /><TextDetail label="Geles" value={workout.gels} /></div></section>}
        </aside>
      </div>
    </div>
  );
}

function HeroMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-1.5 text-muted">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div><p className="mt-3 text-lg font-bold tracking-[-0.035em]">{value}</p></div>; }
function SideMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl bg-surface-subtle p-3.5"><div className="flex items-center gap-1.5 text-muted">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div><p className="mt-2 text-sm font-bold">{value}</p></div>; }
function TextDetail({ label, value }: { label: string; value: string | null }) { return value ? <div><p className="text-[10px] font-bold text-muted uppercase">{label}</p><p className="mt-1 whitespace-pre-line leading-6">{value}</p></div> : null; }

