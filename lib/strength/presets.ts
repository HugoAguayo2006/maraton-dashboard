export type StrengthPresetId = "a" | "b" | "light";

export interface StrengthPreset {
  id: StrengthPresetId;
  name: string;
  description: string;
  exerciseNames: readonly string[];
}

export const strengthPresets: readonly StrengthPreset[] = [
  {
    id: "a",
    name: "Fuerza A",
    description: "Pierna, pantorrilla y core con 2–3 repeticiones en reserva.",
    exerciseNames: [
      "Sentadilla goblet",
      "Peso muerto rumano",
      "Sentadilla búlgara",
      "Elevación de pantorrilla de pie",
      "Plancha",
    ],
  },
  {
    id: "b",
    name: "Fuerza B",
    description: "Trabajo unilateral, cadena posterior y estabilidad para correr.",
    exerciseNames: [
      "Step-up",
      "Hip thrust con barra",
      "Peso muerto rumano",
      "Elevación de pantorrilla sentado",
      "Dead bug",
    ],
  },
  {
    id: "light",
    name: "Fuerza ligera",
    description: "Mantenimiento con carga moderada para terminar fresco y sin agujetas.",
    exerciseNames: [
      "Sentadilla goblet",
      "Peso muerto rumano",
      "Sentadilla búlgara",
      "Elevación de pantorrilla de pie",
      "Dead bug",
    ],
  },
] as const;

export function getStrengthPreset(value: string | undefined): StrengthPreset | null {
  return strengthPresets.find((preset) => preset.id === value) ?? null;
}

