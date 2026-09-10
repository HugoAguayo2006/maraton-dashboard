import { formatPace as formatStoredPace } from "@/lib/training/pace";

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function formatDistance(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatPace(totalSeconds: number, distanceKm: number): string {
  if (!totalSeconds || !distanceKm) return "--:-- /km";

  const secondsPerKm = Math.round(totalSeconds / distanceKm);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatPaceSeconds(secondsPerKm: number | null): string | null {
  return formatStoredPace(secondsPerKm);
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatDayAndDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
