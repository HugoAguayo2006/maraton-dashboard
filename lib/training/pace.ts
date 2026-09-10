const PACE_PATTERN = /(?<!\d)(\d{1,2}):(\d{2})(?!\d)/g;

export interface PaceRange {
  minimumSeconds: number;
  maximumSeconds: number;
}

export function parsePace(value: string): PaceRange | null {
  const matches = Array.from(value.matchAll(PACE_PATTERN));
  const paces = matches
    .map((match) => Number(match[1]) * 60 + Number(match[2]))
    .filter((seconds) => seconds > 0 && seconds < 1_200);

  if (paces.length === 0) return null;

  return {
    minimumSeconds: Math.min(...paces),
    maximumSeconds: Math.max(...paces),
  };
}

export function formatPace(secondsPerKm: number | null): string | null {
  if (secondsPerKm === null || secondsPerKm <= 0) return null;
  const rounded = Math.round(secondsPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatPaceRange(
  minimumSeconds: number | null,
  maximumSeconds: number | null,
): string | null {
  if (minimumSeconds === null && maximumSeconds === null) return null;
  if (minimumSeconds === null) return formatPace(maximumSeconds);
  if (maximumSeconds === null || minimumSeconds === maximumSeconds) {
    return formatPace(minimumSeconds);
  }

  const minimum = formatPace(minimumSeconds)?.replace(" /km", "");
  const maximum = formatPace(maximumSeconds);
  return minimum && maximum ? `${minimum}–${maximum}` : null;
}
