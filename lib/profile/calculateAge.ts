import { getTodayIso } from "@/lib/date";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calculateAge(
  dateOfBirth: string,
  referenceDate = getTodayIso(),
): number {
  const birth = parseDateParts(dateOfBirth);
  const reference = parseDateParts(referenceDate);
  let age = reference.year - birth.year;

  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }

  return age;
}

function parseDateParts(value: string) {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new Error("La fecha debe usar el formato YYYY-MM-DD.");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error("La fecha no es válida.");
  }

  return { year, month, day };
}
