import { BookOpenText, Quote } from "lucide-react";
import type { DailyInspiration } from "@/lib/data/dailyInspiration";

export function DailyInspirationCard({ inspiration }: { inspiration: DailyInspiration }) {
  const Icon = inspiration.kind === "verse" ? BookOpenText : Quote;

  return (
    <aside className="rounded-[24px] border border-line/80 bg-white/80 px-5 py-4 shadow-[0_8px_30px_rgba(17,17,20,.045)] backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-xs leading-5 font-semibold text-ink sm:text-[13px]">
            “{inspiration.text}”
          </p>
          <p className="mt-1.5 text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
            {inspiration.attribution}
          </p>
        </div>
      </div>
    </aside>
  );
}
