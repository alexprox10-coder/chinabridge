import { neon } from "@neondatabase/serverless";
import type { LeadStatus } from "./types";

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS import_lead_statuses (
      lead_id    TEXT PRIMARY KEY,
      status     TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function setLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  await ensureTable();
  await sql`
    INSERT INTO import_lead_statuses (lead_id, status)
    VALUES (${leadId}, ${status})
    ON CONFLICT (lead_id) DO UPDATE SET status = ${status}, updated_at = NOW()
  `;
}

export async function getLeadStatuses(): Promise<Record<string, LeadStatus>> {
  await ensureTable();
  const rows = await sql`SELECT lead_id, status FROM import_lead_statuses`;
  return Object.fromEntries(rows.map((r) => [r.lead_id as string, r.status as LeadStatus]));
}
