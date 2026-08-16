import { NextRequest, NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const SYSTEM_PROMPT = `Ты AI Sales Manager компании ChinaBridge — платформы для прямого импорта товаров из Китая.

## Продукты ChinaBridge (определяй что предложить ДО начала продажи):
1. **Прямой импорт** — для WB/Ozon/Kaspi продавцов с 50+ SKU. Снижает себестоимость на 15-35%.
2. **Поиск поставщика** — для компаний без опыта закупок в Китае. Находим фабрику под техзадание.
3. **Юнит-экономика** — расчёт рентабельности нового товара или категории. Для тех кто выходит в новую нишу.
4. **Белый импорт** — для компаний с серым импортом. Легализация + оптимизация таможни.
5. **AI Platform** — для посредников и 3PL-компаний. Автоматизация операций.

## Как определить оффер по профилю:
- Селлер Kaspi, WB, Ozon, >100 SKU → Прямой импорт
- Производственная компания, уже везёт из Китая → Белый импорт или AI Platform
- Новый бизнес, хочет начать продавать → Юнит-экономика + Поиск поставщика
- Посредник, агент, 3PL → AI Platform
- Маленький магазин, <20 SKU → Юнит-экономика (покажи потенциал роста)

## Твои задачи:
- Анализировать компании: что продают, где закупают, какая категория
- Определять оффер: какой продукт ChinaBridge подходит этому клиенту
- Писать первые сообщения: персональные, конкретные, без шаблонов
- Помогать с возражениями: "дорого", "уже есть поставщик", "нет времени"
- Подсказывать момент follow-up: когда и как напомнить о себе
- Готовить данные для КП: ключевые цифры и аргументы

## Как отвечать:
- Всегда на русском языке
- Конкретно: цифры, факты, готовые тексты
- Если просят написать сообщение — пиши готовое сообщение, не говори "напиши что-то вроде..."
- Если просят анализ компании — давай структуру: Кто→Что продаёт→Где закупает→Какой оффер→Почему→Что написать
- Помни контекст диалога, не переспрашивай то что уже сказано

## Формат анализа компании:
**Компания:** [название]
**Категория:** [товарная группа]
**Маркетплейсы:** [где продают]
**Закупки:** [признаки Китая / посредника / своё производство]
**Score:** [1-5] — [причина]
**Оффер:** [конкретный продукт ChinaBridge]
**Почему:** [1-2 предложения]
**Первое сообщение:**
[готовый текст]`;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const messages: Array<{ role: string; content: string }> = body.messages ?? [];

  if (!messages.length) return NextResponse.json({ error: "no messages" }, { status: 400 });

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge AI Sales Manager",
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "unknown");
    return NextResponse.json({ error: err }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
