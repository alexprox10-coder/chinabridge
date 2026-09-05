import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/crm/client";

export const runtime = "nodejs";

async function notifyManagerTelegram(data: {
  telegram: string;
  product: string;
  has_supplier: string;
  city: string;
  source?: string;
}) {
  const token = process.env.NEW_LK_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
  if (!token) return;

  const h = (s: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const supplierLabel = data.has_supplier === "yes" ? "✅ Поставщик есть" : "❌ Поставщика нет";
  const sourceLine = data.source ? `\n🌐 Источник: ${h(data.source)}` : "";

  const text = `🔥 <b>Новая заявка с лендинга!</b>${sourceLine}\n\n📲 Telegram: <b>${h(data.telegram)}</b>\n📦 <b>Товар:</b> ${h(data.product || "—")}\n🏭 ${supplierLabel}\n🗺 <b>Город:</b> ${h(data.city || "—")}\n\n⏱ Ответьте в течение 5 минут!`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const telegram = (body.telegram ?? "").trim();
  const product = (body.product ?? "").trim();
  const has_supplier = body.has_supplier ?? "no";
  const city = (body.city ?? "").trim();
  const source = body.source ?? "landing_elektronika";

  if (!telegram) {
    return NextResponse.json({ ok: false, error: "telegram_required" }, { status: 400 });
  }

  try {
    await createLead({
      lead_id: `landing-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: telegram,
      phone: "",
      telegram,
      email: "",
      company: "",
      product,
      product_link: "",
      category: "",
      quantity: "",
      weight: "",
      volume: "",
      country_destination: "",
      city_destination: city,
      delivery_type: "",
      service_type: "",
      status: "NEW",
      priority: "WARM",
      estimated_value: 0,
      manager: "",
      comment: `has_supplier: ${has_supplier}`,
      source,
      utm_source: "vk_ads",
      utm_campaign: "",
    });
  } catch {
    // не блокируем — уведомление важнее
  }

  await notifyManagerTelegram({ telegram, product, has_supplier, city, source });

  return NextResponse.json({ ok: true });
}
