import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function auth() {
  const s = await cookies();
  return !!s.get("cb_admin")?.value;
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ ok: false }, { status: 401 });
  // Tasks are managed client-side in localStorage; server just acknowledges
  return NextResponse.json({ ok: true, tasks: [] });
}

export async function POST(_req: NextRequest) {
  if (!await auth()) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
