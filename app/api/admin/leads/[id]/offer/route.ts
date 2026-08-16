import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/crm/client";
import { getLLMConfig } from "@/lib/ai/client";

async function scrapeWebsite(url: string): Promise<string> {
  if (!url) return "";
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChinaBridgeBot/1.0; +https://chinabridge.pro)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    const h1 = [...html.matchAll(/<h1[^>]*>([^<]{1,200})<\/h1>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, "").trim())
      .join(", ");
    const h2 = [...html.matchAll(/<h2[^>]*>([^<]{1,200})<\/h2>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, "").trim())
      .slice(0, 6)
      .join(", ");

    const clean = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const bodyText = clean.split(/\s+/).slice(0, 600).join(" ");

    return [
      title       ? `Заголовок: ${title}` : "",
      description ? `Описание: ${description}` : "",
      h1          ? `H1: ${h1}` : "",
      h2          ? `Разделы: ${h2}` : "",
      bodyText    ? `Контент: ${bodyText}` : "",
    ].filter(Boolean).join("\n").slice(0, 2500);
  } catch {
    return "";
  }
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

  // Скрапим сайт лида параллельно
  const websiteUrl = lead.product_link || "";
  const websiteContent = websiteUrl ? await scrapeWebsite(websiteUrl) : "";

  const context = [
    lead.name        ? `Клиент: ${lead.name}` : null,
    lead.company     ? `Компания: ${lead.company}` : null,
    lead.product     ? `Товар/запрос: ${lead.product}` : null,
    lead.category    ? `Категория: ${lead.category}` : null,
    lead.quantity    ? `Количество: ${lead.quantity}` : null,
    lead.weight      ? `Вес: ${lead.weight} кг` : null,
    lead.country_destination ? `Страна: ${lead.country_destination}` : null,
    lead.city_destination    ? `Город: ${lead.city_destination}` : null,
    lead.delivery_type       ? `Тип доставки: ${lead.delivery_type}` : null,
    lead.service_type        ? `Услуга: ${lead.service_type}` : null,
    lead.source              ? `Источник лида: ${lead.source}` : null,
    lead.comment             ? `Комментарий: ${lead.comment}` : null,
    websiteUrl               ? `Сайт: ${websiteUrl}` : null,
  ].filter(Boolean).join("\n");

  const websiteSection = websiteContent
    ? `\nАнализ сайта компании (${websiteUrl}):\n${websiteContent}`
    : "";

  const prompt = `Ты — менеджер ChinaBridge, платформы по импорту товаров из Китая в Казахстан и Россию.
Напиши персональное коммерческое предложение (КП) для компании на основе данных лида и анализа их сайта.

Данные лида:
${context}
${websiteSection}

Инструкции:
- Обратись по названию компании (если нет имени контакта)
- Покажи, что изучил их бизнес — упомяни конкретные товары или направления с их сайта (если есть)
- Объясни, как ChinaBridge может помочь именно этой компании с закупками из Китая
- Конкретные выгоды: экономия 20–40% на закупках, таможня под ключ, AI-поиск поставщиков, 25–35 дней до склада
- Если компания в Казахстане — упомяни склад в Алматы и работу с тенге
- Если категория торговый центр / стройматериалы / производство — адаптируй под их специфику
- Призыв: предложить созвониться или прислать расчёт конкретного товара
- Тон: деловой, но живой; без воды и шаблонных фраз
- Длина: 6–9 предложений

Ответь строго JSON: { "offer": "текст КП", "subject": "тема письма", "website_analyzed": ${websiteContent ? "true" : "false"} }`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Personal Offer",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 900,
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
    return NextResponse.json({
      ok: true,
      offer: parsed.offer ?? "",
      subject: parsed.subject ?? "",
      website_analyzed: !!websiteContent,
      website_url: websiteUrl || null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
