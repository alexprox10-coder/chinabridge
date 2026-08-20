import {
  getOrCreate,
  addMessage,
  doHandoff,
  updateLead,
  markLeadSent,
  saveSession,
} from "./memory";
import { runAgent, AGENT_LABELS } from "./agents";
import { sendLeadToWebhook } from "@/lib/webhook/n8n";
import { ChatApiResponse } from "./types";

export async function handleMessage(
  sessionId: string,
  userMessage: string,
): Promise<ChatApiResponse> {
  const state = await getOrCreate(sessionId);

  addMessage(state, "user", userMessage);

  const result = await runAgent(state, userMessage);

  if (result.leadDataUpdate && Object.keys(result.leadDataUpdate).length > 0) {
    updateLead(state, result.leadDataUpdate);
  }

  if (result.handoffTo && result.handoffTo !== state.currentAgent) {
    doHandoff(state, result.handoffTo, result.handoffReason ?? "");
  }

  if (result.isLeadComplete && !state.isLeadSent) {
    markLeadSent(state);
    sendLeadToWebhook(state.leadData, sessionId).catch(() => {});
  }

  addMessage(state, "assistant", result.message);

  // Persist once at end — safe for Vercel serverless (no fire-and-forget)
  await saveSession(state);

  return {
    message: result.message,
    agent: state.currentAgent,
    agentLabel: AGENT_LABELS[state.currentAgent],
    sessionId,
  };
}
