import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/import-leads/pipeline";
import { getConfig } from "@/lib/import-leads/config";

export const runtime = "nodejs";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// UI quick-run: 1 query, 5 results, stop after 3 saves → fits in ~45s
const QUICK_OVERRIDES = {
  dailyLimit: 3,
  searchQueries: [
    "мебель оптовый поставщик импорт Китай",
    "электроника оптом поставщик Wildberries",
  ],
  minScore: 2,
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const isAdmin = req.cookies.get("cb_admin")?.value;

  // UI button calls without cron secret — allow quick-mode only
  const isQuickUI = !isCron && !isAdmin;

  let overrides: Record<string, unknown> = {};
  try { overrides = await req.json(); } catch { /* no body */ }

  // Quick UI mode: override limits regardless of what was passed
  const finalOverrides = isQuickUI ? { ...overrides, ...QUICK_OVERRIDES } : overrides;
  const config = getConfig(finalOverrides as Parameters<typeof getConfig>[0]);

  try {
    const result = await runPipeline(config);
    return NextResponse.json({ ok: true, result, mode: isQuickUI ? "quick" : "full" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Vercel cron calls GET — requires CRON_SECRET
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
