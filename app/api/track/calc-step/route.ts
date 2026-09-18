import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const VALID_STEPS = new Set([
  "calculator_view",
  "calculator_start",
  "input_started",
  "product_parsed",
  "fields_completed",
  "calculation_started",
  "calculation_success",
  "result_view",
  "delivery_request",
]);

export async function POST(req: NextRequest) {
  let step = "", anonymous_id = "", session_id = "";
  let source = "", campaign = "", country = "", calculator_mode = "", device = "";

  try {
    const body = await req.json();
    step           = String(body?.step           ?? "").slice(0, 64);
    anonymous_id   = String(body?.anonymous_id   ?? "").slice(0, 64);
    session_id     = String(body?.session_id     ?? "").slice(0, 64);
    source         = String(body?.source         ?? "").slice(0, 64);
    campaign       = String(body?.campaign       ?? "").slice(0, 64);
    country        = String(body?.country        ?? "").slice(0, 8);
    calculator_mode= String(body?.calculator_mode?? "").slice(0, 32);
    device         = String(body?.device         ?? "").slice(0, 32);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!step || !VALID_STEPS.has(step)) {
    return NextResponse.json({ ok: false, error: "invalid_step" }, { status: 400 });
  }
  if (!anonymous_id || !session_id) {
    return NextResponse.json({ ok: false, error: "missing_ids" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      CREATE TABLE IF NOT EXISTS calc_step_events (
        id            BIGSERIAL PRIMARY KEY,
        anonymous_id  TEXT        NOT NULL,
        session_id    TEXT        NOT NULL,
        step          TEXT        NOT NULL,
        source        TEXT,
        campaign      TEXT,
        country       TEXT,
        calculator_mode TEXT,
        device        TEXT,
        ip            TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch(() => null);

    await sql`
      INSERT INTO calc_step_events
        (anonymous_id, session_id, step, source, campaign, country, calculator_mode, device, ip)
      VALUES
        (${anonymous_id}, ${session_id}, ${step}, ${source}, ${campaign}, ${country}, ${calculator_mode}, ${device}, ${ip})
    `.catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
