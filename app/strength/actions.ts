"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { mapTrainingPlanItem } from "@/lib/data/mappers";
import { syncTrainingPlanItemStatus } from "@/lib/data/planStatus";
import { createClient } from "@/lib/supabase/server";
import { hasStrengthComponent } from "@/lib/training/planComponents";
import type { TableInsert } from "@/types/database";

export interface StrengthActionState {
  error?: string;
}

const nullableText = (maximum: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(maximum).nullable(),
  );

const nullableNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => value === "" || value === null || value === undefined ? null : Number(value),
    schema.nullable(),
  );

const routineExerciseSchema = z.object({
  exerciseId: z.uuid(),
  notes: nullableText(500),
});

const routineSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre para la rutina.").max(100),
  description: nullableText(500),
  exercises: z.array(routineExerciseSchema).min(1, "Agrega al menos un ejercicio.").max(30),
}).superRefine((value, context) => {
  if (new Set(value.exercises.map((exercise) => exercise.exerciseId)).size !== value.exercises.length) {
    context.addIssue({ code: "custom", message: "No puedes repetir ejercicios en la rutina." });
  }
});

const setSchema = z.object({
  weight: nullableNumber(z.number().positive().max(10000)),
  repetitions: z.coerce.number().int().positive().max(1000),
  rir: nullableNumber(z.number().int().min(0).max(10)),
  notes: nullableText(500),
});

const sessionExerciseSchema = z.object({
  exerciseId: z.uuid(),
  notes: nullableText(500),
  sets: z.array(setSchema).min(1).max(30),
});

const sessionSchema = z.object({
  routineId: z.preprocess((value) => value === "" ? null : value, z.uuid().nullable()),
  trainingPlanItemId: z.preprocess((value) => value === "" ? null : value, z.uuid().nullable()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida."),
  durationMinutes: nullableNumber(z.number().int().positive().max(1440)),
  unit: z.enum(["kg", "lbs"]),
  notes: nullableText(2000),
  exercises: z.array(sessionExerciseSchema).min(1, "Completa al menos una serie.").max(30),
}).superRefine((value, context) => {
  if (new Set(value.exercises.map((exercise) => exercise.exerciseId)).size !== value.exercises.length) {
    context.addIssue({ code: "custom", message: "No puedes repetir ejercicios en la sesión." });
  }
});

export async function createStrengthRoutine(
  _previousState: StrengthActionState,
  formData: FormData,
): Promise<StrengthActionState> {
  const payload = parseJson(formData.get("exercise_payload"));
  const parsed = routineSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    exercises: payload,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la rutina." };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const exerciseIds = parsed.data.exercises.map((exercise) => exercise.exerciseId);
  const { data: allowedExercises, error: libraryError } = await supabase
    .from("exercise_library")
    .select("id")
    .in("id", exerciseIds);

  if (libraryError || allowedExercises?.length !== exerciseIds.length) {
    return { error: "Uno de los ejercicios ya no está disponible." };
  }

  const routine: TableInsert<"strength_routines"> = {
    user_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description,
  };
  const { data: created, error } = await supabase
    .from("strength_routines")
    .insert(routine)
    .select("id")
    .single();

  if (error || !created) return { error: "No pudimos crear la rutina." };

  const relations: TableInsert<"routine_exercises">[] = parsed.data.exercises.map(
    (exercise, index) => ({
      routine_id: created.id,
      exercise_id: exercise.exerciseId,
      order_number: index + 1,
      notes: exercise.notes,
    }),
  );
  const { error: relationError } = await supabase.from("routine_exercises").insert(relations);

  if (relationError) {
    await supabase.from("strength_routines").delete().eq("id", created.id).eq("user_id", user.id);
    return { error: "No pudimos agregar los ejercicios a la rutina." };
  }

  revalidateStrengthPaths();
  redirect("/strength?created=routine");
}

export async function saveStrengthSession(
  _previousState: StrengthActionState,
  formData: FormData,
): Promise<StrengthActionState> {
  const payload = parseJson(formData.get("session_payload"));
  const parsed = sessionSchema.safeParse({
    routineId: formData.get("routine_id"),
    trainingPlanItemId: formData.get("training_plan_item_id"),
    date: formData.get("date"),
    durationMinutes: formData.get("duration_minutes"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
    exercises: payload,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa las series capturadas." };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const values = parsed.data;
  let sessionDate = values.date;

  if (values.routineId) {
    const { data: routine, error } = await supabase
      .from("strength_routines")
      .select("id")
      .eq("id", values.routineId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !routine) return { error: "La rutina seleccionada no está disponible." };
  }

  if (values.trainingPlanItemId) {
    const { data: planItem, error } = await supabase
      .from("training_plan_items")
      .select("*")
      .eq("id", values.trainingPlanItemId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (
      error
      || !planItem
      || planItem.status === "skipped"
      || !hasStrengthComponent(mapTrainingPlanItem(planItem))
    ) {
      return { error: "La sesión del plan no incluye trabajo de fuerza." };
    }
    sessionDate = planItem.date;
  }

  const exerciseIds = values.exercises.map((exercise) => exercise.exerciseId);
  const { data: allowedExercises, error: libraryError } = await supabase
    .from("exercise_library")
    .select("id")
    .in("id", exerciseIds);
  if (libraryError || allowedExercises?.length !== exerciseIds.length) {
    return { error: "Uno de los ejercicios ya no está disponible." };
  }

  const session: TableInsert<"strength_sessions"> = {
    user_id: user.id,
    routine_id: values.routineId,
    training_plan_item_id: values.trainingPlanItemId,
    date: sessionDate,
    duration_minutes: values.durationMinutes,
    unit: values.unit,
    notes: values.notes,
  };
  const { data: created, error: sessionError } = await supabase
    .from("strength_sessions")
    .insert(session)
    .select("id")
    .single();

  if (sessionError || !created) {
    return {
      error: sessionError?.code === "23505"
        ? "Esta sesión del plan ya tiene un registro de fuerza."
        : "No pudimos guardar la sesión de fuerza.",
    };
  }

  const sessionExercises: TableInsert<"strength_session_exercises">[] = values.exercises.map(
    (exercise, index) => ({
      session_id: created.id,
      exercise_id: exercise.exerciseId,
      order_number: index + 1,
      notes: exercise.notes,
    }),
  );
  const { error: exerciseError } = await supabase
    .from("strength_session_exercises")
    .insert(sessionExercises);

  if (exerciseError) {
    await removeIncompleteSession(created.id, user.id);
    return { error: "No pudimos guardar los ejercicios de la sesión." };
  }

  const sets: TableInsert<"strength_sets">[] = values.exercises.flatMap((exercise) =>
    exercise.sets.map((set, index) => ({
      session_id: created.id,
      exercise_id: exercise.exerciseId,
      set_number: index + 1,
      weight_kg: values.unit === "kg" ? set.weight : null,
      weight_lbs: values.unit === "lbs" ? set.weight : null,
      repetitions: set.repetitions,
      rir: set.rir,
      notes: set.notes,
    })),
  );
  const { error: setsError } = await supabase.from("strength_sets").insert(sets);

  if (setsError) {
    await removeIncompleteSession(created.id, user.id);
    return { error: "No pudimos guardar las series. Revisa peso, repeticiones y RIR." };
  }

  if (values.trainingPlanItemId) {
    try {
      await syncTrainingPlanItemStatus({
        supabase,
        userId: user.id,
        planItemId: values.trainingPlanItemId,
      });
    } catch {
      await removeIncompleteSession(created.id, user.id);
      return { error: "No pudimos vincular la sesión con tu plan." };
    }
  }

  revalidateStrengthPaths();
  redirect("/strength/history?saved=1");

  async function removeIncompleteSession(sessionId: string, userId: string) {
    await supabase.from("strength_sessions").delete().eq("id", sessionId).eq("user_id", userId);
  }
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function revalidateStrengthPaths() {
  revalidatePath("/strength", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/plan");
  revalidatePath("/workouts");
}
