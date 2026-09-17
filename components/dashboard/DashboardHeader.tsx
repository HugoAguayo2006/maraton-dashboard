import { formatShortDate } from "@/lib/format";
import { DailyInspirationCard } from "@/components/dashboard/DailyInspirationCard";
import type { DailyInspiration } from "@/lib/data/dailyInspiration";
import type { AthleteProfile } from "@/types/training";

interface DashboardHeaderProps {
  athlete: AthleteProfile | null;
  date: string;
  inspiration: DailyInspiration;
}

export function DashboardHeader({ athlete, date, inspiration }: DashboardHeaderProps) {
  const formattedDate = formatShortDate(date);

  return (
    <header className="mb-6 grid min-w-0 gap-4 sm:mb-8 md:grid-cols-2 md:items-center md:gap-5 min-[1200px]:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
      <div className="min-w-0">
        <p className="mb-2 hidden text-xs font-bold tracking-[0.14em] text-muted uppercase min-[1200px]:block">
          Run Dashboard
        </p>
        <h1 className="break-words text-[clamp(1.9rem,8vw,2.55rem)] leading-[1.02] font-bold tracking-[-0.045em]">
          Buenos días, {athlete?.firstName ?? "atleta"}
        </h1>
        <p className="mt-2 text-sm font-medium text-muted first-letter:uppercase sm:text-base">
          {formattedDate}
        </p>
      </div>
      <DailyInspirationCard inspiration={inspiration} />
    </header>
  );
}
