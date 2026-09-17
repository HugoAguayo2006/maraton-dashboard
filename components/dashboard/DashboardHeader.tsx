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
    <header className="mb-6 grid gap-5 md:grid-cols-2 md:items-center sm:mb-8 min-[1200px]:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
      <div>
        <p className="mb-2 hidden text-xs font-bold tracking-[0.14em] text-muted uppercase lg:block">
          Run Dashboard
        </p>
        <h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.55rem]">
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
