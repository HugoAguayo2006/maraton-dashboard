"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, ChevronDown, CloudDownload, HeartPulse, LoaderCircle, Mountain, Route, TriangleAlert } from "lucide-react";
import { formatDayAndDate, formatDuration } from "@/lib/format";
import type { StravaActivitySummary } from "@/types/training";

export function StravaActivityPicker({ planItemId }: { planItemId?: string }) {
  const router = useRouter();
  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
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
    setImportingId(activityId);
    setError(null);
    try {
      const response = await fetch(`/api/strava/activities/${activityId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingPlanItemId: planItemId ?? null }),
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
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric value={`${activity.distanceKm} km`} label="Distancia" />
                <Metric value={activity.averagePace.replace(" ", "")} label="Pace" />
                <Metric value={formatDuration(activity.durationSeconds)} label="Tiempo" />
                <Metric value={activity.elevationGain === null ? "—" : `${Math.round(activity.elevationGain)} m`} label="Desnivel" icon={<Mountain size={12} />} />
              </div>
              {activity.averageHeartRate !== null && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted"><HeartPulse size={13} /> {activity.averageHeartRate} ppm promedio</p>}
              {activity.importedWorkoutId ? (
                <Link href={`/workouts/${activity.importedWorkoutId}`} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-success/20 bg-success-soft px-4 text-xs font-bold text-success sm:w-fit">Ver registro <ArrowUpRight size={15} /></Link>
              ) : (
                <button type="button" disabled={Boolean(importingId)} onClick={() => importActivity(activity.id)} className="pressable mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-4 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-fit sm:min-w-44">
                  {importingId === activity.id ? <LoaderCircle size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                  {importingId === activity.id ? "Importando…" : "Importar actividad"}
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
  return <div className="rounded-2xl bg-surface-subtle p-3"><p className="flex items-center gap-1 text-sm font-bold">{icon}{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div>;
}

