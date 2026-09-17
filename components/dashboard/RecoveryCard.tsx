import { BatteryMedium, Gauge, MoonStar, Route, ShieldCheck, Timer } from "lucide-react";
import type { RecoveryMetrics } from "@/types/training";

export function RecoveryCard({ recovery }: { recovery: RecoveryMetrics }) {
  const hasData = Object.values(recovery).some((value) => value !== null);
  const metrics = [
    { label: "RPE", value: recovery.rpe, suffix: "/10", icon: Gauge, color: "bg-accent" },
    { label: "Dolor", value: recovery.pain, suffix: "/10", icon: ShieldCheck, color: "bg-success" },
    { label: "Fatiga", value: recovery.fatigue, suffix: "/10", icon: BatteryMedium, color: "bg-warning" },
    { label: "Sueño", value: recovery.sleepHours, suffix: " h", icon: MoonStar, color: "bg-[#8071d8]" },
    { label: "Distancia", value: recovery.distanceKm, suffix: " km", icon: Route, color: "bg-[#16a3a3]" },
    { label: "Pace", value: recovery.averagePace?.replace(" ", "") ?? null, suffix: "", icon: Timer, color: "bg-[#e8558d]" },
  ];

  return (
    <section className="area-recovery card-enter app-card p-5 sm:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">Estado reciente</span>
          <p className="mt-2 text-xs font-medium text-muted">{hasData ? "Basado en tu último registro" : "Registra una sesión para ver tus métricas"}</p>
        </div>
        {hasData && <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold tracking-wide text-success uppercase">
          Último registro
        </span>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0">
              <div className="flex items-center gap-2 text-muted">
                <span className={`size-1.5 rounded-full ${metric.color}`} />
                <Icon size={15} />
                <span className="text-[11px] font-semibold">{metric.label}</span>
              </div>
              <p className="mt-2 break-words text-xl font-bold tracking-[-0.04em] sm:text-2xl">
                {metric.value ?? "—"}<span className="text-xs font-semibold text-muted">{metric.value === null ? "" : metric.suffix}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
