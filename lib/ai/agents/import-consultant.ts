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

function detectAutoCategory(name: string): "parts" | "accessories" | null {
  const n = name.toLowerCase();
  const partsKw = ["запчасть", "запчасти", "деталь", "фара", "бампер", "двигатель", "коробка", "стойка", "амортизатор", "тормоз", "диск", "колодк", "фильтр", "ремень", "помпа", "радиатор", "генератор", "стартер", "кузов", "крыло", "капот", "дверь", "порог", "лонжерон", "подвеска", "рулевой", "ступица", "шаровая", "тяга", "суппорт", "abs", "катализатор", "глушитель", "выхлоп", "топливный", "форсунк", "инжектор", "катушка", "датчик кислород", "лямбда"];
  const accKw = ["ковр", "чехол", "авто-аксессуар", "автоаксессуар", "видеорегистратор", "регистратор", "антирадар", "органайзер", "щётк", "стеклоочиститель", "led", "лед-лампа", "автозарядк", "карго-коврик", "eva коврик", "eva-коврик", "автомобильн", "авто коврик", "автосигнализ", "парктроник", "камера заднего вида", "навигатор", "авто-держатель"];
  if (partsKw.some(k => n.includes(k))) return "parts";
  if (accKw.some(k => n.includes(k))) return "accessories";
  return null;
}

const AUTO_KNOWLEDGE = `
═══ ЭКСПЕРТИЗА: АВТОЗАПЧАСТИ И АВТОТОВАРЫ ИЗ КИТАЯ ═══

📦 ПОПУЛЯРНЫЕ МАРКИ В КЗ И РФ (работаем с запчастями):
KZ: BYD (Han, Seal, Atto 3, Song Plus), Haval (Jolion, Dargo, H9), Chery (Tiggo 7/8 Pro, Arrizo), Geely (Coolray, Atlas Pro), FAW, Jac, Changan
RU: Haval (F7, Jolion), Chery, Geely, FAW, Lifan, Jac — плюс тот же парк что и в КЗ

🛃 ТАМОЖНЯ КЗ (КАЗАХСТАН):
- Ввозная пошлина: 0% (многие категории ЕАЭС) до 15% в зависимости от кода
- НДС: 12%
- Сертификация: для продажи на Kaspi авто-аксессуары не требуют обязательного сертификата (кроме световых приборов, тормозных компонентов)
- Запчасти для конкретных авто продаются без отдельной сертификации если нет сертифицируемых позиций
- ТР ТС 018/2011 — на колёсные транспортные средства, не на запчасти напрямую
- Серый ввоз: для КЗ работаем через серый канал — без "таможня под ключ", это законно для частников и мелкого бизнеса
- Лимит беспошлинного ввоза для физлиц: эквивалент €200/посылка

🛃 ТАМОЖНЯ РФ (РОССИЯ):
- Ввозная пошлина: 5-20% (зависит от кода ТН ВЭД), часто 10-15% на запчасти
- НДС: 20%
- Для продажи в магазине или на WB/Ozon — нужна декларация или сертификат
- Световые приборы, тормозные колодки, ремни безопасности — обязательная сертификация (ТР ТС 018, 020)
- Белый ввоз через нас: оформляем ВЭД под ключ, декларируем корректно
- Серый ввоз через Сунфэньхэ — вариант для мелких партий

📋 КОДЫ ТН ВЭД АВТОЗАПЧАСТЕЙ:
- 8708.xx — автозапчасти и принадлежности (широкая группа)
- 8708.10 — бамперы · 8708.29 — кузовные детали · 8708.30 — тормоза и суппорты
- 8708.40 — КПП · 8708.50 — ведущие мосты · 8708.70 — колёса и шины
- 8708.80 — подвеска · 8708.91 — радиаторы · 8708.92 — глушители
- 8708.94 — рулевое управление · 8708.99 — прочие запчасти
- 8512.20 — осветительное оборудование (фары, ДХО) — требует сертификат!
- 8714.xx — аксессуары для авто

⚙️ ЧТО ХОРОШО ИДЁТ ИЗ КИТАЯ ПО АВТО:
Запчасти: аналоги (совместимые) для BYD/Haval/Chery — дешевле оригинала в 2-4 раза, одинаковое производство
Аксессуары: EVA-коврики (маржа 150-300%), авто-чехлы (маржа 100-200%), видеорегистраторы, LED-лампы, органайзеры — топ на Kaspi
Расходники: масляные/воздушные/салонные фильтры — аналоги продаются без проблем

⚠️ ЧТО НУЖНО ЗНАТЬ:
- Оригинальные детали с лицензионным брендом (Toyota, BMW) — НЕЛЬЗЯ ввозить без разрешения правообладателя, только аналоги/совместимые
- Подушки безопасности — запрещены к ввозу без особого разрешения
- Автозапчасти б/у — требуют отдельных разрешений в РФ
- Для поставки в KZ запчастей для китайских авто (BYD, Haval) — требований минимум, самый чистый рынок

💰 ЦЕНОВАЯ ЛОГИКА:
- Купить на 1688: запчасть в 3-5 раз дешевле дилерской цены в KZ/RU
- Доставка авто: $2.50/кг в KZ · $3.00/кг в RU
- Типичная маржа: аксессуары 150-250%, запчасти 80-150%
- Минимальная партия: от 1 кг — возможна, от 30 кг — выгодно

🔍 КАК НАЙТИ ПОСТАВЩИКА ДЛЯ КОНКРЕТНОЙ ЗАПЧАСТИ:
- На 1688 ищем по OEM-номеру или артикулу → находим 3-5 заводов → проверяем качество
- Для Kaspi: важна унификация — EVA-коврики делаем под конкретные модели авто
- АнтонКит (наш партнёр в Гуанчжоу) выкупает и проверяет перед отправкой
`;

function buildSystem(ctx: CalcContext): string {
  const isKZ = ctx.country_to === "KZ" || ctx.marketplace === "kaspi";
  const currency = isKZ ? "₸" : "₽";
  const autoCategory = detectAutoCategory(ctx.product_name);

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

  const autoBlock = autoCategory
    ? `\n${AUTO_KNOWLEDGE}\n${autoCategory === "parts" ? "ВАЖНО: Клиент интересуется ЗАПЧАСТЯМИ. Используй свои знания по кодам ТН ВЭД, сертификации, совместимым аналогам, рынку в KZ/RU." : "ВАЖНО: Клиент интересуется АВТОАКСЕССУАРАМИ. Ключевые аргументы: маржа 150-300%, топ на Kaspi, без сертификации, быстрая доставка."}\n`
    : "";

  return `Ты — Алексей, живой консультант ChinaBridge по импорту товаров из Китая. Говоришь тепло, понятно, как живой человек — без скриптов и официоза. Понимаешь боль клиента: он боится рисков, переплатить, не понимает как работает импорт.${autoBlock}

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
- После 1-2 обмена ОБЯЗАТЕЛЬНО выясни ДВА ключевых параметра (если ещё неизвестны):
  1. КОГДА планирует закупку: сейчас / в течение месяца / 1-3 месяца / пока изучает
  2. ОБЪЁМ партии: до 50 кг / 50-200 кг / 200-500 кг / 500+ кг / контейнер
  Задавай их по одному, органично вписывая в разговор. Не анкетируй.

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
  "intentScore": 0-100,
  "purchaseTiming": "NOW" | "WITHIN_MONTH" | "1_3_MONTHS" | "JUST_RESEARCHING" | null,
  "weightBand": "LT50" | "50_200" | "200_500" | "GT500" | "CONTAINER" | null,
  "supplierStatus": "HAS_SUPPLIER" | "NO_SUPPLIER" | "NOT_SURE" | null,
  "askingForContact": true | false,
  "isLeadReady": true | false,
  "contactType": "telegram" | "phone" | null,
  "contactValue": "значение или null"
}

intentScore: 0=пока изучает, 25=1-3 месяца, 50=в течение месяца, 75+=сейчас/горячий.`;
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
