import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime     = "nodejs";
export const maxDuration = 60;

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS content_posts (
      id           SERIAL PRIMARY KEY,
      title        TEXT,
      body         TEXT NOT NULL,
      platform     TEXT NOT NULL DEFAULT 'telegram',
      category     TEXT NOT NULL DEFAULT 'useful',
      cta_type     TEXT,
      cta_url      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      utm_content  TEXT,
      image_prompt TEXT,
      audience     TEXT,
      status       TEXT NOT NULL DEFAULT 'generated',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      source_topic TEXT,
      views        INTEGER DEFAULT 0,
      clicks       INTEGER DEFAULT 0,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function publishToTelegram(text: string): Promise<boolean> {
  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID ?? "@chinabridgeline";
  if (!token) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:    channel,
      text,
      parse_mode: "HTML",
    }),
    signal: AbortSignal.timeout(15000),
  });

  return res.ok;
}

export async function GET(req: NextRequest) {
  // Auth: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization") ?? "";
  const secret     = authHeader.replace(/^Bearer\s+/i, "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();

    // Fetch scheduled posts due for publishing
    const rows = await sql`
      SELECT id, body, cta_url, platform
      FROM content_posts
      WHERE status = 'scheduled'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 10
    ` as Record<string, unknown>[];

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, published: 0 });
    }

    let published = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const id       = Number(row.id);
      const body     = String(row.body ?? "");
      const cta_url  = row.cta_url ? String(row.cta_url) : null;
      const platform = String(row.platform ?? "telegram");

      // Only publish Telegram posts via bot; other platforms — mark published but skip
      let success = false;
      if (platform === "telegram") {
        const text = cta_url ? `${body}\n\n${cta_url}` : body;
        try {
          success = await publishToTelegram(text);
        } catch (err) {
          errors.push(`post #${id}: ${String(err)}`);
          success = false;
        }
      } else {
        // Non-telegram posts: just mark published (no bot for other platforms)
        success = true;
      }

      if (success) {
        await sql`
          UPDATE content_posts
          SET status = 'published', published_at = NOW()
          WHERE id = ${id}
        `;
        published++;
      }
    }

    return NextResponse.json({
      ok:        true,
      published,
      total:     rows.length,
      errors:    errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
