"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Dumbbell, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { createStrengthRoutine, type StrengthActionState } from "@/app/strength/actions";
import { ExerciseArtwork } from "@/components/strength/ExerciseArtwork";
import { ExercisePickerModal } from "@/components/strength/ExercisePickerModal";
import type { Exercise } from "@/types/training";

interface SelectedExercise {
  exercise: Exercise;
  notes: string;
}

const initialState: StrengthActionState = {};

export function RoutineBuilder({
  exercises,
  defaultName = "",
  defaultDescription = "",
  initialExerciseIds = [],
}: {
  exercises: Exercise[];
  defaultName?: string;
  defaultDescription?: string;
  initialExerciseIds?: string[];
}) {
  const [state, action, pending] = useActionState(createStrengthRoutine, initialState);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise[]>(() =>
    initialExerciseIds.flatMap((id) => {
      const exercise = exercises.find((item) => item.id === id);
      return exercise ? [{ exercise, notes: "" }] : [];
    }),
  );

  function addExercise(exercise: Exercise) {
    setSelected((current) => current.some((item) => item.exercise.id === exercise.id)
      ? current
      : [...current, { exercise, notes: "" }]);
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setSelected((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <>
      <form action={action} className="space-y-4">
        <section className="app-card p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-warning-soft text-warning"><Dumbbell size={19} /></span>
            <div><p className="text-base font-bold">Datos de la rutina</p><p className="mt-0.5 text-xs text-muted">Un nombre corto te ayudará a encontrarla rápido.</p></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre">
              <input name="name" type="text" defaultValue={defaultName} placeholder="Fuerza A" maxLength={100} required className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50" />
            </Field>
            <Field label="Descripción · opcional">
              <input name="description" type="text" defaultValue={defaultDescription} placeholder="Pierna y core para correr" maxLength={500} className="h-12 w-full rounded-2xl border border-line bg-surface-subtle px-4 text-sm font-semibold placeholder:text-muted/50" />
            </Field>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line p-5 sm:px-6">
            <div><p className="text-base font-bold">Ejercicios</p><p className="mt-0.5 text-xs text-muted">{selected.length || "Ningún"} ejercicio{selected.length === 1 ? "" : "s"}</p></div>
            <button type="button" onClick={() => setPickerOpen(true)} className="pressable flex min-h-11 items-center gap-2 rounded-2xl bg-accent px-4 text-xs font-bold text-white">
              <Plus size={17} /> Agregar
            </button>
          </header>

          {selected.length ? (
            <div className="divide-y divide-line px-4 sm:px-5">
              {selected.map((item, index) => (
                <article key={item.exercise.id} className="min-w-0 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ExerciseArtwork exercise={item.exercise} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold">{item.exercise.nameEs}</h2>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">{item.exercise.muscleGroup} · {item.exercise.equipment}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton label="Subir ejercicio" disabled={index === 0} onClick={() => moveExercise(index, -1)}><ArrowUp size={15} /></IconButton>
                      <IconButton label="Bajar ejercicio" disabled={index === selected.length - 1} onClick={() => moveExercise(index, 1)}><ArrowDown size={15} /></IconButton>
                      <IconButton label="Eliminar ejercicio" danger onClick={() => setSelected((current) => current.filter((entry) => entry.exercise.id !== item.exercise.id))}><Trash2 size={15} /></IconButton>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(event) => setSelected((current) => current.map((entry) => entry.exercise.id === item.exercise.id ? { ...entry, notes: event.target.value } : entry))}
                    placeholder="Nota para este ejercicio · opcional"
                    maxLength={500}
                    className="mt-3 h-10 w-full rounded-xl border border-line bg-surface-subtle px-3 text-xs font-medium placeholder:text-muted/50"
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center"><Dumbbell size={25} className="mx-auto text-muted/40" /><p className="mt-3 text-sm font-bold">Arma tu primera secuencia</p><p className="mt-1 text-xs text-muted">Busca ejercicios y ordénalos como los realizarás.</p></div>
          )}
        </section>

        <input type="hidden" name="exercise_payload" value={JSON.stringify(selected.map((item) => ({ exerciseId: item.exercise.id, notes: item.notes })))} />

        {state.error && (
          <div role="alert" className="flex items-start gap-3 rounded-[20px] border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" /><p>{state.error}</p>
          </div>
        )}

        <button type="submit" disabled={pending || selected.length === 0} className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-ink px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit sm:min-w-64">
          <Save size={18} /> {pending ? "Guardando…" : "Guardar rutina"}
        </button>
      </form>

      <ExercisePickerModal open={pickerOpen} exercises={exercises} selectedIds={selected.map((item) => item.exercise.id)} onSelect={addExercise} onClose={() => setPickerOpen(false)} />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-muted">{label}</span>{children}</label>;
}

function IconButton({ label, disabled, danger = false, onClick, children }: { label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} aria-label={label} className={`grid size-9 place-items-center rounded-xl disabled:opacity-25 ${danger ? "bg-danger-soft text-danger" : "bg-surface-subtle text-muted"}`}>{children}</button>;
}

