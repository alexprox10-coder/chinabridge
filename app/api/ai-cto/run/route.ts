import { NextRequest, NextResponse } from "next/server";
import { isAdminOnly } from "@/lib/api-auth";
import { runCtoAudit } from "@/lib/ai-cto";

export const runtime     = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!isAdminOnly(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const report = await runCtoAudit();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
