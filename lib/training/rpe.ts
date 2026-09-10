export interface RpeRange {
  minimum: number;
  maximum: number;
}

export function parseRpe(value: string): RpeRange | null {
  const values = Array.from(value.matchAll(/(?<!\d)(10|[0-9])(?!\d)/g))
    .map((match) => Number(match[1]));

  if (values.length === 0) return null;

  return {
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}

export function formatRpeRange(
  minimum: number | null,
  maximum: number | null,
): string | null {
  if (minimum === null && maximum === null) return null;
  if (minimum === null) return `RPE ${maximum}`;
  if (maximum === null || minimum === maximum) return `RPE ${minimum}`;
  return `RPE ${minimum}–${maximum}`;
}
