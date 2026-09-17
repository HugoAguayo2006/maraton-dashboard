"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BatteryMedium, Check, ChevronDown, CloudDownload, Gauge, HeartPulse, LoaderCircle, MoonStar, Mountain, Route, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { formatDayAndDate, formatDuration } from "@/lib/format";
import type { StravaActivitySummary } from "@/types/training";

export function StravaActivityPicker({ planItemId }: { planItemId?: string }) {
  const router = useRouter();
  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [rpe, setRpe] = useState(3);
  const [pain, setPain] = useState(0);
  const [fatigue, setFatigue] = useState(2);
  const [sleepHours, setSleepHours] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadActivities(1).then((payload) => {
      if (!active) return;
      if (payload.error) setError(payload.error);
      else {
        setActivities(payload.activities ?? []);
        setHasMore(Boolean(payload.hasMore));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;
    const payload = await loadActivities(nextPage);
    if (payload.error) setError(payload.error);
    else {
      setActivities((current) => [...current, ...(payload.activities ?? [])]);
      setPage(nextPage);
      setHasMore(Boolean(payload.hasMore));
    }
    setLoadingMore(false);
  }

  async function importActivity(activityId: string) {
    const parsedSleepHours = Number(sleepHours);
    if (sleepHours.trim() === "" || !Number.isFinite(parsedSleepHours) || parsedSleepHours < 0 || parsedSleepHours > 24) {
      setError("Captura tus horas de sueño entre 0 y 24 antes de importar.");
      return;
    }
    setImportingId(activityId);
    setError(null);
    try {
      const response = await fetch(`/api/strava/activities/${activityId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingPlanItemId: planItemId ?? null,
          rpe,
          pain,
          fatigue,
          sleepHours: parsedSleepHours,
        }),
      });
      const payload: { workoutId?: string; error?: string } = await response.json();
      if (!response.ok || !payload.workoutId) throw new Error(payload.error ?? "No pudimos importar la actividad.");
      router.push(`/workouts/${payload.workoutId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos importar la actividad.");
      setImportingId(null);
    }
  }

  function prepareImport(activityId: string) {
    setSelectedActivityId(activityId);
    setRpe(3);
    setPain(0);
    setFatigue(2);
    setSleepHours("");
    setError(null);
  }

  function cancelImport() {
    if (importingId) return;
    setSelectedActivityId(null);
    setError(null);
  }

  if (loading) {
    return <div className="app-card grid min-h-64 place-items-center"><span className="flex items-center gap-2 text-sm font-semibold text-muted"><LoaderCircle size={18} className="animate-spin" /> Consultando Strava…</span></div>;
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger"><TriangleAlert size={18} className="mt-0.5 shrink-0" /> {error}</p>}
      {activities.length === 0 && !error ? (
        <div className="app-card px-5 py-12 text-center"><CloudDownload size={24} className="mx-auto text-muted" /><h2 className="mt-4 text-base font-bold">No encontramos carreras recientes</h2><p className="mt-2 text-sm text-muted">Revisa Strava o registra esta sesión manualmente.</p></div>
      ) : (
        <div className="grid gap-3">
          {activities.map((activity) => (
            <article key={activity.id} className="app-card min-w-0 p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0ea] text-[#fc4c02]"><Route size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-bold sm:text-base">{activity.name}</h2>
                    {activity.importedWorkoutId && <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold text-success"><Check size={11} /> Importada</span>}
                  </div>
                  <p className="mt-1 text-xs font-medium text-muted first-letter:uppercase">{formatDayAndDate(activity.date)}</p>
                </div>
              </div>
              <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric value={`${activity.distanceKm} km`} label="Distancia" />
                <Metric value={activity.averagePace.replace(" ", "")} label="Pace" />
                <Metric value={formatDuration(activity.durationSeconds)} label="Tiempo" />
                <Metric value={activity.elevationGain === null ? "—" : `${Math.round(activity.elevationGain)} m`} label="Desnivel" icon={<Mountain size={12} />} />
              </div>
              {activity.averageHeartRate !== null && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted"><HeartPulse size={13} /> {activity.averageHeartRate} ppm promedio</p>}
              {activity.importedWorkoutId ? (
                <Link href={`/workouts/${activity.importedWorkoutId}`} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-success/20 bg-success-soft px-4 text-xs font-bold text-success sm:w-fit">Ver registro <ArrowUpRight size={15} /></Link>
              ) : selectedActivityId === activity.id ? (
                <section className="mt-5 rounded-[24px] border border-line bg-surface-subtle p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">¿Cómo te sentiste?</p>
                      <p className="mt-1 text-xs leading-5 text-muted">Completa estos datos para analizar tu recuperación.</p>
                    </div>
                    <button type="button" onClick={cancelImport} disabled={Boolean(importingId)} aria-label="Cancelar importación" className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted disabled:opacity-50"><X size={17} /></button>
                  </div>

                  <fieldset className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <legend className="flex items-center gap-2 text-xs font-bold text-muted"><Gauge size={15} /> Esfuerzo percibido (RPE)</legend>
                      <span className="text-xs font-bold text-accent">{rpe}/10</span>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                      {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                        <button key={value} type="button" onClick={() => setRpe(value)} aria-pressed={rpe === value} className={`grid h-10 place-items-center rounded-xl text-xs font-bold transition-all ${rpe === value ? "bg-accent text-white shadow-[0_5px_14px_rgba(36,120,238,.2)]" : "border border-line bg-white text-muted"}`}>{value}</button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <WellnessSlider icon={<ShieldCheck size={15} />} label="Dolor" value={pain} onChange={setPain} lowLabel="Nada" highLabel="Mucho" />
                    <WellnessSlider icon={<BatteryMedium size={15} />} label="Fatiga" value={fatigue} onChange={setFatigue} lowLabel="Fresco" highLabel="Agotado" />
                  </div>

                  <label className="mt-5 block">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted"><MoonStar size={15} /> Horas de sueño</span>
                    <div className="relative mt-2 max-w-56">
                      <input value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} type="number" min="0" max="24" step="0.1" inputMode="decimal" placeholder="7.5" className="h-12 w-full rounded-2xl border border-line bg-white px-4 pr-10 text-sm font-semibold placeholder:text-muted/45" />
                      <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted">h</span>
                    </div>
                  </label>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button type="button" disabled={Boolean(importingId)} onClick={() => importActivity(activity.id)} className="pressable flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:min-w-48">
                      {importingId === activity.id ? <LoaderCircle size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                      {importingId === activity.id ? "Importando…" : "Confirmar importación"}
                    </button>
                    <button type="button" disabled={Boolean(importingId)} onClick={cancelImport} className="min-h-11 rounded-2xl border border-line bg-white px-5 text-xs font-bold text-muted disabled:opacity-50">Cancelar</button>
                  </div>
                </section>
              ) : (
                <button type="button" disabled={Boolean(importingId)} onClick={() => prepareImport(activity.id)} className="pressable mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-4 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-fit sm:min-w-44">
                  <CloudDownload size={16} />
                  Importar actividad
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {hasMore && <button type="button" disabled={loadingMore} onClick={loadMore} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-sm font-bold text-muted"><ChevronDown size={17} /> {loadingMore ? "Cargando…" : "Cargar más"}</button>}
    </div>
  );
}

async function loadActivities(page: number): Promise<{ activities?: StravaActivitySummary[]; hasMore?: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/strava/activities?page=${page}`, { cache: "no-store" });
    const payload = await response.json();
    return response.ok ? payload : { error: payload.error ?? "No pudimos consultar Strava." };
  } catch {
    return { error: "No pudimos conectar con Strava." };
  }
}

function Metric({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return <div className="min-w-0 rounded-2xl bg-surface-subtle p-3"><p className="flex min-w-0 items-center gap-1 break-words text-sm font-bold">{icon}{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div>;
}

function WellnessSlider({ icon, label, value, onChange, lowLabel, highLabel }: { icon: React.ReactNode; label: string; value: number; onChange: (value: number) => void; lowLabel: string; highLabel: string }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-xs font-bold text-muted"><span className="flex items-center gap-2">{icon}{label}</span><span className="text-accent">{value}/10</span></span>
      <input type="range" min="0" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 h-2 w-full" />
      <span className="mt-1.5 flex justify-between text-[10px] font-medium text-muted"><span>{lowLabel}</span><span>{highLabel}</span></span>
    </label>
  );
}
