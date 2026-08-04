import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/import-leads/pipeline";
import { getConfig } from "@/lib/import-leads/config";

export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Auth: either cron secret header or admin session
  const authHeader = req.headers.get("Authorization") ?? "";
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const isAdmin = req.cookies.get("cb_admin")?.value;

  if (!isCron && !isAdmin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let overrides: Record<string, unknown> = {};
  try { overrides = await req.json(); } catch { /* no body */ }

  const config = getConfig(overrides as Parameters<typeof getConfig>[0]);

  try {
    const result = await runPipeline(config);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const config = getConfig();
  try {
    const result = await runPipeline(config);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
