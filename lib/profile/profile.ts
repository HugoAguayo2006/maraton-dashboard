import type { AthleteProfile, AthleteSex } from "@/types/training";

export const athleteSexOptions: ReadonlyArray<{
  value: AthleteSex;
  label: string;
  description: string;
}> = [
  { value: "male", label: "Masculino", description: "Hombre" },
  { value: "female", label: "Femenino", description: "Mujer" },
  {
    value: "prefer_not_to_say",
    label: "Prefiero no decirlo",
    description: "Mantener privado",
  },
];

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Atleta";
}

export function getAthleteSexLabel(sex: AthleteSex): string {
  return athleteSexOptions.find((option) => option.value === sex)?.label ?? "—";
}

export function isAthleteProfileComplete(
  profile: AthleteProfile | null,
): profile is AthleteProfile & { dateOfBirth: string; age: number } {
  return Boolean(
    profile &&
      profile.name.trim() &&
      profile.dateOfBirth &&
      profile.age !== null &&
      profile.weightKg > 0 &&
      athleteSexOptions.some((option) => option.value === profile.sex) &&
      profile.goalEventName?.trim() &&
      profile.goalEventDistanceKm !== null &&
      profile.goalEventDistanceKm > 0 &&
      profile.goalEventDate,
  );
}
