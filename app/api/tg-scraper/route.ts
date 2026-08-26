import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const SCRAPER_SECRET    = process.env.SCRAPER_SECRET ?? "chinabridge2026";

const CHANNELS = [
  "marketp_wildberries",
  "mpgo_ru",
  "kargo0717",
  "alibiz5_cargo",
  "cargovik",
  "dobropost_chat",
  "wb_postavshiki",
  "ozon_partner",
  "china_logistics_ru",
  "cargo_china_official",
];

// Только фразы с явным намерением — не одиночные слова
const HOT_KEYWORDS = [
  "ищу карго",
  "нужна доставка из китая",
  "нужен карго",
  "нужен поставщик из китая",
  "ищу поставщика из китая",
  "ищу байера",
  "нужен байер",
  "ищу посредника китай",
  "помогите найти карго",
  "посоветуйте карго",
  "выкуп с 1688",
  "выкуп на 1688",
  "выкуп с alibaba",
  "выкуп с алибаба",
  "везу из китая",
  "хочу везти из китая",
  "планирую доставку из китая",
  "ищу доставку из китая",
  "кто возит из китая",
  "кто делает доставку из китая",
  "как доставить из китая",
  "где найти карго",
  "карго посоветуйте",
  "нужна растаможка",
  "помогите с таможней",
];

interface ScrapedMessage {
  channel: string;
  text: string;
  link: string;
  matchedKeyword: string;
}

async function scrapeChannel(username: string): Promise<ScrapedMessage[]> {
  const results: ScrapedMessage[] = [];
  try {
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return results;

    const html = await res.text();

    // Extract message blocks
    const messageRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    const linkRegex = /data-post="([^"]+)"/g;

    const texts: string[] = [];
    const links: string[] = [];

    let m: RegExpExecArray | null;
    while ((m = messageRegex.exec(html)) !== null) {
      // Strip HTML tags, decode entities
      const raw = m[1]
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (raw.length > 10) texts.push(raw);
    }

    while ((m = linkRegex.exec(html)) !== null) {
      links.push(`https://t.me/${m[1]}`);
    }

    for (let i = 0; i < texts.length; i++) {
      const lower = texts[i].toLowerCase();
      const matched = HOT_KEYWORDS.find(kw => lower.includes(kw));
      if (matched) {
        results.push({
          channel: username,
          text: texts[i].slice(0, 400),
          link: links[i] ?? `https://t.me/${username}`,
          matchedKeyword: matched,
        });
      }
    }
  } catch {
    // channel unavailable or timeout — skip silently
  }
  return results;
}

async function sendToBot(msg: ScrapedMessage) {
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: `🔍 <b>Горячий пост из канала</b>\n\n📢 <b>@${msg.channel}</b>\n🔑 <i>«${h(msg.matchedKeyword)}»</i>\n\n💬 ${h(msg.text)}\n\n🔗 <a href="${msg.link}">Открыть пост</a>`,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SCRAPER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found: ScrapedMessage[] = [];

  // Scrape all channels in parallel
  const results = await Promise.allSettled(CHANNELS.map(ch => scrapeChannel(ch)));
  for (const r of results) {
    if (r.status === "fulfilled") found.push(...r.value);
  }

  // Send all matches to bot
  for (const msg of found) {
    await sendToBot(msg);
    await new Promise(r => setTimeout(r, 300)); // rate limit
  }

  return NextResponse.json({
    ok: true,
    checked: CHANNELS.length,
    found: found.length,
    matches: found.map(m => ({ channel: m.channel, keyword: m.matchedKeyword })),
  });
}
