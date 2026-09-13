// Human Approval — переводит лид из PERSONALIZED в READY_TO_CONTACT или отклоняет
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { outboundLeads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHAT_ID   = process.env.TELEGRAM_CHAT_ID ?? "8979087725";

async function notifyTelegram(lead: typeof outboundLeads.$inferSelect) {
  if (!TG_BOT_TOKEN) return;
  const text = [
    `✅ *ЛИД ОДОБРЕН — ГОТОВ К ОТПРАВКЕ*`,
    ``,
    `🏢 *${lead.companyName}*`,
    `🌍 ${lead.city}, ${lead.country === "KZ" ? "Казахстан" : "Россия"}`,
    `📂 Категория: ${lead.category}`,
    `🛒 Маркетплейс: ${lead.marketplace || "—"}`,
    ``,
    `📊 Opportunity Score: *${lead.opportunityScore}/100*`,
    ``,
    `💡 Причина обращения:`,
    lead.reasonToContact,
    ``,
    `💬 Сообщение:`,
    lead.personalizedMessage,
    ``,
    `📞 ${lead.phone || "—"} | 📧 ${lead.email || "—"}`,
    `🌐 ${lead.website || "—"}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: "Markdown",
    }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { outboundId, action, editedMessage } = body;
    // action: "approve" | "reject" | "edit_approve"

    if (!outboundId || !action) {
      return NextResponse.json({ ok: false, error: "outboundId and action required" }, { status: 400 });
    }

    const rows = await db.select().from(outboundLeads).where(eq(outboundLeads.outboundId, outboundId)).limit(1);
    if (!rows.length) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    const lead = rows[0];

    if (action === "reject") {
      await db.update(outboundLeads).set({
        stage: "FOUND",
        reasonToContact: "",
        personalizedMessage: "",
        updatedAt: new Date().toISOString(),
      }).where(eq(outboundLeads.outboundId, outboundId));
      return NextResponse.json({ ok: true, stage: "FOUND" });
    }

    const finalMessage = editedMessage ?? lead.personalizedMessage;

    await db.update(outboundLeads).set({
      stage: "READY_TO_CONTACT",
      personalizedMessage: finalMessage,
      approvedBy: "manager",
      approvedAt: new Date(),
      updatedAt: new Date().toISOString(),
    }).where(eq(outboundLeads.outboundId, outboundId));

    // Уведомление в Telegram
    await notifyTelegram({ ...lead, personalizedMessage: finalMessage });

    return NextResponse.json({ ok: true, stage: "READY_TO_CONTACT" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// Отметить как CONTACTED / REPLIED
export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { outboundId, stage, responseStatus, channel } = body;

    if (!outboundId) return NextResponse.json({ ok: false, error: "outboundId required" }, { status: 400 });

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (stage) update.stage = stage;
    if (responseStatus) update.responseStatus = responseStatus;
    if (channel) update.channel = channel;
    if (stage === "CONTACTED") {
      update.contactedAt = new Date();
      update.lastContactAt = new Date();
    }

    await db.update(outboundLeads).set(update).where(eq(outboundLeads.outboundId, outboundId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
