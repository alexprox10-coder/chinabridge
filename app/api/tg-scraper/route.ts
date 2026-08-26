import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const SCRAPER_SECRET    = process.env.SCRAPER_SECRET ?? "chinabridge2026";
const APIFY_TOKEN       = process.env.APIFY_API_TOKEN ?? "";

// Apify actor ID для Telegram Chat Scraper (agentx/telegram-chat-scraper)
const APIFY_ACTOR_ID = "CTS2Fv7KyZuiQeSJ8";

// Публичные каналы (проверено — имеют веб-превью)
const TARGETS = [
  "mpgo_ru",
  "marketplace_russia",
  "cargo_china_official",
  "ozon_seller",
  "cargo_poizon",
  "china_seller",
  "chinadelivery",
  "poizon_shop_ru",
  "kargo_rf",
  "wildberries_sellers",
];

const CARGO_KEYWORDS = [
  "карго", "cargo", "доставка из китая", "доставку из китая",
  "привезти из китая", "заказать из китая", "везти из китая",
  "поставщик из китая", "поставщика из китая",
  "байер", "посредник китай", "1688", "alibaba", "алибаба",
  "растаможк", "таможн", "выкуп", "фулфилмент",
  "wb поставщик", "ozon поставщик", "wildberries поставщик",
];

interface ApifyMessage {
  id?:          number;
  text?:        string;
  date?:        string;
  source_url?:  string;
  view_count?:  number;
  sender_name?: string;
  chat_username?: string;
}

// ── Apify: запустить актор для одного канала ───────────────────────────────────
async function scrapeViaApify(username: string, days: number): Promise<ApifyMessage[]> {
  if (!APIFY_TOKEN) return [];

  const startDate = days === 1 ? "1 day" : `${days} days`;

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=50`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_url:    `https://t.me/${username}`,
          download_medias: "text",
          max_results:     50,
          start_date:      startDate,
        }),
        signal: AbortSignal.timeout(55000),
      }
    );

    if (!res.ok) {
      console.error(`Apify error for ${username}: ${res.status}`);
      return [];
    }

    const items: ApifyMessage[] = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error(`Apify timeout/error for ${username}:`, e);
    return [];
  }
}

// ── Claude Haiku — классификация намерения ─────────────────────────────────────
async function classifyIntent(text: string): Promise<"HOT" | "WARM" | "COLD"> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{
          role:    "user",
          content: `Classify this Telegram message. Reply ONE word: HOT (person actively seeking cargo/China delivery NOW), WARM (interested, not urgent), COLD (news/info/no buying intent).\n\nMessage: "${text.slice(0, 300)}"`,
        }],
      }),
    });
    const data  = await res.json();
    const label = (data.content?.[0]?.text ?? "").trim().toUpperCase();
    if (label.includes("HOT"))  return "HOT";
    if (label.includes("WARM")) return "WARM";
    return "COLD";
  } catch {
    return "WARM";
  }
}

// ── Уведомление менеджеру ──────────────────────────────────────────────────────
async function notifyManager(msg: ApifyMessage, channel: string, intent: "HOT" | "WARM") {
  const h = (s: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const emoji = intent === "HOT" ? "🔥" : "♨️";
  const label = intent === "HOT" ? "Горячий лид" : "Тёплый лид";
  const views  = msg.view_count ? `\n👁 <b>Просмотров:</b> ${msg.view_count}` : "";
  const author = msg.sender_name ? `\n👤 <b>Автор:</b> ${h(msg.sender_name)}` : "";
  const date   = msg.date ? `\n🕐 ${new Date(msg.date).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}` : "";
  const link   = msg.source_url ?? `https://t.me/${channel}`;

  await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:                 MANAGER_CHAT_ID,
      text:                    `${emoji} <b>${label}</b>\n\n📢 <b>@${channel}</b>${author}${views}${date}\n\n💬 ${h(msg.text ?? "")}…\n\n🔗 <a href="${link}">Открыть пост →</a>`,
      parse_mode:              "HTML",
      disable_web_page_preview: true,
    }),
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (searchParams.get("secret") !== SCRAPER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not set" }, { status: 500 });
  }

  const days  = Math.min(parseInt(searchParams.get("days") ?? "1"), 7);
  const useAI = searchParams.get("ai") !== "false";

  // Скрапим каналы через Apify — по одному (синхронно) чтобы не перегружать
  let allMessages: { msg: ApifyMessage; channel: string }[] = [];

  for (const channel of TARGETS) {
    const items = await scrapeViaApify(channel, days);
    for (const item of items) {
      if (!item.text || item.text.length < 15) continue;
      const lower = item.text.toLowerCase();
      if (CARGO_KEYWORDS.some(kw => lower.includes(kw))) {
        allMessages.push({ msg: item, channel });
      }
    }
  }

  // Классифицируем и уведомляем
  let hotCount = 0, warmCount = 0;
  const log: object[] = [];

  for (const { msg, channel } of allMessages) {
    let intent: "HOT" | "WARM" | "COLD" = "WARM";
    if (useAI) intent = await classifyIntent(msg.text ?? "");

    if (intent !== "COLD") {
      await notifyManager(msg, channel, intent);
      await new Promise(r => setTimeout(r, 300));
      if (intent === "HOT") hotCount++; else warmCount++;
    }

    log.push({ channel, intent, preview: (msg.text ?? "").slice(0, 100) });
  }

  return NextResponse.json({
    ok:         true,
    checked:    TARGETS.length,
    period:     `${days} day(s)`,
    candidates: allMessages.length,
    hot:        hotCount,
    warm:       warmCount,
    log,
  });
}
