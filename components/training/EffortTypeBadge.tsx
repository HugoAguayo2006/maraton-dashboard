import { getEffortTypeDefinition } from "@/lib/training/effortTypes";
import type { EffortType } from "@/types/training";

export function EffortTypeBadge({ effortType }: { effortType: EffortType }) {
  const definition = getEffortTypeDefinition(effortType);

  return (
    <span
      title={`${definition.description}${definition.approxRpe ? ` ${definition.approxRpe}` : ""}`}
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-[10px] font-bold ${definition.badgeClassName}`}
    >
      {definition.label}
    </span>
  );
}
