import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/crm/client";
import { getLLMConfig } from "@/lib/ai/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  let lead;
  try {
    lead = await getLead(Number(id), "tenant-chinabridge");
  } catch {
    return NextResponse.json({ ok: false, error: "lead not found" }, { status: 404 });
  }

  const { url, model, headers } = getLLMConfig();

  const context = [
    lead.name ? `Клиент: ${lead.name}` : null,
    lead.company ? `Компания: ${lead.company}` : null,
    lead.product ? `Товар/запрос: ${lead.product}` : null,
    lead.category ? `Категория: ${lead.category}` : null,
    lead.quantity ? `Количество: ${lead.quantity}` : null,
    lead.weight ? `Вес: ${lead.weight} кг` : null,
    lead.country_destination ? `Страна: ${lead.country_destination}` : null,
    lead.city_destination ? `Город: ${lead.city_destination}` : null,
    lead.delivery_type ? `Тип доставки: ${lead.delivery_type}` : null,
    lead.service_type ? `Услуга: ${lead.service_type}` : null,
    lead.source ? `Источник лида: ${lead.source}` : null,
    lead.comment ? `Комментарий: ${lead.comment}` : null,
    lead.product_link ? `Ссылка на товар: ${lead.product_link}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `Ты — менеджер ChinaBridge, платформы по импорту из Китая.
Напиши персональное сообщение-оффер для клиента на основе его заявки.

Данные клиента:
${context}

Требования к офферу:
- Неформальный, но профессиональный тон
- Обратись по имени (если есть)
- Упомяни конкретный товар/запрос клиента
- Объясни, чем ChinaBridge поможет именно в этом кейсе
- Укажи конкретные преимущества: экономия 20–40%, таможня под ключ, AI-поиск поставщика, 25–35 дней до склада
- Если есть маркетплейс в категории (WB, Ozon, Kaspi) — упомяни фулфилмент
- Если Казахстан — упомяни склад в Алматы
- Добавь призыв к действию: предложить созвониться или прислать расчёт
- Длина: 5–8 предложений, без воды
- Только текст сообщения, без subject и заголовков

Ответь JSON: { "offer": "текст оффера", "subject": "тема письма если по email" }`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 600,
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json({ ok: true, offer: parsed.offer ?? "", subject: parsed.subject ?? "" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
