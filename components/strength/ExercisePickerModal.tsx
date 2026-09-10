"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { ExerciseArtwork } from "@/components/strength/ExerciseArtwork";
import { equipmentOptions, muscleGroupOptions } from "@/lib/strength/constants";
import type { Equipment, Exercise, MuscleGroup } from "@/types/training";

interface ExercisePickerModalProps {
  open: boolean;
  exercises: Exercise[];
  selectedIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePickerModal({
  open,
  exercises,
  selectedIds,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const filtered = useMemo(() => {
    const query = normalize(search);
    return exercises.filter((exercise) => {
      const matchesSearch = !query || normalize(`${exercise.nameEs} ${exercise.name}`).includes(query);
      const matchesMuscle = muscle === "all" || exercise.muscleGroup === muscle;
      const matchesEquipment = equipment === "all" || exercise.equipment === equipment;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [equipment, exercises, muscle, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[86vh] sm:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="exercise-picker-title" className="mt-2 text-xl font-bold tracking-[-0.03em]">Agregar ejercicio</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl bg-surface-subtle text-muted" aria-label="Cerrar selector">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-3 border-b border-line p-4 sm:p-5">
          <label className="relative block">
            <Search size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <span className="sr-only">Buscar ejercicio</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar ejercicio"
              autoFocus
              className="h-12 w-full rounded-2xl border border-line bg-surface-subtle pr-4 pl-11 text-sm font-semibold placeholder:text-muted/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <FilterSelect label="Grupo muscular" value={muscle} onChange={(value) => setMuscle(value as MuscleGroup | "all")}>
              <option value="all">Todos los músculos</option>
              {muscleGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </FilterSelect>
            <FilterSelect label="Equipamiento" value={equipment} onChange={(value) => setEquipment(value as Equipment | "all")}>
              <option value="all">Todo el equipo</option>
              {equipmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </FilterSelect>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <p className="mb-3 text-[10px] font-bold tracking-wide text-muted uppercase">{filtered.length} ejercicios</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((exercise) => {
              const selected = selectedIds.includes(exercise.id);
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onSelect(exercise)}
                  disabled={selected}
                  className={`flex min-w-0 items-center gap-3 rounded-[18px] border p-3 text-left transition-colors ${selected ? "border-success/20 bg-success-soft" : "border-line hover:border-accent/30 hover:bg-accent-soft/45"}`}
                >
                  <ExerciseArtwork exercise={exercise} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{exercise.nameEs}</span>
                    <span className="mt-1 block truncate text-[10px] font-semibold text-muted">{exercise.muscleGroup} · {exercise.equipment}</span>
                  </span>
                  {selected && <Check size={17} className="shrink-0 text-success" />}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center"><p className="text-sm font-bold">Sin resultados</p><p className="mt-1 text-xs text-muted">Prueba otro nombre o elimina un filtro.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-xs font-bold">
        {children}
      </select>
    </label>
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

