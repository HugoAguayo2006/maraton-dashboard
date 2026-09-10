"use client";

import { useActionState, useState } from "react";
import {
  Check,
  CirclePlus,
  Clock3,
  Link2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { saveStrengthSession, type StrengthActionState } from "@/app/strength/actions";
import { ExerciseArtwork } from "@/components/strength/ExerciseArtwork";
import { ExercisePickerModal } from "@/components/strength/ExercisePickerModal";
import { formatDayAndDate } from "@/lib/format";
import type {
  Exercise,
  StrengthRoutine,
  StrengthUnit,
  TrainingPlanItem,
} from "@/types/training";

interface TrackerSet {
  id: string;
  weight: string;
  repetitions: string;
  rir: string;
  notes: string;
  completed: boolean;
}

interface TrackerExercise {
  exercise: Exercise;
  notes: string;
  sets: TrackerSet[];
}

const initialState: StrengthActionState = {};

export function WorkoutTracker({
  exercises,
  routines,
  initialRoutine,
  planItem,
  defaultDate,
  defaultUnit,
}: {
  exercises: Exercise[];
  routines: StrengthRoutine[];
  initialRoutine: StrengthRoutine | null;
  planItem: TrainingPlanItem | null;
  defaultDate: string;
  defaultUnit: StrengthUnit;
}) {
  const [state, action, pending] = useActionState(saveStrengthSession, initialState);
  const [routineId, setRoutineId] = useState(initialRoutine?.id ?? "");
  const [unit, setUnit] = useState<StrengthUnit>(defaultUnit);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [entries, setEntries] = useState<TrackerExercise[]>(() => routineEntries(initialRoutine));

  function selectRoutine(id: string) {
    setRoutineId(id);
    setEntries(routineEntries(routines.find((routine) => routine.id === id) ?? null));
  }

  function addExercise(exercise: Exercise) {
    setEntries((current) => current.some((entry) => entry.exercise.id === exercise.id)
      ? current
      : [...current, { exercise, notes: "", sets: [emptySet(exercise.id, 1)] }]);
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<TrackerSet>) {
    setEntries((current) => current.map((entry) => entry.exercise.id === exerciseId
      ? { ...entry, sets: entry.sets.map((set) => set.id === setId ? { ...set, ...patch } : set) }
      : entry));
  }

  function addSet(exerciseId: string) {
    setEntries((current) => current.map((entry) => {
      if (entry.exercise.id !== exerciseId) return entry;
      const previous = entry.sets.at(-1);
      return {
        ...entry,
        sets: [...entry.sets, {
          ...emptySet(exerciseId, entry.sets.length + 1),
          weight: previous?.weight ?? "",
          repetitions: previous?.repetitions ?? "",
          rir: previous?.rir ?? "",
        }],
      };
    }));
  }

  const completedSets = entries.reduce(
    (total, entry) => total + entry.sets.filter((set) => set.completed).length,
    0,
  );
  const payload = entries.flatMap((entry) => {
    const sets = entry.sets
      .filter((set) => set.completed)
      .map((set) => ({
        weight: set.weight.trim() ? Number(set.weight) : null,
        repetitions: Number(set.repetitions),
        rir: set.rir.trim() ? Number(set.rir) : null,
        notes: set.notes,
      }));
    return sets.length ? [{ exerciseId: entry.exercise.id, notes: entry.notes, sets }] : [];
  });

  return (
    <>
      <form action={action} className="space-y-4">
        {planItem && (
          <section className="flex items-start gap-3 rounded-[22px] border border-accent/15 bg-accent-soft p-4 text-accent-dark">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white"><Link2 size={17} /></span>
            <div className="min-w-0"><p className="text-[10px] font-bold tracking-wide uppercase">Vinculado al plan</p><p className="mt-1 truncate text-sm font-bold">{formatDayAndDate(planItem.date)} · {planItem.title}</p><p className="mt-1 text-xs opacity-70">Al guardar, esta sesión quedará marcada como completada.</p></div>
          </section>
        )}

        <section className="app-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-warning-soft text-warning"><Clock3 size={19} /></span>
            <div><p className="text-base font-bold">Sesión</p><p className="mt-0.5 text-xs text-muted">Configura la rutina, fecha y unidad.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rutina · opcional">
              <select name="routine_id" value={routineId} onChange={(event) => selectRoutine(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold">
                <option value="">Sesión libre</option>
                {routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
              </select>
            </Field>
            <Field label="Fecha">
              <input name="date" type="date" defaultValue={planItem?.date ?? defaultDate} readOnly={Boolean(planItem)} required className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold read-only:text-muted" />
            </Field>
            <Field label="Duración · minutos">
              <input name="duration_minutes" type="number" min="1" max="1440" inputMode="numeric" placeholder="35" className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50" />
            </Field>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-bold text-muted">Unidad de peso</legend>
            <div className="grid max-w-xs grid-cols-2 rounded-2xl bg-surface-subtle p-1">
              {(["kg", "lbs"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`min-h-10 rounded-xl text-xs font-bold transition-colors ${unit === value ? "bg-white text-ink shadow-sm" : "text-muted"}`}>{value}</button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="space-y-3">
          {entries.map((entry, exerciseIndex) => (
            <article key={entry.exercise.id} className="app-card min-w-0 overflow-hidden">
              <header className="flex min-w-0 items-center gap-3 border-b border-line p-4 sm:px-5">
                <ExerciseArtwork exercise={entry.exercise} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold tracking-wide text-muted uppercase">Ejercicio {exerciseIndex + 1}</p>
                  <h2 className="mt-1 truncate text-sm font-bold sm:text-base">{entry.exercise.nameEs}</h2>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">{entry.exercise.muscleGroup} · {entry.exercise.equipment}</p>
                </div>
                <button type="button" onClick={() => setEntries((current) => current.filter((item) => item.exercise.id !== entry.exercise.id))} className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger" aria-label={`Eliminar ${entry.exercise.nameEs}`}><Trash2 size={16} /></button>
              </header>

              <div className="p-4 sm:p-5">
                <label className="block">
                  <span className="sr-only">Nota de {entry.exercise.nameEs}</span>
                  <input type="text" value={entry.notes} onChange={(event) => setEntries((current) => current.map((item) => item.exercise.id === entry.exercise.id ? { ...item, notes: event.target.value } : item))} placeholder="Nota del ejercicio · técnica, molestia o ajuste" maxLength={500} className="h-10 w-full rounded-xl border border-line bg-surface-subtle px-3 text-xs font-medium placeholder:text-muted/50" />
                </label>

                <div className="mt-4 grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)_2.5rem] gap-2 px-0.5 text-center text-[9px] font-bold tracking-wide text-muted uppercase">
                  <span>Serie</span><span>Peso</span><span>Reps</span><span>RIR</span><span>Listo</span>
                </div>
                <div className="mt-2 space-y-2">
                  {entry.sets.map((set, setIndex) => (
                    <div key={set.id} className={`rounded-2xl border p-2 transition-colors ${set.completed ? "border-success/25 bg-success-soft" : "border-line bg-surface-subtle/70"}`}>
                      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)_2.5rem] items-center gap-2">
                        <button type="button" onClick={() => setEntries((current) => current.map((item) => item.exercise.id === entry.exercise.id ? { ...item, sets: item.sets.filter((row) => row.id !== set.id) } : item))} className="grid size-8 place-items-center rounded-xl text-xs font-bold text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar serie ${setIndex + 1}`}>{setIndex + 1}</button>
                        <NumberInput label={`Peso serie ${setIndex + 1}`} value={set.weight} onChange={(value) => updateSet(entry.exercise.id, set.id, { weight: value })} placeholder="0" step="0.25" />
                        <NumberInput label={`Repeticiones serie ${setIndex + 1}`} value={set.repetitions} onChange={(value) => updateSet(entry.exercise.id, set.id, { repetitions: value })} placeholder="10" />
                        <NumberInput label={`RIR serie ${setIndex + 1}`} value={set.rir} onChange={(value) => updateSet(entry.exercise.id, set.id, { rir: value })} placeholder="2" max="10" />
                        <button type="button" aria-pressed={set.completed} onClick={() => updateSet(entry.exercise.id, set.id, { completed: !set.completed })} className={`grid size-9 place-items-center rounded-xl transition-colors ${set.completed ? "bg-success text-white" : "border border-line bg-white text-muted"}`} aria-label={set.completed ? `Serie ${setIndex + 1} completada` : `Completar serie ${setIndex + 1}`}><Check size={17} /></button>
                      </div>
                      <input type="text" value={set.notes} onChange={(event) => updateSet(entry.exercise.id, set.id, { notes: event.target.value })} placeholder="Nota de la serie · opcional" maxLength={500} className="mt-2 h-9 w-full rounded-xl border border-transparent bg-white/80 px-3 text-[11px] font-medium placeholder:text-muted/45 focus:border-accent/25" />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addSet(entry.exercise.id)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-xs font-bold text-accent hover:bg-accent-soft"><CirclePlus size={17} /> Agregar serie</button>
              </div>
            </article>
          ))}
        </section>

        <button type="button" onClick={() => setPickerOpen(true)} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-[20px] border border-line bg-white px-5 text-sm font-bold text-ink"><Plus size={18} /> Agregar ejercicio</button>

        <section className="app-card p-5 sm:p-6">
          <Field label="Nota general · opcional">
            <textarea name="notes" rows={3} maxLength={2000} placeholder="¿Cómo se sintió la sesión?" className="w-full resize-none rounded-2xl border border-line bg-surface-subtle px-4 py-3 text-sm font-medium placeholder:text-muted/50" />
          </Field>
        </section>

        <input type="hidden" name="training_plan_item_id" value={planItem?.id ?? ""} />
        <input type="hidden" name="unit" value={unit} />
        <input type="hidden" name="session_payload" value={JSON.stringify(payload)} />

        {state.error && (
          <div role="alert" className="flex items-start gap-3 rounded-[20px] border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" /><p>{state.error}</p>
          </div>
        )}

        <div className="sticky bottom-20 z-20 rounded-[22px] border border-line bg-white/92 p-2.5 shadow-[0_12px_40px_rgba(17,17,20,.14)] backdrop-blur-xl lg:bottom-4">
          <button type="submit" disabled={pending || completedSets === 0} className="pressable flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-sm font-bold text-white shadow-[0_8px_22px_rgba(36,120,238,.25)] disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={18} /> {pending ? "Guardando…" : completedSets ? `Guardar ${completedSets} serie${completedSets === 1 ? "" : "s"}` : "Completa una serie"}
          </button>
        </div>
      </form>

      <ExercisePickerModal open={pickerOpen} exercises={exercises} selectedIds={entries.map((entry) => entry.exercise.id)} onSelect={addExercise} onClose={() => setPickerOpen(false)} />
    </>
  );
}

function routineEntries(routine: StrengthRoutine | null): TrackerExercise[] {
  return routine?.exercises.map((entry) => ({
    exercise: entry.exercise,
    notes: entry.notes ?? "",
    sets: [emptySet(entry.exercise.id, 1, "initial")],
  })) ?? [];
}

function emptySet(exerciseId: string, index: number, stableId?: string): TrackerSet {
  const suffix = stableId ?? crypto.randomUUID();
  return { id: `${exerciseId}-${index}-${suffix}`, weight: "", repetitions: "", rir: "", notes: "", completed: false };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-xs font-bold text-muted">{label}</span>{children}</label>;
}

function NumberInput({ label, value, onChange, placeholder, step = "1", max }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; step?: string; max?: string }) {
  return <input aria-label={label} type="number" min="0" max={max} step={step} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 min-w-0 w-full rounded-xl border border-line bg-white px-1.5 text-center text-sm font-bold placeholder:text-muted/35" />;
}
