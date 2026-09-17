import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "calc_view", "calc_done", "paywall_shown", "pro_click",
  "checkout_started", "payment_success", "pro_activated", "paywall_closed",
]);

async function ensureTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS calc_funnel_events (
      id           BIGSERIAL PRIMARY KEY,
      event_name   TEXT NOT NULL,
      anonymous_id TEXT,
      session_id   TEXT,
      operation_id TEXT,
      calc_count   INTEGER,
      source       TEXT,
      metadata     JSONB,
      ip           TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => null);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const event = String(body?.event ?? "").trim();
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const sql = neon(process.env.DATABASE_URL);
  await ensureTable(sql);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await sql`
      INSERT INTO calc_funnel_events
        (event_name, anonymous_id, session_id, operation_id, calc_count, source, metadata, ip)
      VALUES (
        ${event},
        ${String(body?.anonymous_id ?? "")},
        ${String(body?.session_id ?? "")},
        ${String(body?.operation_id ?? "")},
        ${body?.calc_count != null ? Number(body.calc_count) : null},
        ${String(body?.source ?? "")},
        ${body?.metadata ? JSON.stringify(body.metadata) : null},
        ${ip}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[funnel-event]", err);
    return NextResponse.json({ ok: true, stored: false });
  }
}
