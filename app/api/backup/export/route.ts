import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const jar = await cookies();

  // Collect all cb_ cookies (excluding sensitive keys)
  const EXCLUDE = ["cb_admin", "cb_super_admin", "cb_ai_config"];
  const settings: Record<string, string> = {};

  for (const cookie of jar.getAll()) {
    if (cookie.name.startsWith("cb_") && !EXCLUDE.includes(cookie.name)) {
      settings[cookie.name] = cookie.value;
    }
  }

  const backup = {
    version:   "1.0",
    exportedAt: new Date().toISOString(),
    platform:   "ChinaBridge Platform",
    settings,
    // In production: would include tenant DB records, leads, docs, tasks etc.
    leads:     [],
    documents: [],
    tasks:     [],
    kpi:       [],
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="chinabridge-backup-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
