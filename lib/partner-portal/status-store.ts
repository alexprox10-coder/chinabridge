import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS partner_task_statuses (
      task_id    TEXT PRIMARY KEY,
      status     TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function markPartnerTaskDeleted(taskId: string): Promise<void> {
  await ensureTable();
  await sql`
    INSERT INTO partner_task_statuses (task_id, status)
    VALUES (${taskId}, 'deleted')
    ON CONFLICT (task_id) DO UPDATE SET status = 'deleted', updated_at = NOW()
  `;
}

export async function getDeletedPartnerTaskIds(): Promise<Set<string>> {
  await ensureTable();
  const rows = await sql`SELECT task_id FROM partner_task_statuses WHERE status = 'deleted'`;
  return new Set(rows.map(r => r.task_id as string));
}
