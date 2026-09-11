export type AgentRole =
  | "consultant"
  | "qualification"
  | "logistic"
  | "sales"
  | "operator";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  agent: AgentRole;
  timestamp: string;
}

export interface LeadData {
  name?: string;
  phone?: string;
  telegram?: string;
  product?: string;
  link?: string;
  quantity?: string;
  weight?: string;
  destination?: string;
  service?: string;
  timeline?: string;
  comment?: string;
  source: "website_chat";
}

export interface ConversationState {
  sessionId: string;
  currentAgent: AgentRole;
  messages: ChatMessage[];
  leadData: Partial<LeadData>;
  qualificationStep: number;
  isLeadSent: boolean;
  handoffHistory: Array<{
    from: AgentRole;
    to: AgentRole;
    reason: string;
    at: string;
  }>;
}

// Parsed LLM response (internal)
export interface AgentResult {
  message: string;
  handoffTo?: AgentRole;
  handoffReason?: string;
  leadDataUpdate?: Partial<LeadData>;
  isLeadComplete?: boolean;
  // Qualifying fields
  purchaseTiming?: "NOW" | "WITHIN_MONTH" | "1_3_MONTHS" | "JUST_RESEARCHING" | null;
  weightBand?: "LT50" | "50_200" | "200_500" | "GT500" | "CONTAINER" | null;
  supplierStatus?: "HAS_SUPPLIER" | "NO_SUPPLIER" | "NOT_SURE" | null;
  intentScore?: number | null;
}

// API response shape
export interface ChatApiResponse {
  message: string;
  agent: AgentRole;
  agentLabel: string;
  sessionId: string;
}

// Supabase-ready DB types (for future migration)
export interface DBConversation {
  id: string;
  session_id: string;
  current_agent: AgentRole;
  lead_data: Partial<LeadData>;
  qualification_step: number;
  is_lead_sent: boolean;
  status: "active" | "completed" | "escalated";
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  agent: AgentRole;
  created_at: string;
}
