import { Flag } from "lucide-react";

interface MarathonCountdownProps {
  raceName: string;
  raceDate: string;
  days: number;
  progress: number;
}

export function MarathonCountdown({ raceName, raceDate, days, progress }: MarathonCountdownProps) {
  const formattedRaceDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${raceDate}T12:00:00Z`));

  return (
    <section className="area-countdown card-enter app-card relative overflow-hidden bg-ink p-5 text-white sm:p-6">
      <div aria-hidden className="absolute -right-8 -bottom-12 size-36 rounded-full border-[22px] border-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.13em] text-white/50 uppercase">{raceName.replace("Maratón de Guadalajara", "Maratón GDL")}</p>
          <p className="mt-2 text-sm font-semibold first-letter:uppercase">{formattedRaceDate}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-white/10">
          <Flag size={18} />
        </span>
      </div>
      <div className="relative mt-6 flex items-baseline gap-2">
        <span className="text-[3.25rem] leading-none font-bold tracking-[-0.06em]">{days}</span>
        <span className="text-sm font-semibold text-white/55">días</span>
      </div>
      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
