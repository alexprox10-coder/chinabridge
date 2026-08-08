import { neon } from "@neondatabase/serverless";

/* ────────────────────────────────────────────────────────────────────────────
   AI Marketing Department — Neon SQL data layer
   Every exported function calls `await bootstrap()` before touching the DB,
   so the schema is created lazily on first use (no migration step required).
   ──────────────────────────────────────────────────────────────────────────── */

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface MemoryRow {
  id?: number;
  key: string;
  value: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignRow {
  id: number;
  name: string;
  goal: string | null;
  channel: string;
  budget_rub: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  notes: string | null;
  created_at?: string;
  /* aggregated from marketing_campaign_metrics */
  spend_rub?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  trials?: number;
  payments?: number;
}

export interface PartnerRow {
  id: number;
  name: string;
  url: string | null;
  platform: string;
  audience_size: number | null;
  er: number | null;
  ad_price: number | null;
  contact: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  created_at?: string;
}

export interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  result: string | null;
  created_at?: string;
  completed_at?: string | null;
}

export interface ChannelRow {
  id: number;
  name: string;
  platform: string;
  spend_total: number;
  leads_total: number;
  trials_total: number;
  payments_total: number;
  notes: string | null;
  status: string;
  created_at?: string;
}

export interface ConversationRow {
  role: string;
  content: string;
  created_at?: string;
}

export interface CampaignMetricRow {
  id: number;
  campaign_id: number;
  date: string;
  spend_rub: number;
  impressions: number;
  clicks: number;
  leads: number;
  trials: number;
  payments: number;
}

/* ── Bootstrap ────────────────────────────────────────────────────────────── */

let _bootstrapped = false;

async function bootstrap() {
  if (_bootstrapped) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_ai_memory (
      id         SERIAL PRIMARY KEY,
      key        TEXT UNIQUE NOT NULL,
      value      TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      goal         TEXT,
      channel      TEXT NOT NULL DEFAULT 'telegram',
      budget_rub   INTEGER DEFAULT 0,
      start_date   DATE,
      end_date     DATE,
      status       TEXT NOT NULL DEFAULT 'draft',
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_campaign_metrics (
      id          SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
      date        DATE NOT NULL,
      spend_rub   INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks      INTEGER DEFAULT 0,
      leads       INTEGER DEFAULT 0,
      trials      INTEGER DEFAULT 0,
      payments    INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_channels (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL UNIQUE,
      platform       TEXT NOT NULL,
      spend_total    INTEGER DEFAULT 0,
      leads_total    INTEGER DEFAULT 0,
      trials_total   INTEGER DEFAULT 0,
      payments_total INTEGER DEFAULT 0,
      notes          TEXT,
      status         TEXT DEFAULT 'active',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_partners (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      url           TEXT,
      platform      TEXT NOT NULL DEFAULT 'telegram',
      audience_size INTEGER,
      er            NUMERIC(5,2),
      ad_price      INTEGER,
      contact       TEXT,
      status        TEXT NOT NULL DEFAULT 'found',
      score         INTEGER,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_tasks (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      priority     TEXT NOT NULL DEFAULT 'medium',
      status       TEXT NOT NULL DEFAULT 'open',
      due_date     DATE,
      result       TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketing_conversation (
      id         SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS marketing_conversation_session_idx
      ON marketing_conversation (session_id, id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS marketing_campaign_metrics_campaign_idx
      ON marketing_campaign_metrics (campaign_id)
  `;

  _bootstrapped = true;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nullableNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown, fallback = ""): string {
  return v === null || v === undefined ? fallback : String(v);
}

function nullableStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

function dateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/* ── Memory ───────────────────────────────────────────────────────────────── */

export async function getMemories(): Promise<Array<{ key: string; value: string; category: string }>> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT key, value, category
    FROM marketing_ai_memory
    ORDER BY updated_at DESC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    key: str(r.key),
    value: str(r.value),
    category: str(r.category, "general"),
  }));
}

export async function saveMemory(key: string, value: string, category: string): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    INSERT INTO marketing_ai_memory (key, value, category)
    VALUES (${key}, ${value}, ${category || "general"})
    ON CONFLICT (key) DO UPDATE
      SET value = ${value},
          category = ${category || "general"},
          updated_at = NOW()
  `;
}

export async function deleteMemory(key: string): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`DELETE FROM marketing_ai_memory WHERE key = ${key}`;
}

/* ── Conversation ─────────────────────────────────────────────────────────── */

export async function getConversation(
  sessionId: string,
  limit = 30,
): Promise<Array<{ role: string; content: string }>> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT role, content
    FROM (
      SELECT id, role, content
      FROM marketing_conversation
      WHERE session_id = ${sessionId}
      ORDER BY id DESC
      LIMIT ${limit}
    ) t
    ORDER BY t.id ASC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({ role: str(r.role), content: str(r.content) }));
}

export async function saveMessage(sessionId: string, role: string, content: string): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    INSERT INTO marketing_conversation (session_id, role, content)
    VALUES (${sessionId}, ${role}, ${content})
  `;
}

/* ── Campaigns ────────────────────────────────────────────────────────────── */

export async function getCampaigns(): Promise<CampaignRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      c.id, c.name, c.goal, c.channel, c.budget_rub, c.start_date, c.end_date,
      c.status, c.utm_source, c.utm_medium, c.utm_campaign, c.notes, c.created_at,
      COALESCE(SUM(m.spend_rub),   0) AS spend_rub,
      COALESCE(SUM(m.impressions), 0) AS impressions,
      COALESCE(SUM(m.clicks),      0) AS clicks,
      COALESCE(SUM(m.leads),       0) AS leads,
      COALESCE(SUM(m.trials),      0) AS trials,
      COALESCE(SUM(m.payments),    0) AS payments
    FROM marketing_campaigns c
    LEFT JOIN marketing_campaign_metrics m ON m.campaign_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC, c.id DESC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: num(r.id),
    name: str(r.name),
    goal: nullableStr(r.goal),
    channel: str(r.channel, "telegram"),
    budget_rub: num(r.budget_rub),
    start_date: dateStr(r.start_date),
    end_date: dateStr(r.end_date),
    status: str(r.status, "draft"),
    utm_source: nullableStr(r.utm_source),
    utm_medium: nullableStr(r.utm_medium),
    utm_campaign: nullableStr(r.utm_campaign),
    notes: nullableStr(r.notes),
    created_at: r.created_at ? String(r.created_at) : undefined,
    spend_rub: num(r.spend_rub),
    impressions: num(r.impressions),
    clicks: num(r.clicks),
    leads: num(r.leads),
    trials: num(r.trials),
    payments: num(r.payments),
  }));
}

export async function createCampaign(data: Partial<CampaignRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO marketing_campaigns
      (name, goal, channel, budget_rub, start_date, end_date, status,
       utm_source, utm_medium, utm_campaign, notes)
    VALUES (
      ${str(data.name, "Без названия")},
      ${nullableStr(data.goal)},
      ${str(data.channel, "telegram")},
      ${num(data.budget_rub)},
      ${dateStr(data.start_date)},
      ${dateStr(data.end_date)},
      ${str(data.status, "draft")},
      ${nullableStr(data.utm_source)},
      ${nullableStr(data.utm_medium)},
      ${nullableStr(data.utm_campaign)},
      ${nullableStr(data.notes)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

export async function updateCampaign(id: number, data: Partial<CampaignRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  /* COALESCE keeps the existing value whenever a field is omitted. */
  await sql`
    UPDATE marketing_campaigns SET
      name         = COALESCE(${data.name ?? null},                  name),
      goal         = COALESCE(${data.goal ?? null},                  goal),
      channel      = COALESCE(${data.channel ?? null},               channel),
      budget_rub   = COALESCE(${nullableNum(data.budget_rub)},       budget_rub),
      start_date   = COALESCE(${dateStr(data.start_date)}::date,     start_date),
      end_date     = COALESCE(${dateStr(data.end_date)}::date,       end_date),
      status       = COALESCE(${data.status ?? null},                status),
      utm_source   = COALESCE(${data.utm_source ?? null},            utm_source),
      utm_medium   = COALESCE(${data.utm_medium ?? null},            utm_medium),
      utm_campaign = COALESCE(${data.utm_campaign ?? null},          utm_campaign),
      notes        = COALESCE(${data.notes ?? null},                 notes)
    WHERE id = ${id}
  `;
}

/* ── Partners ─────────────────────────────────────────────────────────────── */

function mapPartner(r: Record<string, unknown>): PartnerRow {
  return {
    id: num(r.id),
    name: str(r.name),
    url: nullableStr(r.url),
    platform: str(r.platform, "telegram"),
    audience_size: nullableNum(r.audience_size),
    er: nullableNum(r.er),
    ad_price: nullableNum(r.ad_price),
    contact: nullableStr(r.contact),
    status: str(r.status, "found"),
    score: nullableNum(r.score),
    notes: nullableStr(r.notes),
    created_at: r.created_at ? String(r.created_at) : undefined,
  };
}

export async function getPartners(status?: string): Promise<PartnerRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (status
    ? await sql`
        SELECT * FROM marketing_partners
        WHERE status = ${status}
        ORDER BY COALESCE(score, 0) DESC, id DESC
      `
    : await sql`
        SELECT * FROM marketing_partners
        ORDER BY COALESCE(score, 0) DESC, id DESC
      `) as Record<string, unknown>[];
  return rows.map(mapPartner);
}

export async function createPartner(data: Partial<PartnerRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO marketing_partners
      (name, url, platform, audience_size, er, ad_price, contact, status, score, notes)
    VALUES (
      ${str(data.name, "Без названия")},
      ${nullableStr(data.url)},
      ${str(data.platform, "telegram")},
      ${nullableNum(data.audience_size)},
      ${nullableNum(data.er)},
      ${nullableNum(data.ad_price)},
      ${nullableStr(data.contact)},
      ${str(data.status, "found")},
      ${nullableNum(data.score)},
      ${nullableStr(data.notes)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

export async function updatePartner(id: number, data: Partial<PartnerRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    UPDATE marketing_partners SET
      name          = COALESCE(${data.name ?? null},                name),
      url           = COALESCE(${data.url ?? null},                 url),
      platform      = COALESCE(${data.platform ?? null},            platform),
      audience_size = COALESCE(${nullableNum(data.audience_size)},  audience_size),
      er            = COALESCE(${nullableNum(data.er)},             er),
      ad_price      = COALESCE(${nullableNum(data.ad_price)},       ad_price),
      contact       = COALESCE(${data.contact ?? null},             contact),
      status        = COALESCE(${data.status ?? null},              status),
      score         = COALESCE(${nullableNum(data.score)},          score),
      notes         = COALESCE(${data.notes ?? null},               notes)
    WHERE id = ${id}
  `;
}

/* ── Tasks ────────────────────────────────────────────────────────────────── */

function mapTask(r: Record<string, unknown>): TaskRow {
  return {
    id: num(r.id),
    title: str(r.title),
    description: nullableStr(r.description),
    priority: str(r.priority, "medium"),
    status: str(r.status, "open"),
    due_date: dateStr(r.due_date),
    result: nullableStr(r.result),
    created_at: r.created_at ? String(r.created_at) : undefined,
    completed_at: r.completed_at ? String(r.completed_at) : null,
  };
}

export async function getTasks(status?: string): Promise<TaskRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (status
    ? await sql`
        SELECT * FROM marketing_tasks
        WHERE status = ${status}
        ORDER BY
          CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
          COALESCE(due_date, '2999-12-31'::date) ASC,
          id DESC
      `
    : await sql`
        SELECT * FROM marketing_tasks
        ORDER BY
          CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
          COALESCE(due_date, '2999-12-31'::date) ASC,
          id DESC
      `) as Record<string, unknown>[];
  return rows.map(mapTask);
}

export async function createTask(data: Partial<TaskRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO marketing_tasks (title, description, priority, status, due_date, result)
    VALUES (
      ${str(data.title, "Без названия")},
      ${nullableStr(data.description)},
      ${str(data.priority, "medium")},
      ${str(data.status, "open")},
      ${dateStr(data.due_date)},
      ${nullableStr(data.result)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

/* ── Channels ─────────────────────────────────────────────────────────────── */

export async function getChannelStats(): Promise<ChannelRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM marketing_channels
    ORDER BY payments_total DESC, leads_total DESC, id ASC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: num(r.id),
    name: str(r.name),
    platform: str(r.platform),
    spend_total: num(r.spend_total),
    leads_total: num(r.leads_total),
    trials_total: num(r.trials_total),
    payments_total: num(r.payments_total),
    notes: nullableStr(r.notes),
    status: str(r.status, "active"),
    created_at: r.created_at ? String(r.created_at) : undefined,
  }));
}
