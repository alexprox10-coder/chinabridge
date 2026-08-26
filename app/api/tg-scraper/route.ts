import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const SCRAPER_SECRET    = process.env.SCRAPER_SECRET ?? "chinabridge2026";

// Публичные группы и каналы для мониторинга
const TARGETS = [
  "marketp_wildberries",
  "mpgo_logistics",
  "kargo0717",
  "alibiz5_cargo",
  "cargovik",
  "dobropost_chat",
  "sellerswb",
  "wb_ozon_mp",
  "china_tovar",
  "logistic_china",
  "marketplace_chat_ru",
  "ozon_sellers_chat",
];

// Первичный фильтр — быстрая проверка по ключам (без AI)
const CARGO_KEYWORDS = [
  "карго", "cargo", "доставка из китая", "доставку из китая",
  "везти из китая", "привезти из китая", "заказать из китая",
  "поставщик из китая", "поставщика из китая",
  "байер", "посредник китай", "1688", "alibaba", "алибаба",
  "растаможк", "таможн", "фрахт", "логистик", "фулфилмент",
  "wildberries поставщик", "wb поставщик", "ozon поставщик",
];

interface TgMessage {
  channel:   string;
  messageId: string;
  text:      string;
  date:      string;
  views:     string;
  author:    string;
  link:      string;
}

// ── HTML Parser ────────────────────────────────────────────────────────────────
function parseMessages(html: string, channel: string): TgMessage[] {
  const messages: TgMessage[] = [];

  // Разбиваем на блоки сообщений
  const blockRe = /<div[^>]+class="[^"]*tgme_widget_message\b[^"]*"[^>]*data-post="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let block: RegExpExecArray | null;

  while ((block = blockRe.exec(html)) !== null) {
    const dataPost = block[1]; // e.g. "channelname/123"
    const body     = block[2];

    // Текст сообщения
    const textMatch = body.match(/<div[^>]+class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const rawText   = textMatch
      ? textMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
          .trim()
      : "";

    if (!rawText || rawText.length < 15) continue;

    // Дата
    const dateMatch = body.match(/<time[^>]+datetime="([^"]+)"/);
    const date      = dateMatch ? dateMatch[1] : "";

    // Просмотры
    const viewsMatch = body.match(/<span[^>]+class="[^"]*tgme_widget_message_views[^"]*"[^>]*>([\d.,KkMm]+)<\/span>/);
    const views      = viewsMatch ? viewsMatch[1] : "";

    // Автор (виден в группах)
    const authorMatch = body.match(/<span[^>]+class="[^"]*tgme_widget_message_from_author[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    const author      = authorMatch
      ? authorMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    const parts     = dataPost.split("/");
    const messageId = parts[parts.length - 1] ?? "";
    const link      = `https://t.me/${dataPost}`;

    messages.push({ channel, messageId, text: rawText.slice(0, 600), date, views, author, link });
  }

  return messages;
}

// ── Scrape one channel ─────────────────────────────────────────────────────────
async function scrapeChannel(username: string, since?: Date): Promise<TgMessage[]> {
  const results: TgMessage[] = [];
  try {
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return results;

    const html = await res.text();
    const msgs  = parseMessages(html, username);

    for (const m of msgs) {
      // Фильтр по дате
      if (since && m.date) {
        const msgDate = new Date(m.date);
        if (!isNaN(msgDate.getTime()) && msgDate < since) continue;
      }

      // Первичный фильтр по ключевым словам
      const lower = m.text.toLowerCase();
      const hit   = CARGO_KEYWORDS.some(kw => lower.includes(kw));
      if (hit) results.push(m);
    }
  } catch {
    // timeout или недоступен — пропускаем
  }
  return results;
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
          content: `Classify this Telegram message. Reply with ONE word: HOT (person actively looking for cargo/China delivery service RIGHT NOW), WARM (interested but not urgent), or COLD (just news/info/discussion, no buying intent).\n\nMessage: "${text}"`,
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

// ── Send to manager ────────────────────────────────────────────────────────────
async function notifyManager(msg: TgMessage, intent: "HOT" | "WARM") {
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const emoji = intent === "HOT" ? "🔥" : "♨️";
  const label = intent === "HOT" ? "Горячий лид" : "Тёплый лид";
  const dateStr = msg.date ? new Date(msg.date).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }) : "";
  const authorStr = msg.author ? `\n👤 <b>Автор:</b> ${h(msg.author)}` : "";
  const viewsStr  = msg.views  ? `\n👁 <b>Просмотры:</b> ${msg.views}` : "";
  const dateDisp  = dateStr     ? `\n🕐 <b>Дата:</b> ${dateStr}` : "";

  await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: `${emoji} <b>${label} из Telegram</b>\n\n📢 <b>@${msg.channel}</b>${authorStr}${viewsStr}${dateDisp}\n\n💬 ${h(msg.text)}\n\n🔗 <a href="${msg.link}">Открыть пост →</a>`,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

// ── Debug handler — один канал, без фильтров ───────────────────────────────────
async function debugChannel(username: string) {
  const res = await fetch(`https://t.me/s/${username}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();

  // Простой вытаскиватель текста — без сложного regex
  const simpleTexts: string[] = [];
  const re = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const t = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (t.length > 10) simpleTexts.push(t.slice(0, 200));
  }

  return {
    status:      res.status,
    htmlLength:  html.length,
    htmlSample:  html.slice(0, 1500),
    messagesFound: simpleTexts.length,
    messages:    simpleTexts.slice(0, 10),
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (searchParams.get("secret") !== SCRAPER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Debug mode: ?debug=1&channel=marketp_wildberries
  if (searchParams.get("debug") === "1") {
    const ch = searchParams.get("channel") ?? "marketp_wildberries";
    const info = await debugChannel(ch);
    return NextResponse.json(info);
  }

  // Параметры: ?days=1 (за сколько дней смотреть, default 1)
  const days   = Math.min(parseInt(searchParams.get("days") ?? "1"), 7);
  const useAI  = searchParams.get("ai") !== "false"; // ?ai=false отключает Claude
  const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Скрапим все каналы параллельно
  const rawResults = await Promise.allSettled(TARGETS.map(t => scrapeChannel(t, since)));

  const candidates: TgMessage[] = [];
  for (const r of rawResults) {
    if (r.status === "fulfilled") candidates.push(...r.value);
  }

  // Классифицируем и уведомляем
  let hotCount  = 0;
  let warmCount = 0;
  const log: object[] = [];

  for (const msg of candidates) {
    let intent: "HOT" | "WARM" | "COLD" = "WARM";

    if (useAI && process.env.ANTHROPIC_API_KEY) {
      intent = await classifyIntent(msg.text);
    }

    if (intent !== "COLD") {
      await notifyManager(msg, intent);
      await new Promise(r => setTimeout(r, 300));
      if (intent === "HOT") hotCount++; else warmCount++;
    }

    log.push({ channel: msg.channel, intent, preview: msg.text.slice(0, 80) });
  }

  return NextResponse.json({
    ok: true,
    checked: TARGETS.length,
    period: `${days} day(s) since ${since.toISOString()}`,
    candidates: candidates.length,
    hot: hotCount,
    warm: warmCount,
    log,
  });
}
