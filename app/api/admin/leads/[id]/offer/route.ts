import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/crm/client";
import { getLLMConfig } from "@/lib/ai/client";

interface SiteContacts {
  phones: string[];
  emails: string[];
  telegram: string | null;
  instagram: string | null;
  whatsapp: string | null;
  address: string | null;
}

function extractContacts(html: string): SiteContacts {
  // Phones: Russian/Kazakh formats
  const rawPhones = html.match(/(?:\+7|8|\+77)[\s\-.(]?\d{3,4}[\s\-)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g) ?? [];
  const phones = [...new Set(rawPhones.map(p => p.replace(/[\s\-().]/g, "")))].slice(0, 5);

  // Emails — filter out common fake/service ones
  const rawEmails = html.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/g) ?? [];
  const emails = [
    ...new Set(
      rawEmails.filter(e =>
        !/(example|yourname|test@|noreply|no-reply|support@sentry|@sentry|@cloudflare|@w3\.org|schema\.org)/i.test(e)
      )
    ),
  ].slice(0, 4);

  const tgMatch = html.match(/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})/);
  const telegram = tgMatch ? `https://t.me/${tgMatch[1]}` : null;

  const igMatch = html.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})\/?/);
  const instagram = igMatch ? `https://instagram.com/${igMatch[1]}` : null;

  const waMatch = html.match(/(?:wa\.me|whatsapp\.com\/send[?&]phone=)[\/?]?(\d{10,15})/);
  const whatsapp = waMatch ? `https://wa.me/${waMatch[1]}` : null;

  // Address — rough heuristic: line after "адрес" or "address"
  const addrMatch = html.match(/(?:адрес|address)[:\s]+([А-Яа-яA-Za-z0-9\s.,–\-]{10,100})/i);
  const address = addrMatch ? addrMatch[1].trim().slice(0, 100) : null;

  return { phones, emails, telegram, instagram, whatsapp, address };
}

async function fetchPage(url: string, timeoutMs = 7000): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

async function scrapeWebsite(rawUrl: string): Promise<{
  content: string;
  contacts: SiteContacts;
  analyzed: boolean;
}> {
  const empty = { content: "", contacts: { phones: [], emails: [], telegram: null, instagram: null, whatsapp: null, address: null }, analyzed: false };
  if (!rawUrl) return empty;

  const base = rawUrl.startsWith("http") ? rawUrl.replace(/\/$/, "") : `https://${rawUrl.replace(/\/$/, "")}`;

  // Fetch main page + contacts page in parallel
  const [mainHtml, contactsHtml] = await Promise.all([
    fetchPage(base),
    fetchPage(`${base}/contacts`).then(h => h || fetchPage(`${base}/contact`)).then(h => h || fetchPage(`${base}/о-нас`)),
  ]);

  if (!mainHtml && !contactsHtml) return empty;

  const combinedHtml = mainHtml + " " + contactsHtml;
  const contacts = extractContacts(combinedHtml);

  // Extract structured info from main page
  const titleMatch = mainHtml.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const descMatch =
    mainHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i) ||
    mainHtml.match(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const h1 = [...mainHtml.matchAll(/<h1[^>]*>([\s\S]{1,200}?)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join(" | ");

  const h2 = [...mainHtml.matchAll(/<h2[^>]*>([\s\S]{1,200}?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(" | ");

  const h3 = [...mainHtml.matchAll(/<h3[^>]*>([\s\S]{1,200}?)<\/h3>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(" | ");

  const bodyText = htmlToText(mainHtml, 600);
  const contactsText = contactsHtml ? htmlToText(contactsHtml, 200) : "";

  const content = [
    title       ? `Заголовок: ${title}` : "",
    description ? `Мета-описание: ${description}` : "",
    h1          ? `H1: ${h1}` : "",
    h2          ? `Разделы (H2): ${h2}` : "",
    h3          ? `Подразделы (H3): ${h3}` : "",
    bodyText    ? `Основной текст: ${bodyText}` : "",
    contactsText ? `Страница контактов: ${contactsText}` : "",
  ].filter(Boolean).join("\n").slice(0, 3500);

  return { content, contacts, analyzed: true };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  let lead = null;
  try {
    lead = await getLead(Number(id), "tenant-chinabridge");
  } catch {
    return NextResponse.json({ ok: false, error: "lead not found" }, { status: 404 });
  }
  if (!lead) return NextResponse.json({ ok: false, error: "lead not found" }, { status: 404 });

  const { baseURL, apiKey, model } = getLLMConfig();

  const websiteUrl = lead.product_link || "";
  const { content: websiteContent, contacts, analyzed } = await scrapeWebsite(websiteUrl);

  const leadData = [
    lead.name        ? `Контакт: ${lead.name}` : null,
    lead.company     ? `Компания: ${lead.company}` : null,
    lead.phone       ? `Телефон в CRM: ${lead.phone}` : null,
    lead.product     ? `Товар/запрос: ${lead.product}` : null,
    lead.category    ? `Категория (Google Maps): ${lead.category}` : null,
    lead.quantity    ? `Количество: ${lead.quantity}` : null,
    lead.country_destination ? `Страна: ${lead.country_destination}` : null,
    lead.city_destination    ? `Город: ${lead.city_destination}` : null,
    lead.comment             ? `Комментарий: ${lead.comment}` : null,
    websiteUrl               ? `Сайт: ${websiteUrl}` : null,
  ].filter(Boolean).join("\n");

  const websiteSection = websiteContent
    ? `\n=== АНАЛИЗ САЙТА (${websiteUrl}) ===\n${websiteContent}\n=== КОНЕЦ АНАЛИЗА ===`
    : "";

  const foundContacts = [
    contacts.phones.length  ? `Телефоны на сайте: ${contacts.phones.join(", ")}` : null,
    contacts.emails.length  ? `Email на сайте: ${contacts.emails.join(", ")}` : null,
    contacts.telegram       ? `Telegram: ${contacts.telegram}` : null,
    contacts.whatsapp       ? `WhatsApp: ${contacts.whatsapp}` : null,
    contacts.address        ? `Адрес: ${contacts.address}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `Ты — эксперт по B2B продажам и аналитик ChinaBridge (платформа импорта товаров из Китая в Казахстан и Россию).

Данные лида из CRM:
${leadData}

${foundContacts ? `Контакты найденные на сайте:\n${foundContacts}\n` : ""}
${websiteSection}

ЗАДАНИЕ — выполни в одном ответе два блока:

1. АНАЛИЗ БИЗНЕСА И БОЛИ:
   - Что конкретно продаёт/делает компания (товары, услуги, направления)
   - Ключевые боли при закупках (выбери 2-3 наиболее релевантных):
     * Высокие закупочные цены у местных посредников
     * Длинные сроки поставки (2-3 месяца)
     * Проблемы с таможенным оформлением
     * Нестабильное качество товара
     * Нет прямого выхода на производителей в Китае
     * Сложности с оплатой в Китай (санкции, конвертация)
     * Не знают реальную цену FOB у производителя
   - Почему ChinaBridge может закрыть эти боли

2. ПЕРСОНАЛЬНОЕ КП (текст для отправки компании):
   - Обратись к компании по имени
   - Покажи что знаешь их бизнес — назови 1-2 конкретных товара/категории с их сайта
   - Напрямую назови их боль: "Знаем, что у производителей профилей главная проблема — ..."
   - Объясни как именно ChinaBridge закрывает эту боль
   - Конкретные цифры: экономия 20-40%, 25-35 дней до склада
   - КРИТИЧЕСКИ ВАЖНО — схема доставки зависит от страны:
     * Если KZ / Казахстан: схема СЕРАЯ (без официального таможенного оформления). Упомяни склад в Алматы, оплату в тенге, Kaspi. НЕ ПИШИ слова "таможня под ключ", "официальное оформление", "белая схема" — это будет неправдой.
     * Если RU / Россия: белая доставка через Суньфэньхэ, можно писать "таможня под ключ".
   - Призыв: прислать расчёт по конкретному товару или созвониться
   - Длина: 7-10 предложений, живой деловой тон, без клише

Ответь строго JSON (без markdown-блоков):
{
  "business_summary": "1-2 предложения: чем занимается компания",
  "product_categories": ["товар1", "товар2"],
  "pain_points": ["боль1 — почему", "боль2 — почему"],
  "pain_analysis": "2-3 предложения: почему именно эти боли актуальны для этой компании",
  "offer": "текст КП",
  "subject": "тема письма для email/WhatsApp"
}`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge AI Offer v2",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1400,
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());

    return NextResponse.json({
      ok: true,
      offer: parsed.offer ?? "",
      subject: parsed.subject ?? "",
      business_summary: parsed.business_summary ?? "",
      product_categories: parsed.product_categories ?? [],
      pain_points: parsed.pain_points ?? [],
      pain_analysis: parsed.pain_analysis ?? "",
      website_analyzed: analyzed,
      website_url: websiteUrl || null,
      contacts_found: {
        phones: contacts.phones,
        emails: contacts.emails,
        telegram: contacts.telegram,
        whatsapp: contacts.whatsapp,
        instagram: contacts.instagram,
        address: contacts.address,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
