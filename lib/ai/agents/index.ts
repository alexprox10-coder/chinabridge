import { AgentRole } from "../types";
import { ConversationState, AgentResult } from "../types";
import { runConsultant } from "./consultant";
import { runQualification } from "./qualification";
import { runLogistic } from "./logistic";
import { runSales } from "./sales";
import { runOperator } from "./operator";

export const AGENT_LABELS: Record<AgentRole, string> = {
  consultant:    "Консультант",
  qualification: "Специалист по заявкам",
  logistic:      "Логист",
  sales:         "Менеджер",
  operator:      "Переключение на менеджера",
};

export async function runAgent(
  state: ConversationState,
  userMessage: string,
): Promise<AgentResult> {
  switch (state.currentAgent) {
    case "consultant":    return runConsultant(state, userMessage);
    case "qualification": return runQualification(state, userMessage);
    case "logistic":      return runLogistic(state, userMessage);
    case "sales":         return runSales(state, userMessage);
    case "operator":      return runOperator(state, userMessage);
  }
}
