import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPlacements, createPlacement, deletePlacement, updatePlacementNotes } from "@/lib/marketing/db";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const placements = await getPlacements();
    return NextResponse.json(placements);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const id = await createPlacement(body);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rawId = req.nextUrl.searchParams.get("id");
  const id = rawId ? parseInt(rawId, 10) : NaN;
  if (isNaN(id)) return NextResponse.json({ error: "id_required" }, { status: 400 });
  try {
    const { notes } = await req.json();
    await updatePlacementNotes(id, notes ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rawId = req.nextUrl.searchParams.get("id");
  const id = rawId ? parseInt(rawId, 10) : NaN;
  if (isNaN(id)) return NextResponse.json({ error: "id_required" }, { status: 400 });
  try {
    await deletePlacement(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
