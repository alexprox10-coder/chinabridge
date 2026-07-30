import { LeadData } from "@/lib/ai/types";

export async function sendLeadToWebhook(
  leadData: Partial<LeadData>,
  sessionId: string,
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    body: JSON.stringify({
      source: "chinabridge_chat",
      session_id: sessionId,
      submitted_at: new Date().toISOString(),
      lead: leadData,
    }),
  });
}
