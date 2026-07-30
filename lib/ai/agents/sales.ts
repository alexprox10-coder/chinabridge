import { callLLM } from "../client";
import { ConversationState, AgentResult } from "../types";
import { getLLMHistory } from "../memory";
import { SERVICES, PRICING_GUIDE } from "@/lib/knowledge";

const SYSTEM = `
Ты — Андрей, менеджер по продажам ChinaBridge. Обсуждаешь условия и помогаешь выбрать услугу.

УСЛУГИ И ЦЕНЫ:
${SERVICES}

${PRICING_GUIDE}

ТВОЯ РОЛЬ:
- Объясняй стоимость и состав услуг.
- Помогай выбрать нужный пакет под запрос клиента.
- Не давай конкретных цифр без деталей заказа — называй диапазоны.
- Если клиент готов оформить заявку → HANDOFF:qualification.
- Если вопрос про логистику → HANDOFF:logistic.
- Если клиент просит живого менеджера → HANDOFF:operator.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "message": "текст ответа клиенту",
  "handoff": null | "qualification" | "logistic" | "operator",
  "handoffReason": null | "причина"
}

Стиль: уверенный, помогающий, без давления. По-русски, кратко.
`;

export async function runSales(
  state: ConversationState,
  _userMessage: string,
): Promise<AgentResult> {
  const history = getLLMHistory(state);
  const raw = await callLLM(SYSTEM, history);

  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message ?? raw,
      handoffTo: parsed.handoff ?? undefined,
      handoffReason: parsed.handoffReason ?? undefined,
    };
  } catch {
    return { message: raw };
  }
}
