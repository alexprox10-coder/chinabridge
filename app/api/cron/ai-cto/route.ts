import { NextRequest, NextResponse } from "next/server";
import { runCtoAudit } from "@/lib/ai-cto";

export const runtime     = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const report = await runCtoAudit();
    return NextResponse.json({ ok: true, healthScore: report.healthScore, systemStatus: report.systemStatus, id: report.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
