// Parser Club / Telegram Webhook Intake
// POST /api/outbound/intake
// Protected by OUTBOUND_WEBHOOK_SECRET header
// OUTBOUND_ENABLE_AUTOREPLY=false is HARD default — never auto-sends messages

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { qualifyLead } from "@/lib/outbound/intake-qualifier";
import { scoreIntakeLead, buildFingerprint } from "@/lib/outbound/intake-scorer";
import { runOutboundMigrations } from "@/lib/outbound/migrations";

export const runtime = "nodejs";
export const maxDuration = 30;

// Hard default: NEVER auto-reply even if env is missing
const AUTOREPLY_ENABLED =
  process.env.OUTBOUND_ENABLE_AUTOREPLY === "true";  // must be explicitly "true"

if (AUTOREPLY_ENABLED) {
  // Safety guard — should never be true in V1
  throw new Error("OUTBOUND_ENABLE_AUTOREPLY must not be true in V1 — auto-reply is forbidden");
}

const WEBHOOK_SECRET = process.env.OUTBOUND_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth: OUTBOUND_WEBHOOK_SECRET or admin cookie
  const secret = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const isAdmin = req.cookies.get("cb_admin")?.value;

  if (!isAdmin && (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const text = String(body.text ?? body.message ?? body.content ?? "").trim();
  if (!text || text.length < 5) {
    return NextResponse.json({ ok: false, error: "text too short" }, { status: 400 });
  }

  const source = String(body.source ?? "parser_club").toLowerCase();
  const username = String(body.username ?? body.from ?? "").trim();
  const chat = String(body.chat ?? body.chat_id ?? "").trim();
  const approxDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Deduplication fingerprint
  const fingerprint = buildFingerprint(username, chat, text, approxDate);

  try {
    await runOutboundMigrations();
    const sql = neon(process.env.DATABASE_URL!);

    // Check for duplicate
    const existing = await sql`
      SELECT id, final_score, priority FROM outbound_lead_events
      WHERE fingerprint = ${fingerprint}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        event_id: existing[0].id,
        message: "duplicate fingerprint — skipped",
      });
    }

    // AI qualification
    const qual = await qualifyLead(text, { username, chat, source });

    // Score
    const score = scoreIntakeLead(qual);

    // Skip NOISE entirely
    if (qual.intent === "NOISE" || score.final_score < 5) {
      await sql`
        INSERT INTO outbound_lead_events
          (fingerprint, source, raw_text, tg_username, tg_chat, intent,
           lead_score, evidence_score, final_score, priority, stream,
           qualification_reason, key_signals, ai_reply_draft, product_hint, geography_hint)
        VALUES
          (${fingerprint}, ${source}, ${text}, ${username}, ${chat}, ${qual.intent},
           ${score.lead_score}, ${score.evidence_score}, ${score.final_score}, ${score.priority}, ${qual.stream},
           ${qual.qualification_reason}, ${JSON.stringify(qual.key_signals)},
           '', ${qual.product_hint}, ${qual.geography_hint})
      `;
      return NextResponse.json({ ok: true, intent: "NOISE", final_score: score.final_score });
    }

    // Save event
    const [event] = await sql`
      INSERT INTO outbound_lead_events
        (fingerprint, source, raw_text, tg_username, tg_chat, intent,
         lead_score, evidence_score, final_score, priority, stream,
         qualification_reason, key_signals, ai_reply_draft, product_hint, geography_hint)
      VALUES
        (${fingerprint}, ${source}, ${text}, ${username}, ${chat}, ${qual.intent},
         ${score.lead_score}, ${score.evidence_score}, ${score.final_score}, ${score.priority}, ${qual.stream},
         ${qual.qualification_reason}, ${JSON.stringify(qual.key_signals)},
         ${qual.ai_reply_draft}, ${qual.product_hint}, ${qual.geography_hint})
      RETURNING id
    `;

    // Telegram notification to manager for HOT/HIGH leads
    if (score.priority === "HOT" || score.priority === "HIGH") {
      await notifyManager(event.id, username, chat, qual, score, source, text);
    }

    return NextResponse.json({
      ok: true,
      event_id: event.id,
      intent: qual.intent,
      final_score: score.final_score,
      priority: score.priority,
      stream: qual.stream,
    });
  } catch (err) {
    console.error("[intake] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function notifyManager(
  eventId: string,
  username: string,
  chat: string,
  qual: Awaited<ReturnType<typeof qualifyLead>>,
  score: ReturnType<typeof scoreIntakeLead>,
  source: string,
  rawText: string
): Promise<void> {
  const BOT_TOKEN = process.env.LID_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
  const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID ?? "";
  if (!BOT_TOKEN || !MANAGER_CHAT_ID) return;

  const priorityEmoji = score.priority === "HOT" ? "🔥" : "⚡";
  const streamLabel = qual.stream === 1 ? "Stream 1 (China→KZ)" : qual.stream === 4 ? "Stream 4 (Поставщик)" : "—";
  const signals = qual.key_signals.slice(0, 3).join(", ") || "—";
  const adminUrl = `https://chinabridge.pro/admin/outbound/intake?id=${eventId}`;

  const msg = [
    `${priorityEmoji} *Новый лид — ${score.priority}* (${score.final_score}/100)`,
    `📌 Intent: \`${qual.intent}\` | Stream: ${streamLabel}`,
    `👤 Username: @${username || "anonymous"} | Чат: ${chat || source}`,
    `💬 Текст: ${rawText.slice(0, 150)}${rawText.length > 150 ? "…" : ""}`,
    `🔑 Сигналы: ${signals}`,
    `📝 Черновик ответа готов — одобрить в [Admin Panel](${adminUrl})`,
    `\n⚠️ Auto-reply ВЫКЛ — ответ требует одобрения`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: msg,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
}
