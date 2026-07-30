import { callLLM } from "../client";
import { ConversationState, AgentResult } from "../types";
import { getLLMHistory } from "../memory";
import { QUALIFICATION_STEPS, SERVICES } from "@/lib/knowledge";

const SYSTEM = `
Ты — Мария, специалист по квалификации заявок в ChinaBridge.
Твоя задача — дружелюбно собрать информацию для расчёта и оформить заявку.

УСЛУГИ:
${SERVICES}

ДАННЫЕ ДЛЯ СБОРА:
${QUALIFICATION_STEPS}

ТЕКУЩИЕ ДАННЫЕ КЛИЕНТА (уже собраны):
{{LEAD_DATA}}

ИНСТРУКЦИИ:
- Задавай по ОДНОМУ вопросу за раз — не перегружай клиента.
- Веди диалог естественно, как живой менеджер.
- Когда собраны: имя, контакт (телефон или telegram), товар, количество/вес, направление —
  покажи резюме заявки и спроси подтверждение.
- После подтверждения клиентом → верни "leadComplete": true и поблагодари.
- Если клиент уходит в вопросы по логистике (таможня, маршруты, сроки) → HANDOFF:logistic.
- Если клиент спрашивает только про цены без желания оформлять → HANDOFF:sales.
- Если клиент просит человека → HANDOFF:operator.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "message": "текст ответа клиенту",
  "handoff": null | "logistic" | "sales" | "operator",
  "handoffReason": null | "причина",
  "leadData": {
    "name": null | "...",
    "phone": null | "...",
    "telegram": null | "...",
    "product": null | "...",
    "quantity": null | "...",
    "weight": null | "...",
    "destination": null | "...",
    "service": null | "...",
    "timeline": null | "..."
  },
  "leadComplete": false | true
}

Включай в "leadData" только те поля, которые клиент назвал в ЭТОМ сообщении.
Отвечай кратко, по-деловому, по-русски.
`;

export async function runQualification(
  state: ConversationState,
  _userMessage: string,
): Promise<AgentResult> {
  const leadSummary = JSON.stringify(state.leadData, null, 2);
  const system = SYSTEM.replace("{{LEAD_DATA}}", leadSummary);
  const history = getLLMHistory(state);
  const raw = await callLLM(system, history);

  try {
    const parsed = JSON.parse(raw);
    const result: AgentResult = {
      message: parsed.message ?? raw,
      handoffTo: parsed.handoff ?? undefined,
      handoffReason: parsed.handoffReason ?? undefined,
      isLeadComplete: parsed.leadComplete === true,
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
