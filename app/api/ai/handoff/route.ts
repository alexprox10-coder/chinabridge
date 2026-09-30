import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createLead } from "@/lib/crm/client";

export const runtime = "nodejs";

const db = () => neon(process.env.DATABASE_URL!);

async function notifyManagerTelegram(text: string) {
  const token = process.env.NEW_LK_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => null);
}

// "Передать поставку ChinaBridge" — превращает завершённый AI-анализ в реальный лид:
// создаёт запись в CRM и уведомляет менеджера, чтобы дальше вёл сделку человек.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });

  const analysisId: string = body.analysis_id ?? "";
  const userTelegram: string = (body.user_telegram ?? "").trim();

  if (!userTelegram) {
    return NextResponse.json({ error: "user_telegram required" }, { status: 400 });
  }

  const sql = db();
  let productDescription = "";
  let reasoning = "";

  if (analysisId) {
    const rows = (await sql`
      SELECT product_description, reasoning FROM ai_analyses WHERE id = ${analysisId}
    `) as Array<{ product_description: string | null; reasoning: string | null }>;
    productDescription = rows[0]?.product_description ?? "";
    reasoning = rows[0]?.reasoning ?? "";
    if (analysisId) {
      await sql`UPDATE ai_analyses SET status = 'submitted' WHERE id = ${analysisId}`.catch(() => null);
    }
  }

  const leadId = `ai-chat-${analysisId || Date.now()}`;

  try {
    await createLead({
      lead_id: leadId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: "",
      phone: "",
      telegram: userTelegram,
      email: "",
      company: "",
      product: productDescription,
      product_link: "",
      category: "",
      quantity: "",
      weight: "",
      volume: "",
      country_destination: "",
      city_destination: "",
      delivery_type: "",
      service_type: "ai_full_analysis",
      status: "RESEARCHED",
      priority: "HOT",
      estimated_value: 0,
      manager: "",
      comment: reasoning.slice(0, 2000),
      source: "ai_chat",
      utm_source: "ai_chat",
      utm_campaign: "",
      vertical: "ai_import_manager",
    });
  } catch (e) {
    console.error("[ai/handoff] createLead failed:", e);
  }

  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await notifyManagerTelegram(
    `🤝 <b>Клиент передал поставку в работу из ChinaBridge AI</b>\n\n` +
      `📲 Telegram: ${h(userTelegram)}\n` +
      `📦 <b>Запрос:</b> ${h(productDescription || "—")}\n\n` +
      `${h(reasoning.slice(0, 800))}\n\n⏱ Свяжитесь с клиентом.`,
  );

  return NextResponse.json({ ok: true, lead_id: leadId });
}
