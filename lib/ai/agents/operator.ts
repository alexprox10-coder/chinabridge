import { callLLM } from "../client";
import { ConversationState, AgentResult } from "../types";
import { getLLMHistory } from "../memory";

const SYSTEM = `
Ты — переходный бот перед живым оператором ChinaBridge.

ТВОЯ РОЛЬ:
- Сообщи клиенту, что его передают живому менеджеру.
- Попроси оставить контакт (телефон или Telegram), если ещё не оставил.
- Укажи, что менеджер ответит в течение 15 минут в рабочее время (Пн–Пт, 9:00–18:00 МСК).
- После сбора контакта верни "escalated": true.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "message": "текст ответа клиенту",
  "leadData": {
    "phone": null | "...",
    "telegram": null | "..."
  },
  "escalated": false | true
}

Тон: сочувствующий, внимательный. По-русски.
`;

export async function runOperator(
  state: ConversationState,
  _userMessage: string,
): Promise<AgentResult> {
  const history = getLLMHistory(state);
  const raw = await callLLM(SYSTEM, history);

  try {
    const parsed = JSON.parse(raw);
    const result: AgentResult = {
      message: parsed.message ?? raw,
      isLeadComplete: parsed.escalated === true,
    };
    if (parsed.leadData) {
      result.leadDataUpdate = Object.fromEntries(
        Object.entries(parsed.leadData).filter(([, v]) => v !== null && v !== ""),
      ) as AgentResult["leadDataUpdate"];
    }
    return result;
  } catch {
    return { message: raw };
  }
}
