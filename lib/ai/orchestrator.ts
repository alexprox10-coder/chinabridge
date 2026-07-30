import {
  getOrCreate,
  addMessage,
  doHandoff,
  updateLead,
  markLeadSent,
} from "./memory";
import { runAgent, AGENT_LABELS } from "./agents";
import { sendLeadToWebhook } from "@/lib/webhook/n8n";
import { ChatApiResponse } from "./types";

export async function handleMessage(
  sessionId: string,
  userMessage: string,
): Promise<ChatApiResponse> {
  const state = getOrCreate(sessionId);

  // Record user message
  addMessage(state, "user", userMessage);

  // Run current agent
  const result = await runAgent(state, userMessage);

  // Apply lead data updates
  if (result.leadDataUpdate && Object.keys(result.leadDataUpdate).length > 0) {
    updateLead(state, result.leadDataUpdate);
  }

  // Process handoff before recording assistant message
  if (result.handoffTo && result.handoffTo !== state.currentAgent) {
    doHandoff(state, result.handoffTo, result.handoffReason ?? "");
  }

  // Send lead to n8n when complete
  if (result.isLeadComplete && !state.isLeadSent) {
    markLeadSent(state);
    sendLeadToWebhook(state.leadData, sessionId).catch(() => {
      // fire-and-forget; webhook failure doesn't break chat
    });
  }

  // Record assistant response
  addMessage(state, "assistant", result.message);

  return {
    message: result.message,
    agent: state.currentAgent,
    agentLabel: AGENT_LABELS[state.currentAgent],
    sessionId,
  };
}
