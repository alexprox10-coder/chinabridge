import { neon } from "@neondatabase/serverless";

export interface VkToken {
  access_token: string;
  user_id: number;
}

async function ensureAuthTables(dbUrl: string) {
  const sql = neon(dbUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS vk_auth (
      id           SERIAL PRIMARY KEY,
      access_token TEXT NOT NULL,
      user_id      INT  NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tg_channels (
      id         SERIAL PRIMARY KEY,
      username   TEXT UNIQUE NOT NULL,
      enabled    BOOLEAN DEFAULT TRUE,
      added_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function saveVkToken(dbUrl: string, token: VkToken) {
  const sql = neon(dbUrl);
  await ensureAuthTables(dbUrl);
  await sql`DELETE FROM vk_auth`;
  await sql`INSERT INTO vk_auth (access_token, user_id) VALUES (${token.access_token}, ${token.user_id})`;
}

export async function getVkToken(dbUrl: string): Promise<VkToken | null> {
  try {
    const sql  = neon(dbUrl);
    await ensureAuthTables(dbUrl);
    const rows = await sql`SELECT access_token, user_id FROM vk_auth ORDER BY id DESC LIMIT 1`;
    if (!rows.length) return null;
    return { access_token: String(rows[0].access_token), user_id: Number(rows[0].user_id) };
  } catch { return null; }
}

export async function getTgChannels(dbUrl: string): Promise<string[]> {
  try {
    const sql  = neon(dbUrl);
    await ensureAuthTables(dbUrl);
    const rows = await sql`SELECT username FROM tg_channels WHERE enabled = TRUE ORDER BY id`;
    return rows.map(r => String(r.username));
  } catch { return []; }
}

export async function addTgChannel(dbUrl: string, username: string) {
  const sql = neon(dbUrl);
  await ensureAuthTables(dbUrl);
  const clean = username.replace(/^@/, "").trim();
  await sql`INSERT INTO tg_channels (username) VALUES (${clean}) ON CONFLICT (username) DO UPDATE SET enabled = TRUE`;
}

export async function removeTgChannel(dbUrl: string, username: string) {
  const sql   = neon(dbUrl);
  const clean = username.replace(/^@/, "").trim();
  await sql`UPDATE tg_channels SET enabled = FALSE WHERE username = ${clean}`;
}
