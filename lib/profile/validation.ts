import { z } from "zod";
import { getTodayIso } from "@/lib/date";
import { calculateAge } from "@/lib/profile/calculateAge";

export const profileInputSchema = z.object({
  name: z
    .string({ error: "Escribe tu nombre." })
    .trim()
    .min(2, "Escribe tu nombre.")
    .max(100, "El nombre es demasiado largo."),
  date_of_birth: z
    .string({ error: "Selecciona tu fecha de nacimiento." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
    .refine((value) => {
      try {
        const age = calculateAge(value);
        return value <= getTodayIso() && age >= 1 && age <= 120;
      } catch {
        return false;
      }
    }, "La fecha de nacimiento no es válida."),
  weight_kg: z.coerce
    .number()
    .positive("El peso debe ser mayor a cero.")
    .max(500, "Revisa el peso capturado."),
  sex: z.enum(["male", "female", "prefer_not_to_say"], {
    error: "Selecciona una opción.",
  }),
  goal_event_name: z
    .string({ error: "Escribe el nombre de tu evento." })
    .trim()
    .min(2, "Escribe el nombre de tu evento.")
    .max(120, "El nombre del evento es demasiado largo."),
  goal_event_distance_km: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce
      .number({ error: "Escribe una distancia válida." })
      .positive("La distancia debe ser mayor a cero.")
      .max(1000, "La distancia debe ser menor a 1,000 km."),
  ),
  goal_event_date: z
    .string({ error: "Selecciona la fecha del evento." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
    .refine(isValidIsoDate, "Selecciona una fecha válida."),
  goal_event_location: optionalProfileText(120, "El lugar es demasiado largo."),
  goal_event_objective: optionalProfileText(240, "El objetivo es demasiado largo."),
  strength_unit: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "kg" : value,
    z.enum(["kg", "lbs"], { error: "Selecciona kg o lbs." }),
  ),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

function optionalProfileText(maxLength: number, message: string) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string({ error: message }).trim().max(maxLength, message).optional(),
  ).transform((value) => value ?? null);
}

function isValidIsoDate(value: string): boolean {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
