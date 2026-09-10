import type { EffortType } from "@/types/training";

export interface EffortTypeDefinition {
  value: EffortType;
  label: string;
  description: string;
  approxRpe: string | null;
  badgeClassName: string;
}

export const effortTypes: ReadonlyArray<EffortTypeDefinition> = [
  {
    value: "recovery",
    label: "Recovery",
    description: "Trote de recuperación, súper tranquilo.",
    approxRpe: "RPE 2–3/10",
    badgeClassName: "bg-success-soft text-success",
  },
  {
    value: "easy",
    label: "Easy",
    description: "Carrera cómoda, puedes hablar sin problema.",
    approxRpe: "RPE 3–4/10",
    badgeClassName: "bg-emerald-50 text-emerald-700",
  },
  {
    value: "steady_moderate",
    label: "Steady / Moderate",
    description: "Más rápido que easy, pero todavía controlado.",
    approxRpe: "RPE 5–6/10",
    badgeClassName: "bg-amber-50 text-amber-700",
  },
  {
    value: "tempo_threshold",
    label: "Tempo / Threshold",
    description: "Ritmo fuerte sostenido.",
    approxRpe: "RPE 7–8/10",
    badgeClassName: "bg-rose-50 text-rose-700",
  },
  {
    value: "intervals_speed",
    label: "Intervals / Speed",
    description: "Repeticiones rápidas con descansos.",
    approxRpe: "RPE 8–9/10",
    badgeClassName: "bg-red-50 text-red-700",
  },
  {
    value: "long_run",
    label: "Long Run",
    description: "Carrera larga; normalmente predominantemente fácil.",
    approxRpe: "RPE 3–5/10",
    badgeClassName: "bg-orange-50 text-orange-700",
  },
  {
    value: "rest",
    label: "Rest",
    description: "Descanso total.",
    approxRpe: null,
    badgeClassName: "bg-slate-100 text-slate-600",
  },
];

export function getEffortTypeDefinition(
  value: EffortType,
): EffortTypeDefinition {
  const definition = effortTypes.find((item) => item.value === value);
  if (!definition) throw new Error(`Tipo de esfuerzo desconocido: ${value}`);
  return definition;
}

export function inferEffortType(title: string): EffortType | null {
  const normalized = normalize(title);

  if (
    /gimnasio|fuerza/.test(normalized) &&
    (/descanso de carrera/.test(normalized) || !/suave|carrera|trote/.test(normalized))
  ) {
    return null;
  }
  if (/tirada|larga|maraton gdl/.test(normalized)) return "long_run";
  if (/interval|velocidad|repeticiones/.test(normalized)) return "intervals_speed";
  if (/tempo/.test(normalized)) return "tempo_threshold";
  if (/progresivo|ritmo maraton/.test(normalized)) return "steady_moderate";
  if (/recuperacion|shakeout/.test(normalized)) return "recovery";
  if (/suave|activacion/.test(normalized)) return "easy";
  if (/descanso/.test(normalized)) return "rest";
  return null;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
