// Parser Club / Telegram Webhook Intake
// POST /api/outbound/intake
// Protected by OUTBOUND_WEBHOOK_SECRET header
// OUTBOUND_ENABLE_AUTOREPLY=false is HARD default — never auto-sends messages

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { qualifyLead } from "@/lib/outbound/intake-qualifier";
import { scoreIntakeLead, buildFingerprint, mapOffer } from "@/lib/outbound/intake-scorer";
import { runOutboundMigrations } from "@/lib/outbound/migrations";
import { logIntakeEvent } from "@/lib/outbound/intake-analytics";

export const runtime = "nodejs";
export const maxDuration = 30;

// HARD default: NEVER auto-reply — must be explicitly "true" and it will throw
const AUTOREPLY_ENABLED = process.env.OUTBOUND_ENABLE_AUTOREPLY === "true";
if (AUTOREPLY_ENABLED) {
  throw new Error("OUTBOUND_ENABLE_AUTOREPLY must not be true in V1");
}

const WEBHOOK_SECRET = process.env.OUTBOUND_WEBHOOK_SECRET ?? "";
const HOT_SCORE = Number(process.env.OUTBOUND_HOT_SCORE ?? 70);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const isAdmin = req.cookies.get("cb_admin")?.value;

  if (!isAdmin && (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }

  // §4.3 Universal payload mapping
  const text = String(
    body.text ?? body.message ?? body.content ?? body.raw_text ?? ""
  ).trim();
  if (!text || text.length < 5) {
    return NextResponse.json({ ok: false, error: "text too short" }, { status: 400 });
  }

  const source = String(body.source ?? "parser_club");
  const sourceType = String(body.source_type ?? "telegram_webhook");
  const externalId = String(body.external_id ?? body.message_id ?? "");
  const username = String(body.username ?? body.from ?? "").replace(/^@/, "");
  const chat = String(body.chat_name ?? body.chat ?? body.chat_id ?? "");
  const chatUrl = String(body.chat_url ?? body.source_url ?? "");
  const sourceUrl = String(body.source_url ?? body.message_url ?? "");
  const sourceMessageId = String(body.message_id ?? body.source_message_id ?? "");
  const authorName = String(body.author_name ?? body.name ?? "");
  const approxDate = new Date().toISOString().slice(0, 10);

  const fingerprint = buildFingerprint(username, chat, text, approxDate, externalId || undefined, externalId ? source : undefined);

  try {
    await runOutboundMigrations();
    const sql = neon(process.env.DATABASE_URL!);

    // Deduplication check
    const existing = await sql`
      SELECT id, final_score, priority FROM outbound_lead_events
      WHERE fingerprint = ${fingerprint} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true, event_id: existing[0].id });
    }

    // AI Qualification (includes retry §25)
    const { result: qual, normalizedText } = await qualifyLead(text, {
      username, chat, source, chat_url: chatUrl,
    });

    const score = scoreIntakeLead(qual);
    const offer = mapOffer(qual);

    const rawPayload: Record<string, unknown> = {
      source, source_type: sourceType, external_id: externalId,
      username, chat, chat_url: chatUrl, source_url: sourceUrl,
      author_name: authorName, text,
    };

    // §30 NOISE — save but skip CRM
    const isNoise = qual.intent === "NOISE" || score.final_score < 5;

    const [event] = await sql`
      INSERT INTO outbound_lead_events (
        fingerprint, source, source_type, external_id, raw_text, normalized_text,
        raw_payload, source_url, source_chat, source_message_id,
        tg_username, tg_chat, intent, intent_subtype,
        lead_score, evidence_score, final_score, confidence, priority, stream,
        country, city, destination, product, product_category,
        business_type, supplier_exists, supplier_source, weight_kg, volume_m3, packages, urgency,
        recommended_offer, qualification_reason, key_signals, evidence_data,
        ai_reply_draft, product_hint, geography_hint,
        processing_status, approval_status
      ) VALUES (
        ${fingerprint}, ${source}, ${sourceType}, ${externalId}, ${text}, ${normalizedText},
        ${JSON.stringify(rawPayload)}, ${sourceUrl}, ${chat}, ${sourceMessageId},
        ${username}, ${chat}, ${qual.intent}, ${qual.intent_subtype},
        ${score.lead_score}, ${score.evidence_score}, ${score.final_score},
        ${qual.confidence}, ${score.priority}, ${qual.stream},
        ${qual.country}, ${qual.city}, ${qual.destination},
        ${qual.product ?? ""}, ${qual.product_category},
        ${qual.business_type}, ${qual.supplier_exists ?? null}, ${qual.supplier_source ?? ""},
        ${qual.weight_kg}, ${qual.volume_m3}, ${qual.packages}, ${qual.urgency ?? ""},
        ${offer}, ${qual.qualification_reason},
        ${JSON.stringify(qual.key_signals)}, ${JSON.stringify(qual.evidence)},
        ${qual.ai_reply_draft}, ${qual.product_hint}, ${qual.geography_hint},
        ${"processed"}, ${"PENDING"}
      ) RETURNING id
    `;

    const eventId = event.id;

    // §31 Analytics logging
    await logIntakeEvent(sql, "lead_received", eventId, source, qual.country, qual.stream, score.final_score);
    if (isNoise) {
      await logIntakeEvent(sql, "lead_rejected", eventId, source, qual.country, qual.stream, score.final_score);
    } else {
      await logIntakeEvent(sql, "lead_classified", eventId, source, qual.country, qual.stream, score.final_score);
      if (score.priority === "HOT") {
        await logIntakeEvent(sql, "lead_hot", eventId, source, qual.country, qual.stream, score.final_score);
      } else if (score.priority === "HIGH") {
        await logIntakeEvent(sql, "lead_high", eventId, source, qual.country, qual.stream, score.final_score);
      }
    }

    // TG notification for HOT/HIGH
    if (!isNoise && score.final_score >= HOT_SCORE - 10) {
      await notifyManager(eventId, username, chat, qual, score, source, text, offer)
        .catch(() => {});
      if (score.final_score >= HOT_SCORE) {
        await logIntakeEvent(sql, "lead_notification_sent", eventId, source, qual.country, qual.stream, score.final_score);
      }
    }

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      intent: qual.intent,
      final_score: score.final_score,
      priority: score.priority,
      stream: qual.stream,
      country: qual.country,
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
  qual: Awaited<ReturnType<typeof qualifyLead>>["result"],
  score: ReturnType<typeof scoreIntakeLead>,
  source: string,
  rawText: string,
  offer: string
): Promise<void> {
  const BOT_TOKEN = process.env.LID_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
  const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID ?? "";
  if (!BOT_TOKEN || !MANAGER_CHAT_ID) return;

  const priorityEmoji = score.priority === "HOT" ? "🔥" : "⚡";
  const streamLabel = qual.stream === 1 ? "Stream 1 (China→KZ)" : qual.stream === 4 ? "Stream 4 (Поставщик)" : "—";
  const cargoInfo = [
    qual.weight_kg && `${qual.weight_kg} кг`,
    qual.volume_m3 && `${qual.volume_m3} м³`,
    qual.packages && `${qual.packages} мест`,
  ].filter(Boolean).join(", ") || "—";

  const signals = qual.key_signals.slice(0, 3).join(", ") || "—";
  const adminUrl = `https://chinabridge.pro/admin/outbound/intake?id=${eventId}`;

  const lines = [
    `${priorityEmoji} *${score.priority} лид* | Score: ${score.final_score}/100 | Evidence: ${qual.evidence_score}`,
    `📌 ${qual.intent} | ${streamLabel}`,
    `🌍 ${qual.country}${qual.city ? " · " + qual.city : ""}${qual.destination ? " → " + qual.destination : ""}`,
    qual.product ? `📦 ${qual.product}` : null,
    qual.supplier_exists ? `✅ Поставщик есть${qual.supplier_source ? ` (${qual.supplier_source})` : ""}` : null,
    cargoInfo !== "—" ? `⚖️ ${cargoInfo}` : null,
    qual.urgency ? `⏰ Срочность: ${qual.urgency}` : null,
    `💡 Оффер: ${offer}`,
    `👤 @${username || "anon"} | ${chat || source}`,
    `💬 _"${rawText.slice(0, 120)}${rawText.length > 120 ? "…" : ""}"_`,
    `🔑 Сигналы: ${signals}`,
    ``,
    `📋 [Открыть лид и черновик ответа](${adminUrl})`,
    `⚠️ Auto-reply OFF — ответ требует одобрения`,
  ].filter(l => l !== null).join("\n");

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: lines,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
}
