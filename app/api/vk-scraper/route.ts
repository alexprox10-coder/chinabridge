import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VK_TOKEN         = process.env.VK_SERVICE_TOKEN ?? "";
const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID  = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const SCRAPER_SECRET   = process.env.SCRAPER_SECRET ?? "chinabridge2026";
const VK_V             = "5.199";
const VK_API           = "https://api.vk.com/method";

// Фразы с явным намерением купить/найти услугу
const INTENT_KEYWORDS = [
  "ищу карго", "нужен карго", "посоветуйте карго", "порекомендуйте карго",
  "ищу доставку из китая", "нужна доставка из китая", "как привезти из китая",
  "ищу байера", "нужен байер", "ищу посредника в китае",
  "выкуп с 1688", "выкуп на 1688", "выкупить с 1688",
  "ищу поставщика в китае", "нужен поставщик из китая",
  "хочу привезти из китая", "кто возит из китая",
  "нужна растаможка", "помогите с растаможкой",
  "ищу фулфилмент", "нужен фулфилмент",
  "как заказать с taobao", "как заказать с 1688",
];

// Публичные VK-группы продавцов WB/Ozon и импортёров
const VK_GROUPS = [
  "wildberries_sellers",    // продавцы WB
  "marketplacewb",          // маркетплейс WB
  "wb_ozon_sellers",        // WB + Ozon
  "chinaoptom",             // оптом из Китая
  "china_buy",              // покупки из Китая
  "poizon_buyers_ru",       // покупатели Poizon
  "import_china_ru",        // импорт из Китая
  "wb_sellers_community",   // сообщество продавцов
  "ozon_marketplace_club",  // клуб продавцов Ozon
  "marketplace_sellers",    // продавцы маркетплейсов
];

interface VkPost {
  id:        number;
  owner_id:  number;
  text:      string;
  date:      number;
  from_id:   number;
  link:      string;
}

async function vkCall(method: string, params: Record<string, string | number>): Promise<unknown> {
  const p = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), access_token: VK_TOKEN, v: VK_V });
  const res = await fetch(`${VK_API}/${method}?${p}`, { signal: AbortSignal.timeout(8000) });
  const data = await res.json() as Record<string, unknown>;
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.response;
}

async function resolveGroupId(screenName: string): Promise<number | null> {
  try {
    const res = await vkCall("groups.getById", { group_id: screenName, fields: "id" }) as Array<{ id: number }>;
    return res?.[0]?.id ?? null;
  } catch { return null; }
}

async function searchGroupWall(groupId: number, query: string, sinceMs: number): Promise<VkPost[]> {
  try {
    const res = await vkCall("wall.search", {
      owner_id: -groupId,
      query,
      count: 100,
    }) as { items: Array<{ id: number; owner_id: number; text: string; date: number; from_id: number }> };
    return (res?.items ?? [])
      .filter(p => p.text && p.date * 1000 >= sinceMs)
      .map(p => ({ ...p, link: `https://vk.com/wall${p.owner_id}_${p.id}` }));
  } catch { return []; }
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
          content: `Это реальный человек, который ПРЯМО СЕЙЧАС ищет карго/доставку из Китая или поставщика? Ответь только HOT или COLD.\n\n"${text.slice(0, 400)}"`,
        }],
      }),
    });
    const data = await res.json() as { content?: Array<{ text: string }> };
    const label = (data.content?.[0]?.text ?? "").toUpperCase();
    return label.includes("HOT") ? "HOT" : "COLD";
  } catch { return "HOT"; }
}

async function notifyManager(post: VkPost, groupName: string) {
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const date = new Date(post.date * 1000).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

  await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:                  MANAGER_CHAT_ID,
      text:                     `🔥 <b>Горячий лид из ВКонтакте</b>\n\n👥 <b>${h(groupName)}</b>\n🕐 ${date}\n\n💬 ${h(post.text.slice(0, 600))}\n\n🔗 <a href="${post.link}">Открыть пост →</a>`,
      parse_mode:               "HTML",
      disable_web_page_preview: true,
    }),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  if (searchParams.get("secret") !== SCRAPER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!VK_TOKEN) {
    return NextResponse.json({ error: "VK_SERVICE_TOKEN не настроен" }, { status: 500 });
  }

  const days    = Math.min(parseInt(searchParams.get("days") ?? "7"), 30);
  const useAI   = searchParams.get("ai") !== "false";
  const sinceMs = Date.now() - days * 86400000;

  const candidates: Array<VkPost & { groupName: string; matchedKeyword: string }> = [];
  const groupErrors: string[] = [];

  for (const screenName of VK_GROUPS) {
    const groupId = await resolveGroupId(screenName);
    if (!groupId) { groupErrors.push(screenName); continue; }

    for (const kw of INTENT_KEYWORDS) {
      const posts = await searchGroupWall(groupId, kw, sinceMs);
      for (const p of posts) {
        if (!candidates.find(c => c.id === p.id && c.owner_id === p.owner_id)) {
          candidates.push({ ...p, groupName: screenName, matchedKeyword: kw });
        }
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }

  let sent = 0;
  const log: object[] = [];

  for (const post of candidates) {
    const intent = useAI ? await classifyIntent(post.text) : "HOT";
    if (intent === "HOT") {
      await notifyManager(post, post.groupName);
      await new Promise(r => setTimeout(r, 300));
      sent++;
    }
    log.push({
      group:   post.groupName,
      keyword: post.matchedKeyword,
      intent,
      preview: post.text.slice(0, 120),
      link:    post.link,
    });
  }

  return NextResponse.json({
    ok: true, checked: VK_GROUPS.length, period: `${days} days`,
    candidates: candidates.length, hot: sent,
    groupErrors, log,
  });
}
