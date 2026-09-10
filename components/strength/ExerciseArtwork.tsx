import { Dumbbell } from "lucide-react";
import type { Exercise } from "@/types/training";

const categoryStyles = {
  upper_body: "bg-accent-soft text-accent",
  lower_body: "bg-warning-soft text-warning",
  other: "bg-success-soft text-success",
} as const;

export function ExerciseArtwork({
  exercise,
  className = "size-12",
}: {
  exercise: Exercise;
  className?: string;
}) {
  if (exercise.imageUrl) {
    return (
      <span
        role="img"
        aria-label={exercise.nameEs}
        className={`${className} block shrink-0 rounded-2xl bg-cover bg-center`}
        style={{ backgroundImage: `url(${JSON.stringify(exercise.imageUrl).slice(1, -1)})` }}
      />
    );
  }

  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-2xl ${categoryStyles[exercise.category]}`}>
      <Dumbbell size={19} aria-hidden="true" />
    </span>
  );
}

