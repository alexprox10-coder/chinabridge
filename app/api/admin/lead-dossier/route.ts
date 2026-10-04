import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

// ─── Firecrawl helpers ────────────────────────────────────────────────────────

async function fcScrape(url: string, maxChars = 4000): Promise<string> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        excludeTags: ["nav", "footer", "script", "style"],
        timeout: 15000,
      }),
      signal: AbortSignal.timeout(18000),
    });
    if (!r.ok) return "";
    const d = await r.json();
    return ((d.data?.markdown ?? d.markdown ?? "") as string).slice(0, maxChars);
  } catch {
    return "";
  }
}

async function fcCrawl(url: string, limit = 4, maxChars = 6000): Promise<string> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        limit,
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) return "";
    const d = await r.json();
    // Firecrawl crawl returns { success, id } for async or { data: [...] } for sync
    const pages = Array.isArray(d.data) ? d.data : [];
    return pages
      .map((p: { markdown?: string }) => p.markdown ?? "")
      .join("\n\n---PAGE---\n\n")
      .slice(0, maxChars);
  } catch {
    return "";
  }
}

// ─── Social link extraction ───────────────────────────────────────────────────

interface SocialLinks {
  vk?: string;
  youtube?: string;
  telegram?: string;
  instagram?: string;
  odnoklassniki?: string;
  avito?: string;
  wildberries?: string;
  ozon?: string;
}

function extractSocialLinks(text: string): SocialLinks {
  const m = (pattern: RegExp) => {
    const match = text.match(pattern);
    return match ? match[0] : undefined;
  };
  return {
    vk: m(/https?:\/\/vk\.com\/[a-zA-Z0-9._-]+/),
    youtube: m(/https?:\/\/(www\.)?youtube\.com\/(channel|@|c\/)[a-zA-Z0-9._-]+/),
    telegram: m(/https?:\/\/t\.me\/[a-zA-Z0-9._-]+/),
    instagram: m(/https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/),
    odnoklassniki: m(/https?:\/\/ok\.ru\/[a-zA-Z0-9._-]+/),
    avito: m(/https?:\/\/www\.avito\.ru\/[a-zA-Z0-9/_-]+/),
    wildberries: m(/https?:\/\/(www\.)?wildberries\.ru\/[^\s"']+/),
    ozon: m(/https?:\/\/(www\.)?ozon\.ru\/[^\s"']+/),
  };
}

// ─── Source scrapers ──────────────────────────────────────────────────────────

async function scrapeHH(companyName: string): Promise<string> {
  // Search HH.ru for this company's vacancies
  const query = encodeURIComponent(companyName.replace(/ООО|АО|ПАО|ИП|«|»|"/g, "").trim());
  const url = `https://hh.ru/search/vacancy?text=${query}&area=0&search_field=company_name`;
  return fcScrape(url, 3000);
}

async function scrapeVK(companyName: string, inn?: string): Promise<string> {
  const query = encodeURIComponent(inn ?? companyName.replace(/«|»|"/g, "").trim());
  const searchUrl = `https://vk.com/search?c[q]=${query}&c[section]=communities`;
  return fcScrape(searchUrl, 3000);
}

async function scrapeYoutube(companyName: string): Promise<string> {
  const query = encodeURIComponent(companyName.replace(/ООО|АО|ПАО|ИП|«|»|"/g, "").trim());
  return fcScrape(`https://www.youtube.com/results?search_query=${query}`, 2000);
}

async function scrapeDgis(companyName: string, region: string): Promise<string> {
  const query = encodeURIComponent(`${companyName.replace(/«|»|"/g, "").trim()} ${region}`);
  return fcScrape(`https://2gis.ru/search/${query}`, 2000);
}

async function scrapeYandexMap(companyName: string): Promise<string> {
  const query = encodeURIComponent(companyName.replace(/«|»|"/g, "").trim());
  return fcScrape(`https://yandex.ru/maps/?text=${query}`, 2000);
}

// ─── AI synthesis ─────────────────────────────────────────────────────────────

interface DossierResult {
  collected_at: string;
  website_content: string;
  social_links: SocialLinks;
  vk_content: string;
  vk_profile_content: string;
  youtube_content: string;
  hh_content: string;
  dgis_content: string;
  // AI output fields
  online_presence: string;
  social_profiles_found: string;
  vk_analysis: string;
  yt_analysis: string;
  hh_analysis: string;
  buying_signals: string;
  digital_ads_found: string;
  decision_makers_online: string;
  best_outreach_channel: string;
  best_outreach_message: string;
  intelligence_summary: string;
  online_score: "A" | "B" | "C" | "D";
}

async function synthesizeDossier(
  companyName: string,
  extra: Record<string, unknown>,
  data: {
    websiteContent: string;
    socialLinks: SocialLinks;
    vkSearch: string;
    vkProfile: string;
    ytSearch: string;
    hhContent: string;
    dgisContent: string;
  }
): Promise<Omit<DossierResult, "collected_at" | "website_content" | "social_links" | "vk_content" | "vk_profile_content" | "youtube_content" | "hh_content" | "dgis_content">> {
  const orBase = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const orKey = process.env.OPENROUTER_API_KEY ?? "";
  const orModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o";

  const revenue = extra.revenue ? `${Math.round(Number(extra.revenue) / 1_000_000)} млн ₽` : "неизвестна";
  const director = extra.director as string | null;
  const existingAnalysis = extra.what_they_sell ?? extra.product_category ?? "";

  const prompt = `Ты — специалист по OSINT и цифровой разведке лидов. Проанализируй всю доступную онлайн-информацию о компании "${companyName}".

БАЗОВЫЕ ДАННЫЕ:
- Выручка: ${revenue}
- Директор: ${director ?? "неизвестен"}
- Что продают: ${existingAnalysis}
- Регион: ${extra.region ?? "неизвестен"}

ДАННЫЕ С САЙТА (${extra.site_url ?? "нет"}):
${data.websiteContent ? data.websiteContent.slice(0, 2000) : "Сайт недоступен"}

НАЙДЕННЫЕ СОЦСЕТИ:
VK: ${data.socialLinks.vk ?? "не найден в автоматическом поиске"}
YouTube: ${data.socialLinks.youtube ?? "не найден"}
Telegram: ${data.socialLinks.telegram ?? "не найден"}
Instagram: ${data.socialLinks.instagram ?? "не найден"}
Маркетплейсы: WB=${data.socialLinks.wildberries ?? "нет"}, Ozon=${data.socialLinks.ozon ?? "нет"}

VK ПОИСК ПО КОМПАНИИ:
${data.vkSearch ? data.vkSearch.slice(0, 1500) : "нет данных"}

VK ПРОФИЛЬ (если найден):
${data.vkProfile ? data.vkProfile.slice(0, 1500) : "нет данных"}

YOUTUBE ПОИСК:
${data.ytSearch ? data.ytSearch.slice(0, 1000) : "нет данных"}

ВАКАНСИИ HH.RU:
${data.hhContent ? data.hhContent.slice(0, 1500) : "нет вакансий"}

2GIS / КАРТЫ:
${data.dgisContent ? data.dgisContent.slice(0, 1000) : "нет данных"}

Верни строго JSON без markdown:
{
  "online_presence": "Краткая оценка: есть ли компания в сети, насколько активна — 1-2 предложения",

  "social_profiles_found": "Список найденных профилей с URL и кратким описанием каждого, или 'не найдено'",

  "vk_analysis": "Анализ ВКонтакте: есть ли группа, сколько подписчиков, как часто постят, что продвигают, есть ли реклама — или 'ВК не найден'",

  "yt_analysis": "Анализ YouTube: есть ли канал, тематика, активность — или 'YouTube не найден'",

  "hh_analysis": "Анализ вакансий: что ищут сейчас, сколько вакансий, какие отделы растут — это сигнал о закупках и развитии бизнеса",

  "buying_signals": "Сигналы закупочной активности: упоминания поставщиков, закупок, тендеров, партнёров на сайте/соцсетях",

  "digital_ads_found": "Есть ли реклама компании в сети: VK Ads, Яндекс.Директ, таргет — что нашлось или 'рекламы не обнаружено'",

  "decision_makers_online": "ЛПРы в соцсетях: директор/закупщик найден в VK/LinkedIn/TG? Имя + профиль если нашлись",

  "best_outreach_channel": "Лучший канал для первого контакта на основе онлайн-присутствия: VK / TG / Email / WhatsApp / Звонок — с обоснованием",

  "best_outreach_message": "Готовое первое сообщение (3-5 предложений) с учётом их онлайн-активности. Упомяни что-то конкретное с их соцсети/сайта чтобы показать что изучили их",

  "intelligence_summary": "Полный разведывательный отчёт: онлайн-присутствие + что нашлось + выводы для продаж + 3 конкретных шага для выхода на этого клиента",

  "online_score": "A (активная онлайн-жизнь, реклама, маркетплейсы) / B (есть соцсети, умеренная активность) / C (минимальное присутствие) / D (не найдены ни сайт, ни соцсети)"
}`;

  const defaultResult = {
    online_presence: "Нет данных",
    social_profiles_found: "Не найдено",
    vk_analysis: "ВК не найден",
    yt_analysis: "YouTube не найден",
    hh_analysis: "Вакансий не найдено",
    buying_signals: "Не обнаружено",
    digital_ads_found: "Рекламы не обнаружено",
    decision_makers_online: "Не найдены",
    best_outreach_channel: "Телефон",
    best_outreach_message: "",
    intelligence_summary: "Анализ не удался",
    online_score: "D" as const,
  };

  if (!orKey) return defaultResult;

  try {
    const r = await fetch(`${orBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${orKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Lead Dossier",
      },
      body: JSON.stringify({
        model: orModel,
        max_tokens: 2500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return defaultResult;
    const aiData = await r.json();
    const raw = (aiData.choices?.[0]?.message?.content ?? "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultResult;
    return { ...defaultResult, ...JSON.parse(jsonMatch[0]) };
  } catch {
    return defaultResult;
  }
}

// ─── GET — load dossier ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  const rows = await sql`
    SELECT id, company_name, inn, region, okvad_name, status
    FROM outreach_contacts
    WHERE id = ${id} AND source = 'kontur_compass'
  `;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const r = rows[0];
  let extra: Record<string, unknown> = {};
  try { extra = JSON.parse(r.okvad_name as string ?? "{}"); } catch {}

  return NextResponse.json({
    ok: true,
    lead: {
      id: r.id,
      company_name: r.company_name,
      inn: r.inn,
      region: r.region,
      status: r.status,
      ...extra,
    },
    dossier: extra.dossier ?? null,
  });
}

// ─── POST — collect dossier ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await req.json();

  const rows = await sql`
    SELECT id, company_name, inn, region, okvad_name
    FROM outreach_contacts
    WHERE id = ${id} AND source = 'kontur_compass'
  `;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const r = rows[0];
  let extra: Record<string, unknown> = {};
  try { extra = JSON.parse(r.okvad_name as string ?? "{}"); } catch {}

  const companyName = r.company_name as string;
  const siteUrl = extra.site_url as string | null;
  const region = (r.region ?? extra.region ?? "") as string;

  // Run all scrapes in parallel
  const [websiteContent, vkSearch, ytSearch, hhContent, dgisContent] = await Promise.all([
    siteUrl ? fcCrawl(siteUrl, 4, 6000) : Promise.resolve(""),
    scrapeVK(companyName, r.inn as string | undefined),
    scrapeYoutube(companyName),
    scrapeHH(companyName),
    scrapeDgis(companyName, region),
  ]);

  // Extract social links from website
  const socialLinks = extractSocialLinks(websiteContent);

  // Scrape found social profiles in parallel
  const [vkProfile] = await Promise.all([
    socialLinks.vk ? fcScrape(socialLinks.vk, 3000) : Promise.resolve(""),
  ]);

  // AI synthesis
  const aiResult = await synthesizeDossier(companyName, extra, {
    websiteContent,
    socialLinks,
    vkSearch,
    vkProfile,
    ytSearch,
    hhContent,
    dgisContent,
  });

  const dossier: DossierResult = {
    collected_at: new Date().toISOString(),
    website_content: websiteContent.slice(0, 3000),
    social_links: socialLinks,
    vk_content: vkSearch.slice(0, 2000),
    vk_profile_content: vkProfile.slice(0, 2000),
    youtube_content: ytSearch.slice(0, 1000),
    hh_content: hhContent.slice(0, 2000),
    dgis_content: dgisContent.slice(0, 1000),
    ...aiResult,
  };

  extra.dossier = dossier;

  await sql`
    UPDATE outreach_contacts
    SET okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true, dossier });
}
