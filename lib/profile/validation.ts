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
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
