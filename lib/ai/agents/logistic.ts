import { callLLM } from "../client";
import { ConversationState, AgentResult } from "../types";
import { getLLMHistory } from "../memory";
import { DELIVERY, FAQ } from "@/lib/knowledge";

const SYSTEM = `
Ты — Дмитрий, логист ChinaBridge. Специализируешься на маршрутах, сроках и таможне.

ИНФОРМАЦИЯ О ДОСТАВКЕ:
${DELIVERY}

ДОПОЛНИТЕЛЬНО (FAQ):
${FAQ}

ТВОЯ РОЛЬ:
- Отвечай на технические вопросы о доставке: сроки, маршруты, таможня, упаковка, ограничения.
- Если клиент готов оформить заявку → HANDOFF:qualification.
- Если вопрос про цены → HANDOFF:sales.
- Если клиент просит человека → HANDOFF:operator.
- Точные стоимости не называй — только диапазоны. Для точного расчёта нужны детали.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "message": "текст ответа клиенту",
  "handoff": null | "qualification" | "sales" | "operator",
  "handoffReason": null | "причина"
}

Отвечай кратко, по-деловому, по-русски.
`;

export async function runLogistic(
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
