import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const SCRAPER_SECRET    = process.env.SCRAPER_SECRET ?? "chinabridge2026";

// Публичные каналы с веб-превью (проверено — возвращают посты)
const TARGETS = [
  "mpgo_ru", "marketplace_russia", "cargo_china_official",
  "ozon_seller", "cargo_poizon", "china_seller",
  "chinadelivery", "poizon_shop_ru", "kargo_rf",
  "wildberries_sellers", "ozon_wb_biznes", "poizon_cargo",
];

// Только фразы с явным намерением КУПИТЬ/НАЙТИ — не слова из новостей
const INTENT_KEYWORDS = [
  "ищу карго", "нужен карго", "посоветуйте карго", "порекомендуйте карго",
  "ищу доставку из китая", "нужна доставка из китая", "как привезти из китая",
  "ищу поставщика", "нужен поставщик", "посоветуйте поставщика",
  "ищу байера", "нужен байер", "ищу посредника",
  "выкуп с 1688", "выкуп на 1688", "выкупить с 1688",
  "выкуп с alibaba", "выкупить alibaba",
  "хочу привезти из китая", "буду везти из китая",
  "кто занимается карго", "кто возит из китая",
  "нужна растаможка", "помогите с растаможкой",
  "сколько стоит карго", "карго цена",
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

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseMessages(html: string, channel: string): TgMessage[] {
  const messages: TgMessage[] = [];
  const postRe = /data-post="([^"]+)"/g;
  let pm: RegExpExecArray | null;
  const posts: { dataPost: string; idx: number }[] = [];
  while ((pm = postRe.exec(html)) !== null) {
    posts.push({ dataPost: pm[1], idx: pm.index });
  }
  for (let i = 0; i < posts.length; i++) {
    const chunk = html.slice(posts[i].idx, posts[i + 1]?.idx ?? html.length);
    const tMatch = chunk.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text   = tMatch ? stripHtml(tMatch[1]).slice(0, 800) : "";
    if (!text || text.length < 20) continue;
    const dMatch = chunk.match(/datetime="([^"]+)"/);
    const vMatch = chunk.match(/message_views[^>]*>([\w.,]+)</);
    const aMatch = chunk.match(/from_author[^>]*>([\s\S]*?)<\/span>/);
    messages.push({
      channel,
      messageId: posts[i].dataPost.split("/").pop() ?? "",
      text,
      date:   dMatch ? dMatch[1] : "",
      views:  vMatch ? vMatch[1] : "",
      author: aMatch ? stripHtml(aMatch[1]) : "",
      link:   `https://t.me/${posts[i].dataPost}`,
    });
  }
  return messages;
}

async function scrapeChannel(username: string, sinceMs: number): Promise<TgMessage[]> {
  const results: TgMessage[] = [];
  let beforeId: number | null = null;

  for (let page = 0; page < 5; page++) {
    const url = beforeId
      ? `https://t.me/s/${username}?before=${beforeId}`
      : `https://t.me/s/${username}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) break;
      const html = await res.text();
      const msgs  = parseMessages(html, username);
      if (!msgs.length) break;

      let oldest = Infinity;
      for (const m of msgs) {
        const ts = m.date ? new Date(m.date).getTime() : 0;
        if (ts && ts < sinceMs) continue;
        // Фильтр: только фразы с намерением
        const lower = m.text.toLowerCase();
        if (INTENT_KEYWORDS.some(kw => lower.includes(kw))) {
          results.push(m);
        }
        if (ts && ts < oldest) oldest = ts;
      }

      if (oldest < sinceMs) break; // все старше нужного периода
      const ids = msgs.map(m => parseInt(m.messageId)).filter(Boolean);
      if (!ids.length) break;
      beforeId = Math.min(...ids);
      await new Promise(r => setTimeout(r, 400));
    } catch { break; }
  }
  return results;
}

async function classifyIntent(text: string): Promise<"HOT" | "COLD"> {
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
        max_tokens: 5,
        messages: [{
          role:    "user",
          content: `Is this a REAL person actively looking to buy cargo/delivery service from China RIGHT NOW? Reply HOT or COLD only.\n\n"${text.slice(0, 300)}"`,
        }],
      }),
    });
    const data = await res.json();
    const label = (data.content?.[0]?.text ?? "").toUpperCase();
    return label.includes("HOT") ? "HOT" : "COLD";
  } catch {
    return "HOT"; // fallback — лучше переслать
  }
}

async function notifyManager(msg: TgMessage) {
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const views  = msg.views  ? `\n👁 ${msg.views}` : "";
  const author = msg.author ? `\n👤 ${h(msg.author)}` : "";
  const date   = msg.date   ? `\n🕐 ${new Date(msg.date).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}` : "";

  await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:                 MANAGER_CHAT_ID,
      text:                    `🔥 <b>Горячий лид из Telegram</b>\n\n📢 <b>@${msg.channel}</b>${author}${views}${date}\n\n💬 ${h(msg.text)}\n\n🔗 <a href="${msg.link}">Открыть пост →</a>`,
      parse_mode:              "HTML",
      disable_web_page_preview: true,
    }),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  if (searchParams.get("secret") !== SCRAPER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days    = Math.min(parseInt(searchParams.get("days") ?? "7"), 30);
  const useAI   = searchParams.get("ai") !== "false";
  const sinceMs = Date.now() - days * 86400000;

  const all: TgMessage[] = [];
  for (const ch of TARGETS) {
    const msgs = await scrapeChannel(ch, sinceMs);
    all.push(...msgs);
  }

  let sent = 0;
  const log: object[] = [];

  for (const msg of all) {
    const intent = useAI ? await classifyIntent(msg.text) : "HOT";
    if (intent === "HOT") {
      await notifyManager(msg);
      await new Promise(r => setTimeout(r, 300));
      sent++;
    }
    log.push({ channel: msg.channel, intent, preview: msg.text.slice(0, 100) });
  }

  return NextResponse.json({
    ok: true, checked: TARGETS.length,
    period: `${days} days`, candidates: all.length,
    hot: sent, log,
  });
}
