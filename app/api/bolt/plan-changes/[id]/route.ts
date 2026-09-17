import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { isBoltConfigured } from "@/lib/ai/config";
import { getPlanChangePreview } from "@/lib/ai/plan";
import { boltWriteTools } from "@/lib/ai/writeTools";

const confirmationSchema = z.object({ confirmed: z.literal(true) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "La propuesta no es válida." }, { status: 400 });
  try {
    const proposal = await getPlanChangePreview(id);
    return proposal
      ? NextResponse.json({ proposal })
      : NextResponse.json({ error: "La propuesta no existe." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "No pudimos cargar la propuesta." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  if (!isBoltConfigured()) return unavailable();
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const confirmation = confirmationSchema.safeParse(body);
  if (!confirmation.success) {
    return NextResponse.json({ error: "Confirma explícitamente el cambio antes de aplicarlo." }, { status: 400 });
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "La propuesta no es válida." }, { status: 400 });
  try {
    const version = await boltWriteTools.apply_plan_change(id, confirmation.data.confirmed);
    ["/dashboard", "/plan", "/progress", "/workouts"].forEach((path) => revalidatePath(path));
    return NextResponse.json({ applied: true, version });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos aplicar el cambio." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "La propuesta no es válida." }, { status: 400 });
  try {
    await boltWriteTools.reject_plan_change(id);
    return NextResponse.json({ rejected: true });
  } catch {
    return NextResponse.json({ error: "No pudimos cancelar la propuesta." }, { status: 409 });
  }
}

function unavailable() {
  return NextResponse.json({ error: "Bolt AI no está disponible en este momento." }, { status: 503 });
}
