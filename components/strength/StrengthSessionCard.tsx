import { CheckCircle2, ChevronDown, Clock3, Dumbbell } from "lucide-react";
import { formatDayAndDate } from "@/lib/format";
import { convertKilograms, formatStrengthValue } from "@/lib/strength/constants";
import type { StrengthSession, StrengthUnit } from "@/types/training";

export function StrengthSessionCard({ session, displayUnit }: { session: StrengthSession; displayUnit: StrengthUnit }) {
  const volume = convertKilograms(session.totalVolumeKg, displayUnit);
  return (
    <details className="group app-card min-w-0 overflow-hidden">
      <summary className="pressable flex min-w-0 cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warning"><Dumbbell size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold text-muted capitalize">{formatDayAndDate(session.date)}</span>
          <span className="mt-1 block truncate text-sm font-bold sm:text-base">{session.routineName ?? "Sesión libre"}</span>
          <span className="mt-1 block truncate text-[11px] font-medium text-muted">{session.exerciseCount} ejercicios · {session.setCount} series</span>
        </span>
        <span className="hidden text-right sm:block"><span className="block text-sm font-bold">{formatStrengthValue(volume)} {displayUnit}</span><span className="mt-0.5 block text-[10px] text-muted">volumen</span></span>
        <ChevronDown size={17} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line bg-surface-subtle/65 p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <SessionMetric icon={Clock3} label="Duración" value={session.durationMinutes ? `${session.durationMinutes} min` : "Sin registrar"} />
          <SessionMetric icon={Dumbbell} label="Volumen" value={`${formatStrengthValue(volume)} ${displayUnit}`} />
          <div className="col-span-2 sm:col-span-1"><SessionMetric icon={CheckCircle2} label="Series" value={String(session.setCount)} /></div>
        </div>
        <div className="space-y-3">
          {session.exercises.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-white p-3.5">
              <div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-xs font-bold">{entry.exercise.nameEs}</p><span className="shrink-0 text-[10px] font-semibold text-muted">{entry.sets.length} series</span></div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.sets.map((set) => {
                  const weightKg = set.weightKg ?? (set.weightLbs === null ? 0 : set.weightLbs * 0.45359237);
                  const weight = convertKilograms(weightKg, displayUnit);
                  return <span key={set.id} className="rounded-lg bg-surface-subtle px-2 py-1 text-[10px] font-semibold text-muted">{weight > 0 ? `${formatStrengthValue(weight)} ${displayUnit}` : "Peso corporal"} × {set.repetitions}</span>;
                })}
              </div>
              {entry.notes && <p className="mt-2 text-[11px] leading-5 text-muted">{entry.notes}</p>}
            </div>
          ))}
        </div>
        {session.notes && <p className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-muted">{session.notes}</p>}
      </div>
    </details>
  );
}

function SessionMetric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="flex min-h-14 items-center gap-2.5 rounded-xl bg-white p-3"><Icon size={15} className="shrink-0 text-muted" /><span className="min-w-0"><span className="block text-[9px] font-bold text-muted uppercase">{label}</span><span className="mt-0.5 block truncate text-xs font-bold">{value}</span></span></div>;
}

