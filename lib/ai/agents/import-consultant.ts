import { callLLM } from "../client";
import { getLLMHistory } from "../memory";
import type { ConversationState, AgentResult } from "../types";

export interface CalcContext {
  product_name: string;
  unit_price_cny: number;
  sale_price_rub: number;
  quantity: number;
  weight_kg: number;
  marketplace: string;
  city_to: string;
  country_to: string;
  verdict: "green" | "yellow" | "red";
  verdict_label: string;
  margin_pct: number;
  roi_pct: number;
  net_profit_per_unit: number;
  delivery_rub: number | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  cny_rate: number;
}

function buildSystem(ctx: CalcContext): string {
  const isKZ = ctx.country_to === "KZ" || ctx.marketplace === "kaspi";
  const currency = isKZ ? "₸" : "₽";
  const deliveryLine = ctx.delivery_rub
    ? `Доставка уже рассчитана: ${Math.round(ctx.delivery_rub).toLocaleString("ru-RU")} ${currency} (${ctx.delivery_days_min}–${ctx.delivery_days_max} дней)`
    : "Стоимость доставки уточняется отдельно";

  return `Ты — Алексей, AI-консультант ChinaBridge по импорту товаров из Китая.

КОНТЕКСТ РАСЧЁТА КЛИЕНТА:
- Товар: ${ctx.product_name}
- Закупочная цена: ${ctx.unit_price_cny} ¥ (~${(ctx.unit_price_cny * ctx.cny_rate).toFixed(0)} ₽)
- Цена продажи: ${ctx.sale_price_rub.toLocaleString("ru-RU")} ${currency}
- Количество: ${ctx.quantity} шт
- Маржа: ${ctx.margin_pct.toFixed(1)}%
- ROI: ${ctx.roi_pct.toFixed(0)}%
- Прибыль с единицы: ${Math.round(ctx.net_profit_per_unit).toLocaleString("ru-RU")} ${currency}
- Маркетплейс: ${ctx.marketplace.toUpperCase()}
- Назначение: ${ctx.city_to}, ${ctx.country_to}
- Вердикт: ${ctx.verdict_label} (${ctx.verdict})
- ${deliveryLine}

ТВОЯ ЗАДАЧА — КОНВЕРТИРОВАТЬ КЛИЕНТА В ЛИД:
Клиент только что просчитал экономику. Тебе нужно:
1. Квалифицировать намерение (HOT/WARM/COLD)
2. Задать не более 5 уточняющих вопросов
3. Показать ценность (конкретные цифры, ROI, экономия)
4. Получить контакт (Telegram или телефон)

СЦЕНАРИИ (определи по первому сообщению):
- HOT: хочет заказать, спрашивает "как начать", "когда можно отправить", "сколько нужно денег"
- WARM: интересуется, хочет понять процесс, просит консультацию
- COLD: просто изучает, "на будущее", много вопросов без конкретики
- NEW: не понимает схему, задаёт базовые вопросы

ПРАВИЛА:
- Отвечай на русском, кратко и конкретно (2-4 предложения)
- Используй цифры из расчёта — они уже вычислены, не повторяй расчёт
- После 2-3 обменов — запроси контакт (Telegram или телефон)
- После получения контакта — верни isLeadReady: true
- Никогда не говори "я не могу", "я не знаю" — предлагай конкретный следующий шаг
- Не задавай больше 1 вопроса за раз

КОГДА ЗАПРАШИВАТЬ КОНТАКТ:
- HOT: после первого ответа
- WARM: после 2-3 обменов
- COLD: после показа конкретной выгоды

ФОРМАТ ОТВЕТА — строго JSON:
{
  "message": "текст ответа клиенту",
  "intent": "HOT" | "WARM" | "COLD" | "NEW" | null,
  "leadScore": 0-100,
  "askingForContact": true | false,
  "isLeadReady": true | false,
  "contactType": "telegram" | "phone" | null,
  "contactValue": "значение или null"
}`;
}

export async function runImportConsultant(
  state: ConversationState,
  userMessage: string,
  calcContext: CalcContext,
): Promise<AgentResult & { intent?: string; leadScore?: number; isLeadReady?: boolean }> {
  const system = buildSystem(calcContext);
  const history = getLLMHistory(state);
  const raw = await callLLM(system, history);

  try {
    const parsed = JSON.parse(raw);
    const leadDataUpdate: Record<string, string> = {};

    if (parsed.contactType === "telegram" && parsed.contactValue) {
      leadDataUpdate.telegram = parsed.contactValue;
    } else if (parsed.contactType === "phone" && parsed.contactValue) {
      leadDataUpdate.phone = parsed.contactValue;
    }

    if (calcContext.product_name) {
      leadDataUpdate.product = calcContext.product_name;
    }
    if (calcContext.quantity) {
      leadDataUpdate.quantity = String(calcContext.quantity);
    }
    if (calcContext.city_to) {
      leadDataUpdate.destination = `${calcContext.city_to}, ${calcContext.country_to}`;
    }

    return {
      message: parsed.message ?? raw,
      leadDataUpdate: Object.keys(leadDataUpdate).length > 0 ? (leadDataUpdate as any) : undefined,
      isLeadComplete: parsed.isLeadReady === true,
      intent: parsed.intent,
      leadScore: parsed.leadScore,
      isLeadReady: parsed.isLeadReady === true,
    };
  } catch {
    return { message: raw };
  }
}
