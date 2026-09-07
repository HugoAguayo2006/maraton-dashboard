import { BatteryMedium, Gauge, MoonStar, ShieldCheck } from "lucide-react";
import type { RecoveryMetrics } from "@/types/training";

export function RecoveryCard({ recovery }: { recovery: RecoveryMetrics }) {
  const metrics = [
    { label: "RPE", value: recovery.rpe, suffix: "/10", icon: Gauge, color: "bg-accent" },
    { label: "Dolor", value: recovery.pain, suffix: "/10", icon: ShieldCheck, color: "bg-success" },
    { label: "Fatiga", value: recovery.fatigue, suffix: "/10", icon: BatteryMedium, color: "bg-warning" },
    { label: "Sueño", value: recovery.sleepHours, suffix: " h", icon: MoonStar, color: "bg-[#8071d8]" },
  ];

  return (
    <section className="area-recovery card-enter app-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Estado reciente</span>
          <p className="mt-2 text-xs font-medium text-muted">Tu cuerpo se ve estable</p>
        </div>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold tracking-wide text-success uppercase">
          En equilibrio
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label}>
              <div className="flex items-center gap-2 text-muted">
                <span className={`size-1.5 rounded-full ${metric.color}`} />
                <Icon size={15} />
                <span className="text-[11px] font-semibold">{metric.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                {metric.value}<span className="text-xs font-semibold text-muted">{metric.suffix}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
