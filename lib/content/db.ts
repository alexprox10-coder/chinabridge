import { neon } from "@neondatabase/serverless";

/* ────────────────────────────────────────────────────────────────────────────
   AI Content Department — Neon SQL data layer
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

export interface PostRow {
  id: number;
  title: string | null;
  body: string;
  platform: string;
  category: string;
  cta_type: string | null;
  cta_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  image_prompt: string | null;
  audience: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  source_topic: string | null;
  views: number;
  clicks: number;
  created_at?: string;
}

export interface TopicRow {
  id: number;
  title: string;
  category: string;
  priority: number;
  status: string;
  source: string | null;
  created_at?: string;
}

export interface ScheduleRow {
  id: number;
  platform: string;
  posts_per_day: number;
  min_interval_minutes: number;
  posting_times: string;
  is_active: boolean;
  updated_at?: string;
}

export interface AnalyticsRow {
  id: number;
  post_id: number | null;
  platform: string;
  date: string | null;
  views: number;
  clicks: number;
  reactions: number;
  registrations: number;
  trials: number;
  leads: number;
  payments: number;
  created_at?: string;
}

export interface AdChannelRow {
  id: number;
  name: string;
  url: string | null;
  platform: string;
  audience_size: number | null;
  er: number | null;
  ad_price: number | null;
  contact: string | null;
  topic: string | null;
  geography: string | null;
  avg_views: number | null;
  ai_score: number | null;
  ai_verdict: string | null;
  status: string;
  notes: string | null;
  created_at?: string;
}

export interface CTARow {
  id: number;
  name: string;
  cta_type: string;
  text_template: string;
  url: string;
  weight: number;
  is_active: boolean;
}

export interface AnalyticsSummaryRow {
  platform: string;
  views: number;
  clicks: number;
  registrations: number;
  trials: number;
  leads: number;
  payments: number;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function nullableNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function str(v: unknown, fallback = ""): string {
  return v === null || v === undefined ? fallback : String(v);
}

export function nullableStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

export function dateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function tsStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function bool(v: unknown, fallback = true): boolean {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "true" || s === "t" || s === "1";
}

/* ── Bootstrap ────────────────────────────────────────────────────────────── */

let _bootstrapped = false;

async function bootstrap() {
  if (_bootstrapped) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS content_memory (
      id         SERIAL PRIMARY KEY,
      key        TEXT UNIQUE NOT NULL,
      value      TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_conversation (
      id         SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_posts (
      id           SERIAL PRIMARY KEY,
      title        TEXT,
      body         TEXT NOT NULL,
      platform     TEXT NOT NULL DEFAULT 'telegram',
      category     TEXT NOT NULL DEFAULT 'useful',
      cta_type     TEXT,
      cta_url      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      utm_content  TEXT,
      image_prompt TEXT,
      audience     TEXT,
      status       TEXT NOT NULL DEFAULT 'generated',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      source_topic TEXT,
      views        INTEGER DEFAULT 0,
      clicks       INTEGER DEFAULT 0,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_topics (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'news',
      priority   INTEGER DEFAULT 5,
      status     TEXT NOT NULL DEFAULT 'pending',
      source     TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_schedule (
      id                   SERIAL PRIMARY KEY,
      platform             TEXT NOT NULL UNIQUE,
      posts_per_day        INTEGER NOT NULL DEFAULT 3,
      min_interval_minutes INTEGER NOT NULL DEFAULT 180,
      posting_times        TEXT NOT NULL DEFAULT '["08:30","12:30","16:30","20:30"]',
      is_active            BOOLEAN NOT NULL DEFAULT true,
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_analytics (
      id            SERIAL PRIMARY KEY,
      post_id       INTEGER REFERENCES content_posts(id) ON DELETE CASCADE,
      platform      TEXT NOT NULL,
      date          DATE NOT NULL DEFAULT CURRENT_DATE,
      views         INTEGER DEFAULT 0,
      clicks        INTEGER DEFAULT 0,
      reactions     INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      trials        INTEGER DEFAULT 0,
      leads         INTEGER DEFAULT 0,
      payments      INTEGER DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS advertising_channels (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      url           TEXT,
      platform      TEXT NOT NULL DEFAULT 'telegram',
      audience_size INTEGER,
      er            NUMERIC(5,2),
      ad_price      INTEGER,
      contact       TEXT,
      topic         TEXT,
      geography     TEXT,
      avg_views     INTEGER,
      ai_score      INTEGER,
      ai_verdict    TEXT,
      status        TEXT NOT NULL DEFAULT 'found',
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_cta (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      cta_type      TEXT NOT NULL UNIQUE,
      text_template TEXT NOT NULL,
      url           TEXT NOT NULL,
      weight        INTEGER DEFAULT 10,
      is_active     BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS content_conversation_session_idx
      ON content_conversation (session_id, id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS content_posts_status_idx
      ON content_posts (status)
  `;

  /* ── Seed: posting schedule ── */
  await sql`
    INSERT INTO content_schedule (platform, posts_per_day, min_interval_minutes, posting_times, is_active)
    VALUES ('telegram', 4, 120, '["08:30","12:30","16:30","20:00"]', true)
    ON CONFLICT (platform) DO NOTHING
  `;
  await sql`
    INSERT INTO content_schedule (platform, posts_per_day, min_interval_minutes, posting_times, is_active)
    VALUES ('vk', 3, 180, '["09:00","13:00","18:00"]', true)
    ON CONFLICT (platform) DO NOTHING
  `;
  await sql`
    INSERT INTO content_schedule (platform, posts_per_day, min_interval_minutes, posting_times, is_active)
    VALUES ('max', 1, 360, '["10:00"]', true)
    ON CONFLICT (platform) DO NOTHING
  `;

  /* ── Seed: default CTAs ── */
  await sql`
    INSERT INTO content_cta (name, cta_type, text_template, url, weight, is_active)
    VALUES ('Калькулятор доставки', 'calculator',
            'Рассчитайте стоимость вашей поставки',
            'https://chinabridge.pro/delivery-calculator', 10, true)
    ON CONFLICT (cta_type) DO NOTHING
  `;
  await sql`
    INSERT INTO content_cta (name, cta_type, text_template, url, weight, is_active)
    VALUES ('Поиск товаров', 'product_finder',
            'Найдите товар с AI за 5 минут',
            'https://chinabridge.pro/product-finder', 10, true)
    ON CONFLICT (cta_type) DO NOTHING
  `;
  await sql`
    INSERT INTO content_cta (name, cta_type, text_template, url, weight, is_active)
    VALUES ('Проверка поставщика', 'supplier_finder',
            'Проверьте поставщика через AI',
            'https://chinabridge.pro/supplier-finder', 10, true)
    ON CONFLICT (cta_type) DO NOTHING
  `;
  await sql`
    INSERT INTO content_cta (name, cta_type, text_template, url, weight, is_active)
    VALUES ('Бесплатный триал', 'trial',
            'Попробуйте ChinaBridge бесплатно 14 дней',
            'https://chinabridge.pro/free', 12, true)
    ON CONFLICT (cta_type) DO NOTHING
  `;
  await sql`
    INSERT INTO content_cta (name, cta_type, text_template, url, weight, is_active)
    VALUES ('Партнёрская программа', 'partner',
            'Зарабатывайте с партнёрской программой ChinaBridge',
            'https://chinabridge.pro/settings/partners', 6, true)
    ON CONFLICT (cta_type) DO NOTHING
  `;

  _bootstrapped = true;
}

/* ── Memory ───────────────────────────────────────────────────────────────── */

export async function getMemories(): Promise<MemoryRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, key, value, category, created_at, updated_at
    FROM content_memory
    ORDER BY updated_at DESC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: num(r.id),
    key: str(r.key),
    value: str(r.value),
    category: str(r.category, "general"),
    created_at: r.created_at ? String(r.created_at) : undefined,
    updated_at: r.updated_at ? String(r.updated_at) : undefined,
  }));
}

export async function saveMemory(key: string, value: string, category: string): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    INSERT INTO content_memory (key, value, category)
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
  await sql`DELETE FROM content_memory WHERE key = ${key}`;
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
      FROM content_conversation
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
    INSERT INTO content_conversation (session_id, role, content)
    VALUES (${sessionId}, ${role}, ${content})
  `;
}

/* ── Posts ────────────────────────────────────────────────────────────────── */

function mapPost(r: Record<string, unknown>): PostRow {
  return {
    id: num(r.id),
    title: nullableStr(r.title),
    body: str(r.body),
    platform: str(r.platform, "telegram"),
    category: str(r.category, "useful"),
    cta_type: nullableStr(r.cta_type),
    cta_url: nullableStr(r.cta_url),
    utm_source: nullableStr(r.utm_source),
    utm_medium: nullableStr(r.utm_medium),
    utm_campaign: nullableStr(r.utm_campaign),
    utm_content: nullableStr(r.utm_content),
    image_prompt: nullableStr(r.image_prompt),
    audience: nullableStr(r.audience),
    status: str(r.status, "generated"),
    scheduled_at: tsStr(r.scheduled_at),
    published_at: tsStr(r.published_at),
    source_topic: nullableStr(r.source_topic),
    views: num(r.views),
    clicks: num(r.clicks),
    created_at: r.created_at ? String(r.created_at) : undefined,
  };
}

export async function getPosts(
  status?: string,
  platform?: string,
  limit?: number,
): Promise<PostRow[]> {
  await bootstrap();
  const sql = getSql();
  const lim = limit && limit > 0 ? Math.min(limit, 500) : 200;

  let rows: Record<string, unknown>[];
  if (status && platform) {
    rows = (await sql`
      SELECT * FROM content_posts
      WHERE status = ${status} AND platform = ${platform}
      ORDER BY created_at DESC, id DESC
      LIMIT ${lim}
    `) as Record<string, unknown>[];
  } else if (status) {
    rows = (await sql`
      SELECT * FROM content_posts
      WHERE status = ${status}
      ORDER BY created_at DESC, id DESC
      LIMIT ${lim}
    `) as Record<string, unknown>[];
  } else if (platform) {
    rows = (await sql`
      SELECT * FROM content_posts
      WHERE platform = ${platform}
      ORDER BY created_at DESC, id DESC
      LIMIT ${lim}
    `) as Record<string, unknown>[];
  } else {
    rows = (await sql`
      SELECT * FROM content_posts
      ORDER BY created_at DESC, id DESC
      LIMIT ${lim}
    `) as Record<string, unknown>[];
  }
  return rows.map(mapPost);
}

export async function createPost(data: Partial<PostRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO content_posts
      (title, body, platform, category, cta_type, cta_url,
       utm_source, utm_medium, utm_campaign, utm_content,
       image_prompt, audience, status, scheduled_at, published_at,
       source_topic, views, clicks)
    VALUES (
      ${nullableStr(data.title)},
      ${str(data.body)},
      ${str(data.platform, "telegram")},
      ${str(data.category, "useful")},
      ${nullableStr(data.cta_type)},
      ${nullableStr(data.cta_url)},
      ${nullableStr(data.utm_source)},
      ${nullableStr(data.utm_medium)},
      ${nullableStr(data.utm_campaign)},
      ${nullableStr(data.utm_content)},
      ${nullableStr(data.image_prompt)},
      ${nullableStr(data.audience)},
      ${str(data.status, "generated")},
      ${nullableStr(data.scheduled_at)},
      ${nullableStr(data.published_at)},
      ${nullableStr(data.source_topic)},
      ${num(data.views)},
      ${num(data.clicks)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

export async function updatePost(id: number, data: Partial<PostRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  /* COALESCE keeps the existing value whenever a field is omitted. */
  await sql`
    UPDATE content_posts SET
      title        = COALESCE(${data.title ?? null},                    title),
      body         = COALESCE(${data.body ?? null},                     body),
      platform     = COALESCE(${data.platform ?? null},                 platform),
      category     = COALESCE(${data.category ?? null},                 category),
      cta_type     = COALESCE(${data.cta_type ?? null},                 cta_type),
      cta_url      = COALESCE(${data.cta_url ?? null},                  cta_url),
      utm_source   = COALESCE(${data.utm_source ?? null},               utm_source),
      utm_medium   = COALESCE(${data.utm_medium ?? null},               utm_medium),
      utm_campaign = COALESCE(${data.utm_campaign ?? null},             utm_campaign),
      utm_content  = COALESCE(${data.utm_content ?? null},              utm_content),
      image_prompt = COALESCE(${data.image_prompt ?? null},             image_prompt),
      audience     = COALESCE(${data.audience ?? null},                 audience),
      status       = COALESCE(${data.status ?? null},                   status),
      scheduled_at = COALESCE(${data.scheduled_at ?? null}::timestamptz, scheduled_at),
      published_at = COALESCE(${data.published_at ?? null}::timestamptz, published_at),
      source_topic = COALESCE(${data.source_topic ?? null},             source_topic),
      views        = COALESCE(${nullableNum(data.views)},               views),
      clicks       = COALESCE(${nullableNum(data.clicks)},              clicks)
    WHERE id = ${id}
  `;
}

/* ── Topics ───────────────────────────────────────────────────────────────── */

function mapTopic(r: Record<string, unknown>): TopicRow {
  return {
    id: num(r.id),
    title: str(r.title),
    category: str(r.category, "news"),
    priority: num(r.priority, 5),
    status: str(r.status, "pending"),
    source: nullableStr(r.source),
    created_at: r.created_at ? String(r.created_at) : undefined,
  };
}

export async function getTopics(status?: string): Promise<TopicRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (status
    ? await sql`
        SELECT * FROM content_topics
        WHERE status = ${status}
        ORDER BY priority DESC, id DESC
      `
    : await sql`
        SELECT * FROM content_topics
        ORDER BY priority DESC, id DESC
      `) as Record<string, unknown>[];
  return rows.map(mapTopic);
}

export async function createTopic(data: Partial<TopicRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO content_topics (title, category, priority, status, source)
    VALUES (
      ${str(data.title, "Без названия")},
      ${str(data.category, "news")},
      ${num(data.priority, 5)},
      ${str(data.status, "pending")},
      ${nullableStr(data.source)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

export async function updateTopic(id: number, data: Partial<TopicRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    UPDATE content_topics SET
      title    = COALESCE(${data.title ?? null},              title),
      category = COALESCE(${data.category ?? null},           category),
      priority = COALESCE(${nullableNum(data.priority)},      priority),
      status   = COALESCE(${data.status ?? null},             status),
      source   = COALESCE(${data.source ?? null},             source)
    WHERE id = ${id}
  `;
}

/* ── Schedule ─────────────────────────────────────────────────────────────── */

export async function getSchedule(): Promise<ScheduleRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM content_schedule
    ORDER BY
      CASE platform WHEN 'telegram' THEN 0 WHEN 'vk' THEN 1 WHEN 'max' THEN 2 ELSE 3 END,
      id ASC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: num(r.id),
    platform: str(r.platform),
    posts_per_day: num(r.posts_per_day, 3),
    min_interval_minutes: num(r.min_interval_minutes, 180),
    posting_times: str(r.posting_times, "[]"),
    is_active: bool(r.is_active),
    updated_at: r.updated_at ? String(r.updated_at) : undefined,
  }));
}

export async function updateSchedule(platform: string, data: Partial<ScheduleRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  const isActive =
    data.is_active === undefined || data.is_active === null ? null : Boolean(data.is_active);
  await sql`
    UPDATE content_schedule SET
      posts_per_day        = COALESCE(${nullableNum(data.posts_per_day)},        posts_per_day),
      min_interval_minutes = COALESCE(${nullableNum(data.min_interval_minutes)}, min_interval_minutes),
      posting_times        = COALESCE(${data.posting_times ?? null},             posting_times),
      is_active            = COALESCE(${isActive}::boolean,                      is_active),
      updated_at           = NOW()
    WHERE platform = ${platform}
  `;
}

/* ── Analytics ────────────────────────────────────────────────────────────── */

export async function getAnalyticsSummary(): Promise<AnalyticsSummaryRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      platform,
      COALESCE(SUM(views),         0) AS views,
      COALESCE(SUM(clicks),        0) AS clicks,
      COALESCE(SUM(registrations), 0) AS registrations,
      COALESCE(SUM(trials),        0) AS trials,
      COALESCE(SUM(leads),         0) AS leads,
      COALESCE(SUM(payments),      0) AS payments
    FROM content_analytics
    GROUP BY platform
    ORDER BY views DESC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    platform: str(r.platform),
    views: num(r.views),
    clicks: num(r.clicks),
    registrations: num(r.registrations),
    trials: num(r.trials),
    leads: num(r.leads),
    payments: num(r.payments),
  }));
}

export async function getPostAnalytics(postId: number): Promise<AnalyticsRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM content_analytics
    WHERE post_id = ${postId}
    ORDER BY date DESC, id DESC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: num(r.id),
    post_id: nullableNum(r.post_id),
    platform: str(r.platform),
    date: dateStr(r.date),
    views: num(r.views),
    clicks: num(r.clicks),
    reactions: num(r.reactions),
    registrations: num(r.registrations),
    trials: num(r.trials),
    leads: num(r.leads),
    payments: num(r.payments),
    created_at: r.created_at ? String(r.created_at) : undefined,
  }));
}

/* ── Advertising channels ─────────────────────────────────────────────────── */

function mapAdChannel(r: Record<string, unknown>): AdChannelRow {
  return {
    id: num(r.id),
    name: str(r.name),
    url: nullableStr(r.url),
    platform: str(r.platform, "telegram"),
    audience_size: nullableNum(r.audience_size),
    er: nullableNum(r.er),
    ad_price: nullableNum(r.ad_price),
    contact: nullableStr(r.contact),
    topic: nullableStr(r.topic),
    geography: nullableStr(r.geography),
    avg_views: nullableNum(r.avg_views),
    ai_score: nullableNum(r.ai_score),
    ai_verdict: nullableStr(r.ai_verdict),
    status: str(r.status, "found"),
    notes: nullableStr(r.notes),
    created_at: r.created_at ? String(r.created_at) : undefined,
  };
}

export async function getAdChannels(status?: string): Promise<AdChannelRow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (status
    ? await sql`
        SELECT * FROM advertising_channels
        WHERE status = ${status}
        ORDER BY COALESCE(ai_score, 0) DESC, id DESC
      `
    : await sql`
        SELECT * FROM advertising_channels
        ORDER BY COALESCE(ai_score, 0) DESC, id DESC
      `) as Record<string, unknown>[];
  return rows.map(mapAdChannel);
}

export async function createAdChannel(data: Partial<AdChannelRow>): Promise<number> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO advertising_channels
      (name, url, platform, audience_size, er, ad_price, contact, topic,
       geography, avg_views, ai_score, ai_verdict, status, notes)
    VALUES (
      ${str(data.name, "Без названия")},
      ${nullableStr(data.url)},
      ${str(data.platform, "telegram")},
      ${nullableNum(data.audience_size)},
      ${nullableNum(data.er)},
      ${nullableNum(data.ad_price)},
      ${nullableStr(data.contact)},
      ${nullableStr(data.topic)},
      ${nullableStr(data.geography)},
      ${nullableNum(data.avg_views)},
      ${nullableNum(data.ai_score)},
      ${nullableStr(data.ai_verdict)},
      ${str(data.status, "found")},
      ${nullableStr(data.notes)}
    )
    RETURNING id
  `) as Record<string, unknown>[];
  return num(rows[0]?.id);
}

export async function updateAdChannel(id: number, data: Partial<AdChannelRow>): Promise<void> {
  await bootstrap();
  const sql = getSql();
  await sql`
    UPDATE advertising_channels SET
      name          = COALESCE(${data.name ?? null},                name),
      url           = COALESCE(${data.url ?? null},                 url),
      platform      = COALESCE(${data.platform ?? null},            platform),
      audience_size = COALESCE(${nullableNum(data.audience_size)},  audience_size),
      er            = COALESCE(${nullableNum(data.er)},             er),
      ad_price      = COALESCE(${nullableNum(data.ad_price)},       ad_price),
      contact       = COALESCE(${data.contact ?? null},             contact),
      topic         = COALESCE(${data.topic ?? null},               topic),
      geography     = COALESCE(${data.geography ?? null},           geography),
      avg_views     = COALESCE(${nullableNum(data.avg_views)},      avg_views),
      ai_score      = COALESCE(${nullableNum(data.ai_score)},       ai_score),
      ai_verdict    = COALESCE(${data.ai_verdict ?? null},          ai_verdict),
      status        = COALESCE(${data.status ?? null},              status),
      notes         = COALESCE(${data.notes ?? null},               notes)
    WHERE id = ${id}
  `;
}

/* ── CTA library ──────────────────────────────────────────────────────────── */

export async function getCTAs(): Promise<CTARow[]> {
  await bootstrap();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM content_cta
    WHERE is_active = true
    ORDER BY weight DESC, id ASC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: num(r.id),
    name: str(r.name),
    cta_type: str(r.cta_type),
    text_template: str(r.text_template),
    url: str(r.url),
    weight: num(r.weight, 10),
    is_active: bool(r.is_active),
  }));
}
