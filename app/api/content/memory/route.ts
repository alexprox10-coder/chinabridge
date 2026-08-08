import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMemories, saveMemory, deleteMemory } from "@/lib/content/db";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const memories = await getMemories();
    return NextResponse.json(memories);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const key = String(body?.key ?? "").trim();
    const value = String(body?.value ?? "").trim();
    const category = String(body?.category ?? "general").trim() || "general";
    if (!key || !value) {
      return NextResponse.json({ error: "key_and_value_required" }, { status: 400 });
    }
    await saveMemory(key, value, category);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    let key = req.nextUrl.searchParams.get("key") ?? "";
    if (!key) {
      const body = await req.json().catch(() => ({}));
      key = String(body?.key ?? "");
    }
    key = key.trim();
    if (!key) return NextResponse.json({ error: "key_required" }, { status: 400 });
    await deleteMemory(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
