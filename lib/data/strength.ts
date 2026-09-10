import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { DataAccessError } from "@/lib/data/errors";
import { getTodayIso } from "@/lib/date";
import { kilogramsFromSet } from "@/lib/strength/constants";
import { hasStrengthComponent } from "@/lib/training/planComponents";
import { createClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import type {
  Exercise,
  RoutineExercise,
  StrengthProgressPoint,
  StrengthRoutine,
  StrengthSession,
  StrengthSessionExercise,
  StrengthSet,
  TrainingPlanItem,
} from "@/types/training";
import { mapTrainingPlanItem } from "@/lib/data/mappers";

export const getExerciseLibrary = cache(async (): Promise<Exercise[]> => {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .order("name_es");

  if (error) throw new DataAccessError("No pudimos cargar el catálogo de ejercicios.");
  return (data ?? []).map(mapExercise);
});

export const getStrengthRoutines = cache(async (): Promise<StrengthRoutine[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: routineRows, error } = await supabase
    .from("strength_routines")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new DataAccessError("No pudimos cargar tus rutinas de fuerza.");
  if (!routineRows?.length) return [];

  const routineIds = routineRows.map((row) => row.id);
  const { data: relationRows, error: relationsError } = await supabase
    .from("routine_exercises")
    .select("*")
    .in("routine_id", routineIds)
    .order("order_number");

  if (relationsError) throw new DataAccessError("No pudimos cargar los ejercicios de tus rutinas.");
  const exerciseIds = Array.from(new Set((relationRows ?? []).map((row) => row.exercise_id)));
  const exercises = await getExercisesByIds(exerciseIds);
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  return routineRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    exercises: (relationRows ?? [])
      .filter((relation) => relation.routine_id === row.id)
      .map((relation): RoutineExercise | null => {
        const exercise = byId.get(relation.exercise_id);
        if (!exercise) return null;
        return {
          id: relation.id,
          routineId: relation.routine_id,
          exerciseId: relation.exercise_id,
          orderNumber: relation.order_number,
          notes: relation.notes,
          exercise,
        };
      })
      .filter((exercise): exercise is RoutineExercise => exercise !== null),
  }));
});

export const getStrengthHistory = cache(async (limit = 30): Promise<StrengthSession[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: sessionRows, error } = await supabase
    .from("strength_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DataAccessError("No pudimos cargar el historial de fuerza.");
  if (!sessionRows?.length) return [];

  const sessionIds = sessionRows.map((row) => row.id);
  const routineIds = Array.from(
    new Set(sessionRows.map((row) => row.routine_id).filter((id): id is string => Boolean(id))),
  );
  const [{ data: sessionExerciseRows, error: exerciseError }, { data: setRows, error: setError }, routineResult] = await Promise.all([
    supabase.from("strength_session_exercises").select("*").in("session_id", sessionIds).order("order_number"),
    supabase.from("strength_sets").select("*").in("session_id", sessionIds).order("set_number"),
    routineIds.length
      ? supabase.from("strength_routines").select("id,name").eq("user_id", user.id).in("id", routineIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (exerciseError || setError || routineResult.error) {
    throw new DataAccessError("No pudimos completar el historial de fuerza.");
  }

  const exerciseIds = Array.from(new Set((sessionExerciseRows ?? []).map((row) => row.exercise_id)));
  const exercises = await getExercisesByIds(exerciseIds);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const routineById = new Map((routineResult.data ?? []).map((routine) => [routine.id, routine.name]));

  return sessionRows.map((session) => {
    const sessionExercises = (sessionExerciseRows ?? [])
      .filter((row) => row.session_id === session.id)
      .map((row): StrengthSessionExercise | null => {
        const exercise = exerciseById.get(row.exercise_id);
        if (!exercise) return null;
        const sets = (setRows ?? [])
          .filter((set) => set.session_id === session.id && set.exercise_id === row.exercise_id)
          .map(mapStrengthSet);
        return {
          id: row.id,
          sessionId: row.session_id,
          exerciseId: row.exercise_id,
          orderNumber: row.order_number,
          notes: row.notes,
          exercise,
          sets,
        };
      })
      .filter((exercise): exercise is StrengthSessionExercise => exercise !== null);
    const sets = sessionExercises.flatMap((exercise) => exercise.sets);

    return {
      id: session.id,
      routineId: session.routine_id,
      routineName: session.routine_id ? routineById.get(session.routine_id) ?? null : null,
      trainingPlanItemId: session.training_plan_item_id,
      date: session.date,
      durationMinutes: session.duration_minutes,
      unit: session.unit as StrengthSession["unit"],
      notes: session.notes,
      createdAt: session.created_at,
      exercises: sessionExercises,
      exerciseCount: sessionExercises.length,
      setCount: sets.length,
      totalVolumeKg: sets.reduce(
        (total, set) => total + kilogramsFromSet(set.weightKg, set.weightLbs) * set.repetitions,
        0,
      ),
    };
  });
});

export async function getLatestStrengthSession(): Promise<StrengthSession | null> {
  return (await getStrengthHistory(1))[0] ?? null;
}

export const getRecordedStrengthPlanItemIds = cache(async (): Promise<string[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("strength_sessions")
    .select("training_plan_item_id")
    .eq("user_id", user.id)
    .not("training_plan_item_id", "is", null);

  if (error) throw new DataAccessError("No pudimos comprobar las sesiones de fuerza registradas.");
  return Array.from(new Set(
    (data ?? []).flatMap((row) => row.training_plan_item_id ? [row.training_plan_item_id] : []),
  ));
});

export const getNextStrengthPlanItem = cache(async (): Promise<TrainingPlanItem | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data, error }, recordedPlanItemIds] = await Promise.all([
    supabase
      .from("training_plan_items")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", getTodayIso())
      .neq("status", "skipped")
      .order("date"),
    getRecordedStrengthPlanItemIds(),
  ]);

  if (error) throw new DataAccessError("No pudimos cargar el próximo gimnasio del plan.");
  const recordedIds = new Set(recordedPlanItemIds);
  return (data ?? [])
    .map(mapTrainingPlanItem)
    .find((item) => hasStrengthComponent(item) && !recordedIds.has(item.id)) ?? null;
});

export async function getStrengthPlanItem(id: string | null): Promise<TrainingPlanItem | null> {
  if (!id) return null;
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plan_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new DataAccessError("No pudimos comprobar la sesión del plan.");
  if (!data) return null;
  const item = mapTrainingPlanItem(data);
  return hasStrengthComponent(item) ? item : null;
}

export async function getStrengthProgress(exerciseId: string): Promise<StrengthProgressPoint[]> {
  const history = await getStrengthHistory(150);
  return history
    .flatMap((session) => {
      const entry = session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
      if (!entry?.sets.length) return [];
      const weights = entry.sets.map((set) => kilogramsFromSet(set.weightKg, set.weightLbs));
      const maximumKg = Math.max(...weights);
      const volumeKg = entry.sets.reduce(
        (total, set) => total + kilogramsFromSet(set.weightKg, set.weightLbs) * set.repetitions,
        0,
      );
      const bestSet = [...entry.sets].sort((a, b) => {
        const weightDifference = kilogramsFromSet(b.weightKg, b.weightLbs) - kilogramsFromSet(a.weightKg, a.weightLbs);
        return weightDifference || b.repetitions - a.repetitions;
      })[0];
      return [{
        sessionId: session.id,
        date: session.date,
        maximumKg,
        volumeKg,
        maximumRepetitions: Math.max(...entry.sets.map((set) => set.repetitions)),
        bestSet: `${kilogramsFromSet(bestSet.weightKg, bestSet.weightLbs).toFixed(1)} kg × ${bestSet.repetitions}`,
      }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercise_library").select("*").in("id", ids);
  if (error) throw new DataAccessError("No pudimos cargar algunos ejercicios.");
  return (data ?? []).map(mapExercise);
}

function mapExercise(row: TableRow<"exercise_library">): Exercise {
  return {
    id: row.id,
    name: row.name,
    nameEs: row.name_es,
    category: row.category as Exercise["category"],
    muscleGroup: row.muscle_group as Exercise["muscleGroup"],
    equipment: row.equipment as Exercise["equipment"],
    imageUrl: row.image_url,
    description: row.description,
  };
}

function mapStrengthSet(row: TableRow<"strength_sets">): StrengthSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    weightLbs: row.weight_lbs === null ? null : Number(row.weight_lbs),
    repetitions: row.repetitions,
    rir: row.rir,
    notes: row.notes,
  };
}
