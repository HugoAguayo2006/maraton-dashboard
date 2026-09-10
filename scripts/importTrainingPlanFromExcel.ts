import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import readExcelFile from "read-excel-file/node";
import { createClient } from "@supabase/supabase-js";
import { inferEffortType } from "../lib/training/effortTypes";
import { parsePace } from "../lib/training/pace";
import { parseRpe } from "../lib/training/rpe";
import type { Database, Json, TableInsert } from "../types/database";
import type { SessionType, WorkoutStatus } from "../types/training";

dotenv.config({ path: ".env.local", quiet: true });

const PLAN_SHEET = "Plan diario";
const GYM_SHEET = "Gimnasio";
const EXPECTED_HEADERS = [
  "Semana",
  "Fecha",
  "Día",
  "Sesión",
  "Km",
  "Ritmo objetivo",
  "Tiempo estimado (min)",
  "RPE",
  "Calentamiento",
  "Trabajo principal",
  "Enfriamiento",
  "Gimnasio / fuerza",
  "Nutrición / hidratación",
  "Recuperación / notas",
  "Estado",
  "Km reales",
  "Pace real",
  "RPE real",
  "Dolor 0–10",
] as const;

type ExcelCell = string | number | boolean | Date | null;
type ExcelRow = ExcelCell[];
type PlanInsert = TableInsert<"training_plan_items">;

interface ImportIssue {
  row: number;
  column: string;
  value: string;
  problem: string;
}

interface ParsedPlanRow {
  rowNumber: number;
  record: Omit<PlanInsert, "user_id">;
}

interface ExistingPlanIdentity {
  id: string;
  date: string;
  title: string;
  status: string;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const workbookPath = findWorkbook();
  const workbookBuffer = fs.readFileSync(workbookPath);
  const workbook = await readExcelFile(workbookBuffer);
  const sheets = workbook.map((sheet) => ({
    name: sheet.sheet,
    rows: sheet.data as ExcelRow[],
  }));
  const planSheet = sheets.find((sheet) => normalize(sheet.name) === normalize(PLAN_SHEET));

  if (!planSheet) {
    throw new Error(`No se encontró la hoja "${PLAN_SHEET}".`);
  }

  const gymSheet = sheets.find((sheet) => normalize(sheet.name) === normalize(GYM_SHEET));
  const gymRoutines = gymSheet ? parseGymRoutines(gymSheet.rows) : new Map<string, string[]>();
  const { rows, issues, omitted, readCount } = parsePlanSheet(planSheet.rows, gymRoutines);

  printPreview({
    workbookPath,
    sheetNames: sheets.map((sheet) => sheet.name),
    rows,
    readCount,
    apply,
  });

  if (issues.length > 0) {
    printIssues(issues);
    throw new Error("La importación fue cancelada porque existen filas inválidas.");
  }

  const client = createAuthenticatedClient();
  const { user, supabase } = await client;

  try {
    const expectedUserId = process.env.SEED_USER_ID?.trim();
    if (expectedUserId && expectedUserId !== user.id) {
      throw new Error("SEED_USER_ID no coincide con el usuario autenticado.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw new Error("No fue posible comprobar el perfil del atleta.");
    if (!profile) throw new Error("Completa el onboarding antes de importar el plan.");

    const { data: existing, error: existingError } = await supabase
      .from("training_plan_items")
      .select("id,date,title,status")
      .eq("user_id", user.id);

    if (existingError) throw new Error("No fue posible revisar el plan existente.");

    const existingRows = (existing ?? []) as ExistingPlanIdentity[];
    const existingByIdentity = new Map(
      existingRows.map((item) => [identityKey(item.date, item.title), item]),
    );
    const predictedInserts = rows.filter(
      (item) => !existingByIdentity.has(identityKey(item.record.date, item.record.title)),
    ).length;
    const predictedUpdates = rows.length - predictedInserts;

    if (!apply) {
      console.log(`Insertadas: 0 (vista previa: ${predictedInserts})`);
      console.log(`Actualizadas: 0 (vista previa: ${predictedUpdates})`);
      console.log(`Omitidas: ${omitted}`);
      console.log("Errores: 0");
      console.log("\nVista previa terminada. Ejecuta npm run import:plan:apply para escribir en Supabase.");
      return;
    }

    const records: PlanInsert[] = rows.map(({ record }) => {
      const previous = existingByIdentity.get(identityKey(record.date, record.title));
      const status = preserveProgressStatus(record.status ?? "pending", previous?.status);
      return { ...record, status, user_id: user.id };
    });

    const { data: imported, error: importError } = await supabase
      .from("training_plan_items")
      .upsert(records, { onConflict: "user_id,date,title" })
      .select("id,date,title,status");

    if (importError) {
      throw new Error(`No fue posible cargar el plan: ${safeDatabaseMessage(importError.message)}`);
    }

    const workbookSnapshot = Object.fromEntries(
      sheets.map((sheet) => [
        sheet.name,
        sheet.rows.map((row) => row.map(serializeCell)),
      ]),
    ) as Json;
    const sourceSha256 = createHash("sha256").update(workbookBuffer).digest("hex");
    const archive: TableInsert<"training_plan_imports"> = {
      user_id: user.id,
      source_name: path.basename(workbookPath),
      source_sha256: sourceSha256,
      sheet_names: sheets.map((sheet) => sheet.name),
      workbook_snapshot: workbookSnapshot,
      imported_row_count: rows.length,
    };
    const { error: archiveError } = await supabase
      .from("training_plan_imports")
      .upsert(archive, { onConflict: "user_id,source_name" });

    if (archiveError) throw new Error("El plan se cargó, pero no se pudo archivar la fuente del Excel.");

    const { error: profileUpdateError } = await supabase
      .from("athlete_profiles")
      .update({
        marathon_name: "Maratón de Guadalajara",
        marathon_date: "2026-11-08",
        goal: "Terminar bien y sin lesiones",
        natural_pace_seconds: 360,
      })
      .eq("user_id", user.id);

    if (profileUpdateError) throw new Error("El plan se cargó, pero no se pudo completar la carrera objetivo.");

    const linked = await linkExistingSeptemberWorkout(
      supabase,
      user.id,
      (imported ?? []) as ExistingPlanIdentity[],
    );
    const { count: finalCount, error: countError } = await supabase
      .from("training_plan_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw new Error("La importación terminó, pero no se pudo verificar el total.");

    console.log(`Insertadas: ${predictedInserts}`);
    console.log(`Actualizadas: ${predictedUpdates}`);
    console.log(`Omitidas: ${omitted}`);
    console.log("Errores: 0");
    console.log(`Training plan items existentes: ${finalCount ?? rows.length}`);
    console.log(`Workout 2026-09-07 vinculado: ${linked.linked ? "sí" : "no"}`);
    if (linked.planItemId) {
      console.log(`Sesión vinculada: ${linked.date} · ${linked.planItemId}`);
      console.log(`Status completed: ${linked.completed ? "sí" : "no"}`);
    }
  } finally {
    await supabase.auth.signOut();
  }
}

function findWorkbook(): string {
  const importDirectory = path.resolve("data/imports");
  const preferred = path.join(importDirectory, "Plan_Maraton_GDL_2026_Hugo.xlsx");
  if (fs.existsSync(preferred)) return preferred;

  const files = fs.existsSync(importDirectory)
    ? fs.readdirSync(importDirectory).filter((file) => file.toLowerCase().endsWith(".xlsx"))
    : [];
  if (files.length !== 1) {
    throw new Error("Debe existir un único archivo .xlsx dentro de data/imports.");
  }
  return path.join(importDirectory, files[0]);
}

function parsePlanSheet(
  sheet: ExcelRow[],
  gymRoutines: Map<string, string[]>,
): { rows: ParsedPlanRow[]; issues: ImportIssue[]; omitted: number; readCount: number } {
  const header = sheet[0] ?? [];
  const headerByName = new Map(
    header.map((value, index) => [normalize(cellText(value)), index]),
  );
  const issues: ImportIssue[] = [];

  for (const expected of EXPECTED_HEADERS) {
    if (!headerByName.has(normalize(expected))) {
      issues.push({ row: 1, column: expected, value: "", problem: "Falta la columna requerida." });
    }
  }
  if (issues.length > 0) return { rows: [], issues, omitted: 0, readCount: Math.max(0, sheet.length - 1) };

  const rows: ParsedPlanRow[] = [];
  let omitted = 0;

  for (let index = 1; index < sheet.length; index += 1) {
    const row = sheet[index];
    const rowNumber = index + 1;
    if (row.every((value) => value === null || cellText(value).trim() === "")) {
      omitted += 1;
      continue;
    }

    const get = (headerName: typeof EXPECTED_HEADERS[number]) =>
      row[headerByName.get(normalize(headerName)) as number] ?? null;
    const rowIssues: ImportIssue[] = [];
    const week = requiredInteger(get("Semana"), rowNumber, "Semana", rowIssues, 1);
    const date = requiredDate(get("Fecha"), rowNumber, "Fecha", rowIssues);
    const title = requiredText(get("Sesión"), rowNumber, "Sesión", rowIssues);
    const distance = requiredNumber(get("Km"), rowNumber, "Km", rowIssues, 0);
    const durationValue = requiredNumber(
      get("Tiempo estimado (min)"),
      rowNumber,
      "Tiempo estimado (min)",
      rowIssues,
      0,
    );
    const paceText = nullableText(get("Ritmo objetivo"));
    const rpeText = nullableText(get("RPE"));
    const mainWorkout = nullableText(get("Trabajo principal"));
    const status = parseStatus(get("Estado"), rowNumber, rowIssues);

    if (rowIssues.length > 0 || week === null || date === null || title === null || distance === null || durationValue === null || status === null) {
      issues.push(...rowIssues);
      continue;
    }

    const pace = paceText && normalize(paceText) !== "mixto"
      ? parsePace(paceText)
      : parsePace(mainWorkout ?? "");
    const rpe = rpeText ? parseRpe(rpeText) : null;
    const originalStrength = nullableText(get("Gimnasio / fuerza"));
    const strength = enrichStrength(title, originalStrength, gymRoutines);
    const sourceData = Object.fromEntries(
      EXPECTED_HEADERS.map((headerName) => [headerName, serializeCell(get(headerName))]),
    ) as Json;

    rows.push({
      rowNumber,
      record: {
        week,
        date,
        session_type: inferSessionType(title, distance),
        effort_type: inferEffortType(title),
        title,
        planned_distance_km: distance,
        target_pace_min_seconds: pace?.minimumSeconds ?? null,
        target_pace_max_seconds: pace?.maximumSeconds ?? null,
        target_pace_text: paceText,
        target_rpe_min: rpe?.minimum ?? null,
        target_rpe_max: rpe?.maximum ?? null,
        target_rpe_text: rpeText,
        estimated_duration_minutes: durationValue > 0 ? Math.round(durationValue) : null,
        warmup: nullableText(get("Calentamiento")),
        main_workout: mainWorkout,
        cooldown: nullableText(get("Enfriamiento")),
        strength,
        nutrition: nullableText(get("Nutrición / hidratación")),
        recovery_notes: nullableText(get("Recuperación / notas")),
        status,
        source_row_number: rowNumber,
        source_data: sourceData,
      },
    });
  }

  return { rows, issues, omitted, readCount: Math.max(0, sheet.length - 1) };
}

function parseGymRoutines(rows: ExcelRow[]): Map<string, string[]> {
  const routines = new Map<string, string[]>();
  for (const row of rows.slice(4)) {
    const key = cellText(row[0]);
    if (!new Set(["A", "B", "Ligera"]).has(key)) continue;
    const exercise = nullableText(row[1]);
    if (!exercise) continue;
    const details = [
      `${cellText(row[2]) || "—"} series × ${cellText(row[3]) || "—"}`,
      `RIR ${cellText(row[4]) || "—"}`,
      `descanso ${cellText(row[5]) || "—"}`,
      nullableText(row[6]),
    ].filter(Boolean).join(" · ");
    const current = routines.get(key) ?? [];
    current.push(`${exercise}: ${details}`);
    routines.set(key, current);
  }
  return routines;
}

function enrichStrength(
  title: string,
  original: string | null,
  routines: Map<string, string[]>,
): string | null {
  const normalized = normalize(`${title} ${original ?? ""}`);
  let key: "A" | "B" | "Ligera" | null = null;
  if (/gimnasio a/.test(normalized)) key = "A";
  else if (/gimnasio b/.test(normalized)) key = "B";
  else if (/gimnasio.*liger/.test(normalized)) key = "Ligera";
  if (!key) return original;

  const exercises = routines.get(key);
  if (!exercises?.length) return original;
  return [original, `Rutina ${key} del Excel:\n${exercises.map((item) => `• ${item}`).join("\n")}`]
    .filter(Boolean)
    .join("\n\n");
}

function inferSessionType(title: string, distance: number): SessionType {
  const value = normalize(title);
  if (/gimnasio|fuerza/.test(value) && (distance === 0 || /descanso de carrera/.test(value))) return "strength";
  if (/descanso/.test(value) && distance === 0) return "rest";
  if (/tirada|larga|maraton gdl/.test(value)) return "long-run";
  if (/interval|velocidad|repeticiones/.test(value)) return "intervals";
  if (/tempo/.test(value)) return "tempo";
  if (/recuperacion|shakeout/.test(value)) return "recovery";
  return distance > 0 ? "easy" : "rest";
}

function parseStatus(cell: ExcelCell, row: number, issues: ImportIssue[]): WorkoutStatus | null {
  const raw = cellText(cell);
  const value = normalize(raw);
  const statuses: Record<string, WorkoutStatus> = {
    pendiente: "pending",
    completado: "completed",
    completada: "completed",
    modificado: "modified",
    modificada: "modified",
    omitido: "skipped",
    omitida: "skipped",
  };
  const status = statuses[value];
  if (!status) issues.push({ row, column: "Estado", value: raw, problem: "Estado no reconocido." });
  return status ?? null;
}

function requiredInteger(cell: ExcelCell, row: number, column: string, issues: ImportIssue[], minimum: number): number | null {
  const value = typeof cell === "number" ? cell : Number(cellText(cell));
  if (!Number.isInteger(value) || value < minimum) {
    issues.push({ row, column, value: cellText(cell), problem: `Debe ser un entero mayor o igual a ${minimum}.` });
    return null;
  }
  return value;
}

function requiredNumber(cell: ExcelCell, row: number, column: string, issues: ImportIssue[], minimum: number): number | null {
  const value = typeof cell === "number" ? cell : Number(cellText(cell));
  if (!Number.isFinite(value) || value < minimum) {
    issues.push({ row, column, value: cellText(cell), problem: `Debe ser un número mayor o igual a ${minimum}.` });
    return null;
  }
  return value;
}

function requiredText(cell: ExcelCell, row: number, column: string, issues: ImportIssue[]): string | null {
  const value = nullableText(cell);
  if (!value) issues.push({ row, column, value: cellText(cell), problem: "El valor es obligatorio." });
  return value;
}

function requiredDate(cell: ExcelCell, row: number, column: string, issues: ImportIssue[]): string | null {
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) return cell.toISOString().slice(0, 10);
  const text = cellText(cell).trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  issues.push({ row, column, value: text, problem: "Fecha no reconocida." });
  return null;
}

function nullableText(cell: ExcelCell): string | null {
  const value = cellText(cell).trim();
  return value === "" || value === "—" || value === "-" ? null : value;
}

function cellText(cell: ExcelCell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell);
}

function serializeCell(cell: ExcelCell): Json {
  if (cell === null || cell === undefined) return null;
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return cell;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function identityKey(date: string, title: string): string {
  return `${date}\u0000${title}`;
}

function preserveProgressStatus(imported: string, existing?: string): string {
  if (existing && existing !== "pending" && imported === "pending") return existing;
  return imported;
}

async function createAuthenticatedClient() {
  const url = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = requireEnvironmentVariable("SEED_EMAIL");
  const password = requireEnvironmentVariable("SEED_PASSWORD");
  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error("No fue posible autenticar al usuario del import.");
  return { user: data.user, supabase };
}

async function linkExistingSeptemberWorkout(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>["supabase"],
  userId: string,
  imported: ExistingPlanIdentity[],
): Promise<{ linked: boolean; completed: boolean; planItemId: string | null; date: string | null }> {
  const planItem = imported.find(
    (item) => item.date === "2026-09-07" && normalize(item.title).includes("suave realizado"),
  );
  if (!planItem) throw new Error("No se encontró la sesión del plan correspondiente al 2026-09-07.");

  const { data: workouts, error: workoutError } = await supabase
    .from("workout_logs")
    .select("id,training_plan_item_id")
    .eq("user_id", userId)
    .eq("date", "2026-09-07")
    .eq("distance_km", 10.46)
    .eq("duration_seconds", 4246)
    .eq("average_pace_seconds", 406);

  if (workoutError) throw new Error("No fue posible comprobar el workout real del 2026-09-07.");
  if (!workouts || workouts.length !== 1) {
    throw new Error(`Se esperaban 1 workout exacto del 2026-09-07 y se encontraron ${workouts?.length ?? 0}.`);
  }
  const workout = workouts[0];
  if (workout.training_plan_item_id && workout.training_plan_item_id !== planItem.id) {
    throw new Error("El workout del 2026-09-07 ya está vinculado a otra sesión; no se modificó.");
  }

  if (!workout.training_plan_item_id) {
    const { error } = await supabase
      .from("workout_logs")
      .update({ training_plan_item_id: planItem.id })
      .eq("id", workout.id)
      .eq("user_id", userId)
      .is("training_plan_item_id", null);
    if (error) throw new Error("No fue posible vincular el workout del 2026-09-07.");
  }

  const { error: statusError } = await supabase
    .from("training_plan_items")
    .update({ status: "completed" })
    .eq("id", planItem.id)
    .eq("user_id", userId);
  if (statusError) throw new Error("El workout se vinculó, pero no fue posible marcar la sesión completada.");

  return { linked: true, completed: true, planItemId: planItem.id, date: planItem.date };
}

function printPreview({
  workbookPath,
  sheetNames,
  rows,
  readCount,
  apply,
}: {
  workbookPath: string;
  sheetNames: string[];
  rows: ParsedPlanRow[];
  readCount: number;
  apply: boolean;
}) {
  const effortCounts = new Map<string, number>();
  const weekKilometers = new Map<number, number>();
  for (const item of rows) {
    const effort = item.record.effort_type ?? "strength/null";
    effortCounts.set(effort, (effortCounts.get(effort) ?? 0) + 1);
    weekKilometers.set(
      item.record.week,
      (weekKilometers.get(item.record.week) ?? 0) + Number(item.record.planned_distance_km ?? 0),
    );
  }

  console.log(`Modo: ${apply ? "APLICAR EN SUPABASE" : "VISTA PREVIA (sin escrituras)"}`);
  console.log("Excel encontrado: sí");
  console.log(`Archivo: ${path.relative(process.cwd(), workbookPath)}`);
  console.log(`Hojas: ${sheetNames.join(", ")}`);
  console.log(`Hoja usada: ${PLAN_SHEET}`);
  console.log(`Filas leídas: ${readCount}`);
  console.log(`Filas válidas: ${rows.length}`);
  console.log(`Rango: ${rows[0]?.record.date ?? "—"} → ${rows.at(-1)?.record.date ?? "—"}`);
  console.log(`Semanas: ${Array.from(weekKilometers.entries()).map(([week, km]) => `${week}=${round(km)} km`).join(" · ")}`);
  console.log(`Tipos de esfuerzo: ${Array.from(effortCounts.entries()).map(([type, count]) => `${type}=${count}`).join(" · ")}`);
}

function printIssues(issues: ImportIssue[]) {
  console.error(`Errores: ${issues.length}`);
  issues.forEach((issue) => {
    console.error(`Fila ${issue.row} · ${issue.column} · ${JSON.stringify(issue.value)} · ${issue.problem}`);
  });
}

function safeDatabaseMessage(message: string): string {
  if (/column .* does not exist|schema cache/i.test(message)) {
    return "aplica primero la migración 202609070002_phase3_onboarding_plan_import.sql";
  }
  return "la base de datos rechazó una o más filas";
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(`Import cancelado: ${message}`);
  process.exitCode = 1;
});
