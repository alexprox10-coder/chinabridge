import { NextRequest, NextResponse } from "next/server";
import { getCompanySettings, saveCompanySettings } from "@/lib/documents/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getCompanySettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const ok = await saveCompanySettings(body);
  if (!ok) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
