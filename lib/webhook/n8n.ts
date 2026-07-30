import { Lead } from "@/lib/types/lead";
import { LeadData } from "@/lib/ai/types";

const TIMEOUT_MS = 8000;

async function post(url: string, payload: unknown): Promise<void> {
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`n8n returned ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// Called from POST /api/leads (form submission)
export async function sendLead(lead: Lead): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) throw new Error("N8N_WEBHOOK_URL is not configured");

  await post(url, {
    event: "lead.created",
    lead,
  });
}

// Called from AI chat orchestrator (fire-and-forget)
export async function sendLeadToWebhook(
  leadData: Partial<LeadData>,
  sessionId: string,
): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  await post(url, {
    event: "chat_lead.created",
    session_id: sessionId,
    lead: leadData,
  }).catch(() => {
    // fire-and-forget: log only, never throws
    console.error("[n8n] chat lead webhook failed, session:", sessionId);
  });
}
