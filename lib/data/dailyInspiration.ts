import "server-only";

import { getTodayIso } from "@/lib/date";

const shortVerses = [
  { path: "filipenses/4/13", reference: "Filipenses 4:13" },
  { path: "salmos/56/3", reference: "Salmos 56:3" },
  { path: "1-tesalonicenses/5/16", reference: "1 Tesalonicenses 5:16" },
  { path: "proverbios/16/3", reference: "Proverbios 16:3" },
  { path: "salmos/23/1", reference: "Salmos 23:1" },
  { path: "salmos/37/5", reference: "Salmos 37:5" },
  { path: "salmos/46/1", reference: "Salmos 46:1" },
  { path: "salmos/118/24", reference: "Salmos 118:24" },
  { path: "salmos/119/105", reference: "Salmos 119:105" },
  { path: "romanos/12/12", reference: "Romanos 12:12" },
  { path: "1-tesalonicenses/5/17", reference: "1 Tesalonicenses 5:17" },
  { path: "2-timoteo/1/7", reference: "2 Timoteo 1:7" },
] as const;

const fallbackMessages = [
  "Hoy no necesitas hacerlo perfecto; solo necesitas dar el siguiente paso.",
  "La constancia de hoy construye la fortaleza que necesitarás mañana.",
  "Corre el kilómetro en el que estás y deja que los demás lleguen a su tiempo.",
  "Descansar también es entrenar cuando forma parte del plan.",
  "Cada sesión completada es una promesa que cumples contigo.",
  "Tu progreso no siempre hace ruido, pero cada día constante cuenta.",
  "Confía en el proceso: la meta se alcanza un entrenamiento a la vez.",
] as const;

export interface DailyInspiration {
  text: string;
  attribution: string;
  kind: "verse" | "quote";
}

interface VerseOfTheDayResponse {
  data?: {
    text?: unknown;
  };
}

export async function getDailyInspiration(date = getTodayIso()): Promise<DailyInspiration> {
  const verse = getDailyVerse(date);

  try {
    const response = await fetch(`https://api.midvash.com/v1/ntv/${verse.path}`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(2_500),
    });

    if (!response.ok) return getFallbackMessage(date);

    const payload = await response.json() as VerseOfTheDayResponse;
    const text = normalizeText(payload.data?.text);

    if (!text || text.length > 150) return getFallbackMessage(date);

    return {
      text,
      attribution: `${verse.reference} · NTV`,
      kind: "verse",
    };
  } catch {
    return getFallbackMessage(date);
  }
}

function getDailyVerse(date: string) {
  const dayNumber = Number(date.replaceAll("-", ""));
  const index = Number.isFinite(dayNumber) ? dayNumber % shortVerses.length : 0;
  return shortVerses[index];
}

function getFallbackMessage(date: string): DailyInspiration {
  const dayNumber = Number(date.replaceAll("-", ""));
  const index = Number.isFinite(dayNumber) ? dayNumber % fallbackMessages.length : 0;
  return {
    text: fallbackMessages[index],
    attribution: "Motivación del día",
    kind: "quote",
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}
