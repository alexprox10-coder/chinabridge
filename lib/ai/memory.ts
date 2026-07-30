import { ConversationState, AgentRole, ChatMessage, LeadData } from "./types";

const MAX_MESSAGES = 30;

// In-memory store — swap for Supabase in production
const store = new Map<string, ConversationState>();

export function getOrCreate(sessionId: string): ConversationState {
  if (store.has(sessionId)) return store.get(sessionId)!;
  const state: ConversationState = {
    sessionId,
    currentAgent: "consultant",
    messages: [],
    leadData: { source: "website_chat" },
    qualificationStep: 0,
    isLeadSent: false,
    handoffHistory: [],
  };
  store.set(sessionId, state);
  return state;
}

export function addMessage(
  state: ConversationState,
  role: "user" | "assistant",
  content: string,
) {
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    role,
    content,
    agent: state.currentAgent,
    timestamp: new Date().toISOString(),
  };
  state.messages.push(msg);
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }
  store.set(state.sessionId, state);
  return msg;
}

export function doHandoff(
  state: ConversationState,
  to: AgentRole,
  reason: string,
) {
  state.handoffHistory.push({
    from: state.currentAgent,
    to,
    reason,
    at: new Date().toISOString(),
  });
  state.currentAgent = to;
  store.set(state.sessionId, state);
}

export function updateLead(
  state: ConversationState,
  patch: Partial<LeadData>,
) {
  state.leadData = { ...state.leadData, ...patch };
  store.set(state.sessionId, state);
}

export function markLeadSent(state: ConversationState) {
  state.isLeadSent = true;
  store.set(state.sessionId, state);
}

export function getLLMHistory(state: ConversationState) {
  return state.messages.map((m) => ({ role: m.role, content: m.content }));
}
