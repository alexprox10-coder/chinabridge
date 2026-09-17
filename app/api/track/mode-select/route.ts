import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let mode = "", country = "", vertical = "";
  try {
    const body = await req.json();
    mode     = String(body?.mode     ?? "").slice(0, 32);
    country  = String(body?.country  ?? "").slice(0, 8);
    vertical = String(body?.vertical ?? "").slice(0, 64);
  } catch { /* ignore */ }

  if (!mode) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      CREATE TABLE IF NOT EXISTS calc_mode_stats (
        id         BIGSERIAL PRIMARY KEY,
        mode       TEXT NOT NULL,
        country    TEXT,
        vertical   TEXT,
        ip         TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch(() => null);

    await sql`
      INSERT INTO calc_mode_stats (mode, country, vertical, ip)
      VALUES (${mode}, ${country || null}, ${vertical || null}, ${ip})
    `.catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
