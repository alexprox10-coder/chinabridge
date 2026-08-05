import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function auth() {
  const s = await cookies();
  return !!s.get("cb_admin")?.value;
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ ok: false }, { status: 401 });
  // Decisions are seeded by /ceo/report and managed client-side in localStorage
  return NextResponse.json({ ok: true, decisions: [] });
}

export async function PATCH(_req: NextRequest) {
  if (!await auth()) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
