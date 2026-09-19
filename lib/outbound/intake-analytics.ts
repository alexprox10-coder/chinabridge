// §31 ТЗ — Analytics event logger for intake pipeline
// 17 event types as specified in the ТЗ

export type IntakeEventType =
  | "lead_received"
  | "lead_duplicate"
  | "lead_classified"
  | "lead_rejected"
  | "lead_high"
  | "lead_hot"
  | "lead_notification_sent"
  | "lead_approved"
  | "lead_reply_drafted"
  | "lead_contacted"
  | "lead_replied"
  | "lead_positive"
  | "lead_crm_created"
  | "lead_hot_crm"
  | "quote_created"
  | "deal_created"
  | "lead_needs_review";

export async function logIntakeEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: any,
  event: IntakeEventType,
  leadId: string | null,
  source: string,
  country: string,
  stream: number | null,
  score: number,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await sql`
      INSERT INTO outbound_analytics_events
        (event, lead_id, source, country, stream, score, meta)
      VALUES
        (${event}, ${leadId}, ${source}, ${country}, ${stream}, ${score}, ${JSON.stringify(meta ?? {})})
    `;
  } catch {
    // Analytics must never block the main flow
  }
}
