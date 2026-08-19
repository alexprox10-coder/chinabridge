import { getLLMConfig } from "@/lib/ai/client";
import { getLead } from "@/lib/crm/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SiteContacts {
  phones: string[];
  emails: string[];
  telegram: string | null;
  instagram: string | null;
  whatsapp: string | null;
  address: string | null;
}

export interface EnrichResult {
  ok: boolean;
  leadId: number;
  scoreLevel?: "HOT" | "WARM" | "COLD";
  leadScore?: number;
  selectedProduct?: string;
  businessSummary?: string;
  attackPlan?: Record<string, unknown>;
  messageShort?: string;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPage(url: string, timeoutMs = 7000): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function extractContacts(html: string): SiteContacts {
  const rawPhones = html.match(/(?:\+7|8|\+77)[\s\-.(]?\d{3,4}[\s\-)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g) ?? [];
  const phones = [...new Set(rawPhones.map((p) => p.replace(/[\s\-().]/g, "")))].slice(0, 5);

  const rawEmails = html.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/g) ?? [];
  const emails = [
    ...new Set(
      rawEmails.filter(
        (e) => !/(example|yourname|test@|noreply|no-reply|support@sentry|@sentry|@cloudflare|@w3\.org|schema\.org)/i.test(e),
      ),
    ),
  ].slice(0, 4);

  const tgMatch = html.match(/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})/);
  const telegram = tgMatch ? `https://t.me/${tgMatch[1]}` : null;

  const igMatch = html.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})\/?/);
  const instagram = igMatch ? `https://instagram.com/${igMatch[1]}` : null;

  const waMatch = html.match(/(?:wa\.me|whatsapp\.com\/send[?&]phone=)[\/?]?(\d{10,15})/);
  const whatsapp = waMatch ? `https://wa.me/${waMatch[1]}` : null;

  const addrMatch = html.match(/(?:адрес|address)[:\s]+([А-Яа-яA-Za-z0-9\s.,–\-]{10,100})/i);
  const address = addrMatch ? addrMatch[1].trim().slice(0, 100) : null;

  return { phones, emails, telegram, instagram, whatsapp, address };
}

function htmlToText(html: string, maxWords = 700): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ");
}

async function scrapeWebsite(rawUrl: string): Promise<{ content: string; contacts: SiteContacts; analyzed: boolean }> {
  const empty = {
    content: "",
    contacts: { phones: [], emails: [], telegram: null, instagram: null, whatsapp: null, address: null },
    analyzed: false,
  };
  if (!rawUrl) return empty;

  const base = rawUrl.startsWith("http") ? rawUrl.replace(/\/$/, "") : `https://${rawUrl.replace(/\/$/, "")}`;
  const [mainHtml, contactsHtml] = await Promise.all([
    fetchPage(base),
    fetchPage(`${base}/contacts`)
      .then((h) => h || fetchPage(`${base}/contact`))
      .then((h) => h || fetchPage(`${base}/о-нас`)),
  ]);

  if (!mainHtml && !contactsHtml) return empty;

  const combinedHtml = mainHtml + " " + contactsHtml;
  const contacts = extractContacts(combinedHtml);

  const titleMatch = mainHtml.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const descMatch =
    mainHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i) ||
    mainHtml.match(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const h1 = [...mainHtml.matchAll(/<h1[^>]*>([\s\S]{1,200}?)<\/h1>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join(" | ");

  const h2 = [...mainHtml.matchAll(/<h2[^>]*>([\s\S]{1,200}?)<\/h2>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(" | ");

  const bodyText = htmlToText(mainHtml, 600);
  const contactsText = contactsHtml ? htmlToText(contactsHtml, 200) : "";

  const content = [
    title ? `Заголовок: ${title}` : "",
    description ? `Мета-описание: ${description}` : "",
    h1 ? `H1: ${h1}` : "",
    h2 ? `Разделы (H2): ${h2}` : "",
    bodyText ? `Основной текст: ${bodyText}` : "",
    contactsText ? `Страница контактов: ${contactsText}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 3500);

  return { content, contacts, analyzed: true };
}

// ── Ensure AI columns exist ──────────────────────────────────────────────────

let aiColsReady = false;

export async function ensureAiColumns(sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>) {
  if (aiColsReady) return;
  try {
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_lead_score integer`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_score_level text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_score_factors jsonb`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_deal_probability integer`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_potential_min numeric`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_potential_max numeric`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_business_summary text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_pain_points jsonb`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_selected_product text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_attack_plan jsonb`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_call_script text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_contacts_found jsonb`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_message_short text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_offer text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_subject text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_offer_options jsonb`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_website_url text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS ai_analyzed_at text`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contact_attempts integer DEFAULT 0`;
    await sql`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS last_contact_at text`;
    aiColsReady = true;
  } catch (e) {
    console.error("[AI cols]", e);
  }
}

// ── Core enrichment logic ────────────────────────────────────────────────────

export async function enrichLead(leadId: number): Promise<EnrichResult> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  await ensureAiColumns(sql as Parameters<typeof ensureAiColumns>[0]);

  let lead = null;
  try {
    lead = await getLead(leadId, "tenant-chinabridge");
  } catch {
    return { ok: false, leadId, error: "lead not found" };
  }
  if (!lead) return { ok: false, leadId, error: "lead not found" };

  const { baseURL, apiKey, model } = getLLMConfig();

  const websiteUrl = lead.product_link || "";
  const { content: websiteContent, contacts, analyzed } = await scrapeWebsite(websiteUrl);

  const leadData = [
    lead.name ? `Контакт: ${lead.name}` : null,
    lead.company ? `Компания: ${lead.company}` : null,
    lead.phone ? `Телефон в CRM: ${lead.phone}` : null,
    lead.product ? `Товар/запрос: ${lead.product}` : null,
    lead.category ? `Категория (Google Maps): ${lead.category}` : null,
    lead.quantity ? `Количество: ${lead.quantity}` : null,
    lead.country_destination ? `Страна: ${lead.country_destination}` : null,
    lead.city_destination ? `Город: ${lead.city_destination}` : null,
    lead.comment ? `Комментарий: ${lead.comment}` : null,
    websiteUrl ? `Сайт: ${websiteUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const websiteSection = websiteContent
    ? `\n=== АНАЛИЗ САЙТА (${websiteUrl}) ===\n${websiteContent}\n=== КОНЕЦ АНАЛИЗА ===`
    : "";

  const foundContacts = [
    contacts.phones.length ? `Телефоны на сайте: ${contacts.phones.join(", ")}` : null,
    contacts.emails.length ? `Email на сайте: ${contacts.emails.join(", ")}` : null,
    contacts.telegram ? `Telegram: ${contacts.telegram}` : null,
    contacts.whatsapp ? `WhatsApp: ${contacts.whatsapp}` : null,
    contacts.address ? `Адрес: ${contacts.address}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Ты — Chief Sales Officer ChinaBridge, компании по организации импорта товаров из Китая в Казахстан и Россию.

Проанализируй лид и выдай полный AI Sales Cockpit.

Данные лида из CRM:
${leadData}
${foundContacts ? `\nКонтакты найдены на сайте:\n${foundContacts}` : ""}
${websiteSection}

=== ПРОДУКТЫ CHINABRIDGE (выбери наиболее подходящий) ===
| Что обнаружил у лида | Продукт ChinaBridge |
|---|---|
| Оптовый поставщик / реселлер | Поиск прямого производителя в Китае |
| Дорогой поставщик или посредник | Снижение закупочной цены (прямой производитель) |
| Регулярные закупки одного SKU | Регулярные поставки (контракт) |
| Маркетплейсы WB / Ozon / Kaspi | AI Unit Economics + Product Finder |
| Каталог / интернет-магазин | Поиск аналогов в Китае |
| Много SKU (50+) | Procurement / China Sourcing |
| Только нужна доставка | Карго / Консолидация |
| Уже работает с Китаем | Оптимизация цепочки поставок |
| Производство | Закупка сырья/компонентов из Китая |
| Не знает поставщиков | Supplier Finder |

=== ПРАВИЛА ЛОГИСТИКИ (КРИТИЧЕСКИ ВАЖНО) ===
- KZ / Казахстан: СЕРАЯ схема. Склад в Алматы. ЗАПРЕЩЕНО писать "таможня под ключ", "белая схема", "официальное оформление".
- RU / Россия: БЕЛАЯ схема через Суньфэньхэ. Можно писать "таможня под ключ".

=== CTA ССЫЛКИ ===
- Калькулятор: https://chinabridge.pro/delivery-calculator
- Доставка в KZ: https://chinabridge.pro/delivery/china-kazakhstan
- Поиск товаров: https://chinabridge.pro/product-finder

Выдай строго JSON без markdown-блоков:
{
  "lead_score": число 0-100,
  "score_level": "HOT" или "WARM" или "COLD",
  "score_factors": [{"label": "причина балла", "points": число}],
  "deal_potential_min": число в USD,
  "deal_potential_max": число в USD,
  "business_summary": "1-2 предложения: чем занимается компания",
  "product_categories": ["категория1"],
  "pain_points": ["боль1", "боль2"],
  "pain_analysis": "2-3 предложения",
  "selected_product": "название продукта ChinaBridge",
  "product_reason": "1 предложение — почему этот продукт",
  "offer_options": [
    {"title": "Оффер 1", "description": "2-3 предложения"},
    {"title": "Оффер 2", "description": "2-3 предложения альтернативы"}
  ],
  "attack_plan": {
    "response_probability": число 0-100,
    "deal_probability": число 0-100,
    "what_to_sell": "одна строка",
    "main_pain": "одна строка",
    "first_contact": "Телефон" или "WhatsApp" или "Email",
    "second_contact": "следующий канал",
    "best_contact": "лучший контакт из данных",
    "dont_do": "одна строка",
    "first_goal": "одна строка — цель первого контакта"
  },
  "call_script": "скрипт звонка 3-5 предложений",
  "message_short": "первое WhatsApp/Telegram сообщение 2-3 предложения + ссылка",
  "offer": "полноценное КП 6-8 предложений + ссылка",
  "subject": "тема письма"
}`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge AI Auto-Enrich",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
    } catch {
      // LLM returned malformed JSON — extract partial fields with regex fallback
      const scoreMatch = raw.match(/"lead_score"\s*:\s*(\d+)/);
      const levelMatch = raw.match(/"score_level"\s*:\s*"(HOT|WARM|COLD)"/);
      const summaryMatch = raw.match(/"business_summary"\s*:\s*"([^"]{10,200})"/);
      parsed = {
        lead_score: scoreMatch ? Number(scoreMatch[1]) : 50,
        score_level: levelMatch?.[1] ?? "WARM",
        business_summary: summaryMatch?.[1] ?? "Анализ получен частично",
        selected_product: "DIRECT_IMPORT",
      };
    }

    const now = new Date().toISOString();
    const contactsJson = JSON.stringify({
      phones: contacts.phones,
      emails: contacts.emails,
      telegram: contacts.telegram,
      whatsapp: contacts.whatsapp,
      instagram: contacts.instagram,
      address: contacts.address,
    });

    await sql`
      UPDATE crm_leads SET
        ai_lead_score       = ${parsed.lead_score ?? null},
        ai_score_level      = ${parsed.score_level ?? null},
        ai_score_factors    = ${JSON.stringify(parsed.score_factors ?? [])}::jsonb,
        ai_deal_probability = ${parsed.attack_plan?.deal_probability ?? null},
        ai_potential_min    = ${parsed.deal_potential_min ?? null},
        ai_potential_max    = ${parsed.deal_potential_max ?? null},
        ai_business_summary = ${parsed.business_summary ?? null},
        ai_pain_points      = ${JSON.stringify(parsed.pain_points ?? [])}::jsonb,
        ai_selected_product = ${parsed.selected_product ?? null},
        ai_attack_plan      = ${JSON.stringify(parsed.attack_plan ?? {})}::jsonb,
        ai_call_script      = ${parsed.call_script ?? null},
        ai_contacts_found   = ${contactsJson}::jsonb,
        ai_message_short    = ${parsed.message_short ?? null},
        ai_offer            = ${parsed.offer ?? null},
        ai_subject          = ${parsed.subject ?? null},
        ai_offer_options    = ${JSON.stringify(parsed.offer_options ?? [])}::jsonb,
        ai_website_url      = ${websiteUrl || null},
        ai_analyzed_at      = ${now},
        priority            = ${parsed.score_level ?? "COLD"},
        status              = CASE WHEN status = 'NEW' THEN 'RESEARCHED' ELSE status END,
        updated_at          = ${now}
      WHERE id = ${leadId}
    `;

    void analyzed; // used for tracking in caller

    return {
      ok: true,
      leadId,
      scoreLevel: parsed.score_level ?? "COLD",
      leadScore: parsed.lead_score ?? 0,
      selectedProduct: parsed.selected_product ?? "",
      businessSummary: parsed.business_summary ?? "",
      attackPlan: parsed.attack_plan ?? {},
      messageShort: parsed.message_short ?? "",
    };
  } catch (e) {
    console.error(`[enrich] lead ${leadId}:`, e);
    return { ok: false, leadId, error: String(e) };
  }
}
