import { neon } from "@neondatabase/serverless";

export interface VkGroup {
  id:         number;
  group_id:   string;   // VK domain or numeric ID
  label:      string;
  enabled:    boolean;
  added_at:   string;
}

export async function ensureGroupsTable(dbUrl: string): Promise<void> {
  const sql = neon(dbUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS vk_intent_groups (
      id        SERIAL PRIMARY KEY,
      group_id  TEXT NOT NULL UNIQUE,
      label     TEXT NOT NULL DEFAULT '',
      enabled   BOOLEAN NOT NULL DEFAULT TRUE,
      added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getVkGroups(dbUrl: string): Promise<VkGroup[]> {
  try {
    const sql = neon(dbUrl);
    await ensureGroupsTable(dbUrl);
    const rows = await sql`SELECT * FROM vk_intent_groups WHERE enabled = TRUE ORDER BY added_at DESC`;
    return rows as VkGroup[];
  } catch { return []; }
}

export async function addVkGroup(dbUrl: string, groupId: string, label: string): Promise<boolean> {
  try {
    const sql = neon(dbUrl);
    await ensureGroupsTable(dbUrl);
    await sql`
      INSERT INTO vk_intent_groups (group_id, label)
      VALUES (${groupId.trim()}, ${label.trim()})
      ON CONFLICT (group_id) DO UPDATE SET enabled = TRUE, label = EXCLUDED.label
    `;
    return true;
  } catch { return false; }
}

export async function removeVkGroup(dbUrl: string, groupId: string): Promise<boolean> {
  try {
    const sql = neon(dbUrl);
    await sql`DELETE FROM vk_intent_groups WHERE group_id = ${groupId}`;
    return true;
  } catch { return false; }
}
