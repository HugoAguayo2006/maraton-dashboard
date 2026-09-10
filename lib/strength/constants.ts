import type {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
  StrengthUnit,
} from "@/types/training";

export const categoryOptions: readonly { value: ExerciseCategory; label: string }[] = [
  { value: "upper_body", label: "Tren superior" },
  { value: "lower_body", label: "Tren inferior" },
  { value: "other", label: "Otros" },
];

export const muscleGroupOptions: readonly MuscleGroup[] = [
  "Pecho",
  "Espalda",
  "Bíceps",
  "Tríceps",
  "Hombros",
  "Trapecio",
  "Antebrazo",
  "Abdominales",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteos",
  "Pantorrillas",
  "Aductores",
  "Abductores",
  "Cardio",
  "Full Body",
  "Movilidad",
];

export const equipmentOptions: readonly Equipment[] = [
  "Ninguno",
  "Barra",
  "Mancuerna",
  "Máquina",
  "Polea",
  "Kettlebell",
  "Banda",
  "Disco",
];

export function kilogramsFromSet(
  weightKg: number | null,
  weightLbs: number | null,
): number {
  if (weightKg !== null) return weightKg;
  if (weightLbs !== null) return weightLbs * 0.45359237;
  return 0;
}

export function convertKilograms(value: number, unit: StrengthUnit): number {
  return unit === "lbs" ? value * 2.20462262 : value;
}

export function formatStrengthValue(value: number, maximumDecimals = 1): string {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: maximumDecimals,
  }).format(value);
}

