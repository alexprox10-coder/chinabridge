import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, tasks: [] });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
