const APP_TIME_ZONE = "America/Mexico_City";
const DAY_IN_MS = 86_400_000;

export function getTodayIso(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) throw new Error("No se pudo calcular la fecha local.");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function getWeekRange(isoDate: string): { start: string; end: string } {
  const date = parseIsoDate(isoDate);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = addDays(isoDate, -daysFromMonday);
  return { start, end: addDays(start, 6) };
}

export function differenceInCalendarDays(from: string, to: string): number {
  return Math.ceil((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / DAY_IN_MS);
}

export function calculateProgressPercent(start: string, current: string, end: string): number {
  const total = differenceInCalendarDays(start, end);
  const elapsed = differenceInCalendarDays(start, current);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
