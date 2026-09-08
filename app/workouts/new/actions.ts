"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DataAccessError } from "@/lib/data/errors";
import { createWorkoutLog } from "@/lib/data/workouts";

export interface WorkoutActionState {
  error?: string;
}

const nullableNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => value === "" || value === null ? null : Number(value),
    schema.nullable(),
  );

const nullableText = (maximum: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(maximum).nullable(),
  );

const workoutSchema = z.object({
  training_plan_item_id: z.preprocess(
    (value) => value === "" ? null : value,
    z.uuid().nullable(),
  ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida."),
  distance: z.coerce.number().positive("La distancia debe ser mayor a cero.").max(100),
  hours: z.coerce.number().int().min(0).max(24),
  minutes: z.coerce.number().int().min(0).max(59),
  seconds: z.coerce.number().int().min(0).max(59),
  rpe: z.coerce.number().int().min(1).max(10),
  pain: z.coerce.number().int().min(0).max(10),
  fatigue: nullableNumber(z.number().int().min(0).max(10)),
  sleep_hours: nullableNumber(z.number().min(0).max(24)),
  average_heart_rate: nullableNumber(z.number().int().min(30).max(250)),
  max_heart_rate: nullableNumber(z.number().int().min(30).max(260)),
  gastrointestinal_symptoms: z.enum(["none", "mild", "moderate", "severe"]).nullable(),
  pre_run_food: nullableText(500),
  hydration: nullableText(500),
  gels: nullableText(200),
  notes: nullableText(2000),
});

export async function createWorkout(
  _previousState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  const parsed = workoutSchema.safeParse({
    training_plan_item_id: formData.get("training_plan_item_id"),
    date: formData.get("date"),
    distance: formData.get("distance"),
    hours: formData.get("hours"),
    minutes: formData.get("minutes"),
    seconds: formData.get("seconds"),
    rpe: formData.get("rpe"),
    pain: formData.get("pain"),
    fatigue: formData.get("fatigue"),
    sleep_hours: formData.get("sleep_hours"),
    average_heart_rate: formData.get("average_heart_rate"),
    max_heart_rate: formData.get("max_heart_rate"),
    gastrointestinal_symptoms: formData.get("gastrointestinal_symptoms"),
    pre_run_food: formData.get("pre_run_food"),
    hydration: formData.get("hydration"),
    gels: formData.get("gels"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario." };
  }

  const values = parsed.data;
  const durationSeconds = values.hours * 3600 + values.minutes * 60 + values.seconds;

  if (durationSeconds <= 0) return { error: "La duración debe ser mayor a cero." };
  if (
    values.average_heart_rate !== null &&
    values.max_heart_rate !== null &&
    values.average_heart_rate > values.max_heart_rate
  ) {
    return { error: "La frecuencia promedio no puede superar la máxima." };
  }

  try {
    await createWorkoutLog({
      trainingPlanItemId: values.training_plan_item_id,
      date: values.date,
      distanceKm: values.distance,
      durationSeconds,
      averagePaceSeconds: Math.round(durationSeconds / values.distance),
      rpe: values.rpe,
      pain: values.pain,
      fatigue: values.fatigue,
      sleepHours: values.sleep_hours,
      averageHr: values.average_heart_rate,
      maxHr: values.max_heart_rate,
      giSymptoms: values.gastrointestinal_symptoms,
      foodBefore: values.pre_run_food,
      hydration: values.hydration,
      gels: values.gels,
      notes: values.notes,
    });
  } catch (error) {
    return {
      error: error instanceof DataAccessError
        ? error.message
        : "No pudimos guardar el entrenamiento. Intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/dashboard");
}
