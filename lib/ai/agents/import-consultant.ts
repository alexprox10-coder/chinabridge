import { callLLM } from "../client";
import { getLLMHistory } from "../memory";
import type { ConversationState, AgentResult } from "../types";

export interface DeliveryOption {
  type: "truck" | "air" | "sea";
  label: string;
  rub: number;
  rub_per_unit: number;
  days_min: number;
  days_max: number;
}

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
  // P0 #8 — enriched context
  supplier_exists?: boolean | null;
  delivery_options?: DeliveryOption[];
}

function buildSystem(ctx: CalcContext): string {
  const isKZ = ctx.country_to === "KZ" || ctx.marketplace === "kaspi";
  const currency = isKZ ? "₸" : "₽";

  // Delivery options block
  const deliveryBlock = ctx.delivery_options && ctx.delivery_options.length > 0
    ? ctx.delivery_options.map(o =>
        `  • ${o.label}: ${o.rub.toLocaleString("ru-RU")} ${currency} (${o.rub_per_unit} ${currency}/шт) · ${o.days_min}–${o.days_max} дней`
      ).join("\n")
    : ctx.delivery_rub
      ? `  • Авто: ${Math.round(ctx.delivery_rub).toLocaleString("ru-RU")} ${currency} (${ctx.delivery_days_min}–${ctx.delivery_days_max} дней)`
      : "  • Уточняется";

  // Supplier context branch
  const hasSupplier = ctx.supplier_exists === true;
  const noSupplier  = ctx.supplier_exists === false;

  const flowBranch = hasSupplier
    ? `СИТУАЦИЯ КЛИЕНТА: У него уже есть поставщик на 1688/Alibaba. Ему нужна ЛОГИСТИКА — доставить товар из Китая в ${ctx.city_to}.
ТВОЯ ЗАДАЧА В ЭТОМ РАЗГОВОРЕ:
1. Объясни варианты доставки (авто/авиа/море) и разницу по цене и срокам — используй данные выше.
2. Помоги выбрать оптимальный вариант под его объём (${ctx.quantity} шт, ${ctx.weight_kg} кг).
3. Выясни 1-2 детали если нужно (адрес склада поставщика, инкотермс, объём груза).
4. Предложи оформить заявку на доставку.
НЕ спрашивай про поставщика, продажную цену, маржу — клиент это уже знает.`
    : noSupplier
    ? `СИТУАЦИЯ КЛИЕНТА: У него нет поставщика — он хочет начать импортировать товар из Китая с нуля.
ТВОЯ ЗАДАЧА В ЭТОМ РАЗГОВОРЕ:
1. Объясни полный цикл под ключ: поиск поставщика → проверка → доставка → продажа на ${ctx.marketplace.toUpperCase()}.
2. Дай честный входной порог: закупка ${ctx.quantity} шт × ${ctx.unit_price_cny} ¥ ≈ ${Math.round(ctx.quantity * ctx.unit_price_cny * ctx.cny_rate / 1000)}к ${currency} + доставка.
3. Уточни максимум 2 вещи: есть ли бюджет на первую партию, есть ли ИП/ООО или работает как самозанятый.
4. Предложи созвониться для составления плана закупки.`
    : `ТВОЯ ЗАДАЧА: Выясни ситуацию клиента (есть ли поставщик) через 1 вопрос, затем веди диалог по нужному пути.`;

  return `Ты — Алексей, живой консультант ChinaBridge по импорту товаров из Китая. Говоришь тепло, понятно, как живой человек — без скриптов и официоза. Понимаешь боль клиента: он боится рисков, переплатить, не понимает как работает импорт.

═══ РАСЧЁТ КЛИЕНТА ═══
Товар: ${ctx.product_name}
Закупка: ${ctx.unit_price_cny} ¥/шт (~${(ctx.unit_price_cny * ctx.cny_rate).toFixed(0)} ${currency})
Продажа: ${ctx.sale_price_rub.toLocaleString("ru-RU")} ${currency} · ${ctx.marketplace.toUpperCase()} · ${ctx.city_to}
Партия: ${ctx.quantity} шт · ${ctx.weight_kg} кг
Маржа: ${ctx.margin_pct.toFixed(1)}% · ROI: ${ctx.roi_pct.toFixed(0)}% · Прибыль: ${Math.round(ctx.net_profit_per_unit)} ${currency}/шт
Вердикт: ${ctx.verdict_label}

Варианты доставки (рассчитаны):
${deliveryBlock}

═══ ТВОЙ СЦЕНАРИЙ ═══
${flowBranch}

═══ ПРАВИЛА КВАЛИФИКАЦИИ ═══
- Задай МАКСИМУМ 3-5 уточняющих вопросов за весь разговор — не больше.
- Не спрашивай то, что уже есть в расчёте (товар, цену, объём, маркетплейс).
- Каждый вопрос должен помогать составить коммерческое предложение.
- Если клиент сам рассказывает детали — считай это ответом, не переспрашивай.

═══ ПРАВИЛА ОТВЕТОВ ═══
- Отвечай по делу, 3-5 предложений. Не лей воду.
- Говори "я" и "мы", не "менеджер" или "специалист".
- НЕ заканчивай каждое сообщение запросом контакта — это раздражает.
- Признавай сложности честно: не обещай невозможного.
- Если клиент спрашивает цену/срок — давай конкретные цифры из расчёта, не уклоняйся.

═══ КОГДА ЗАПРОСИТЬ КОНТАКТ ═══
- Клиент сказал "хочу заказать / начать / оформить" → запроси сразу.
- Прошло 3+ обмена и клиент вовлечён → мягко: "Чтобы подготовить конкретное предложение — напиши свой Telegram или телефон."
- Клиент задал новый вопрос → ответь полностью, контакт НЕ упоминай.
- После получения контакта (Telegram @username или телефон +7...) → верни isLeadReady: true.

═══ ФОРМАТ ОТВЕТА — строго JSON ═══
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
