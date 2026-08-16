import { NextRequest, NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 30;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { company, category, website, city, imports, china_signals, description, source } = body;

  if (!company) return NextResponse.json({ error: "company required" }, { status: 400 });

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ offer: fallbackOffer(category, imports) });

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Offer Selector",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты эксперт по продажам ChinaBridge — платформы для прямого импорта из Китая.

Продукты ChinaBridge:
1. DIRECT_IMPORT — Прямой импорт: для WB/Ozon/Kaspi продавцов с 50+ SKU, снижение себестоимости 15-35%
2. SUPPLIER_SEARCH — Поиск поставщика: для компаний без опыта закупок в Китае
3. UNIT_ECONOMICS — Юнит-экономика: расчёт рентабельности нового товара/категории
4. WHITE_IMPORT — Белый импорт: легализация серых схем, таможенная оптимизация
5. AI_PLATFORM — AI Platform: для посредников и 3PL компаний, автоматизация операций

Определи оффер и верни JSON:
{
  "product": "DIRECT_IMPORT" | "SUPPLIER_SEARCH" | "UNIT_ECONOMICS" | "WHITE_IMPORT" | "AI_PLATFORM",
  "product_label": "Название на русском",
  "confidence": 0-100,
  "why": "Конкретная причина почему именно этот продукт (2-3 предложения)",
  "pain": "Главная боль этого клиента которую мы решаем",
  "value_prop": "Конкретная ценность для этой компании (с цифрами если возможно)",
  "first_message": "Готовое персонализированное сообщение для первого контакта (3-4 предложения, без 'Уважаемый' и без шаблонов)",
  "score": 1-5,
  "potential": "низкий" | "средний" | "высокий" | "очень высокий"
}`,
        },
        {
          role: "user",
          content: `Компания: ${company}
Сайт: ${website || "—"}
Категория: ${category || "—"}
Город: ${city || "—"}
Импорт: ${imports || "unknown"}
Сигналы Китая: ${(china_signals || []).join(", ") || "нет"}
Источник: ${source || "—"}
Описание: ${description || "—"}

Определи наилучший оффер.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) return NextResponse.json({ offer: fallbackOffer(category, imports) });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const offer = JSON.parse(raw);
  return NextResponse.json({ offer });
}

function fallbackOffer(category: string, imports: string) {
  const isImporter = imports === "yes" || imports === "likely";
  return {
    product: isImporter ? "DIRECT_IMPORT" : "SUPPLIER_SEARCH",
    product_label: isImporter ? "Прямой импорт" : "Поиск поставщика",
    confidence: 60,
    why: isImporter
      ? "Компания импортирует товары, вероятно через посредников. Прямой импорт снизит себестоимость."
      : `Компания в категории "${category}" может закупать товары в Китае.`,
    pain: "Высокая себестоимость товара из-за посредников",
    value_prop: "Снижение себестоимости на 15-35% через прямые закупки",
    first_message: `Добрый день! Изучили вашу компанию в категории "${category}" и увидели потенциал для снижения себестоимости товаров. Готовы бесплатно сделать расчёт и показать цифры.`,
    score: 3,
    potential: "средний",
  };
}
