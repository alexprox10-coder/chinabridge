import { NextRequest, NextResponse } from "next/server";
import { getFinanceSettings, updateSetting } from "@/lib/finance/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getFinanceSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: Array<{ id: number; value: string }> = body.updates ?? [];
    const results = await Promise.all(updates.map((u) => updateSetting(u.id, u.value)));
    const ok = results.every(Boolean);
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
