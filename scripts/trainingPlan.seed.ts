import type { TableInsert } from "../types/database";

export type TrainingPlanSeedItem = Omit<
  TableInsert<"training_plan_items">,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/**
 * Pega aquí las 9 semanas del plan real.
 *
 * No incluyas user_id: seedTrainingPlan obtiene la identidad de la sesión
 * autenticada y la añade en el servidor. La combinación date + title debe ser
 * estable para que las ejecuciones posteriores actualicen en lugar de duplicar.
 */
export const trainingPlanSeed: TrainingPlanSeedItem[] = [];
