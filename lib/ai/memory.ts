import type { ConversationState, AgentRole, ChatMessage, LeadData } from "./types";

const MAX_MESSAGES = 30;

// In-memory fallback used when DB is unavailable
const fallback = new Map<string, ConversationState>();

function makeBlank(sessionId: string): ConversationState {
  return {
    sessionId,
    currentAgent: "consultant",
    messages: [],
    leadData: { source: "website_chat" },
    qualificationStep: 0,
    isLeadSent: false,
    handoffHistory: [],
  };
}

function getNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const { neon } = require("@neondatabase/serverless");
    return neon(url);
  } catch {
    return null;
  }
}

async function ensureTable(sql: ReturnType<typeof import("@neondatabase/serverless")["neon"]>) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id text PRIMARY KEY,
        state      jsonb NOT NULL,
        updated_at text  NOT NULL
      )
    `;
  } catch { /* table already exists or DB unavailable */ }
}

// ── Public async read ─────────────────────────────────────────────────────────

export async function getOrCreate(sessionId: string): Promise<ConversationState> {
  const sql = getNeon();
  if (sql) {
    try {
      await ensureTable(sql);
      const rows = await sql`
        SELECT state FROM chat_sessions WHERE session_id = ${sessionId}
      `;
      if (rows[0]) return rows[0].state as ConversationState;
      const blank = makeBlank(sessionId);
      await sql`
        INSERT INTO chat_sessions (session_id, state, updated_at)
        VALUES (${sessionId}, ${JSON.stringify(blank)}, ${new Date().toISOString()})
        ON CONFLICT (session_id) DO NOTHING
      `;
      fallback.set(sessionId, blank);
      return blank;
    } catch { /* fall through */ }
  }
  if (fallback.has(sessionId)) return fallback.get(sessionId)!;
  const blank = makeBlank(sessionId);
  fallback.set(sessionId, blank);
  return blank;
}

// ── Single persist — call once at end of request ──────────────────────────────

export async function saveSession(state: ConversationState): Promise<void> {
  fallback.set(state.sessionId, state);
  const sql = getNeon();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO chat_sessions (session_id, state, updated_at)
      VALUES (${state.sessionId}, ${JSON.stringify(state)}, ${new Date().toISOString()})
      ON CONFLICT (session_id) DO UPDATE
        SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at
    `;
  } catch { /* best-effort */ }
}

// ── Synchronous in-memory mutations (all callers do saveSession afterwards) ───

export function addMessage(
  state: ConversationState,
  role: "user" | "assistant",
  content: string,
): ChatMessage {
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
  return msg;
}

export function doHandoff(state: ConversationState, to: AgentRole, reason: string) {
  state.handoffHistory.push({
    from: state.currentAgent,
    to,
    reason,
    at: new Date().toISOString(),
  });
  state.currentAgent = to;
}

export function updateLead(state: ConversationState, patch: Partial<LeadData>) {
  state.leadData = { ...state.leadData, ...patch };
}

export function markLeadSent(state: ConversationState) {
  state.isLeadSent = true;
}

export function getLLMHistory(state: ConversationState) {
  return state.messages.map((m) => ({ role: m.role, content: m.content }));
}
