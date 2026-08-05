import { neon } from "@neondatabase/serverless";
import type { MILead, MIRadarSignal, MILeadPipeline, MIDailyReport } from "./types";

function sql() {
  return neon(process.env.DATABASE_URL!);
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let miInitialized = false;

export async function ensureMISchema() {
  if (miInitialized) return;
  miInitialized = true;
  const db = sql();

  await db`
    CREATE TABLE IF NOT EXISTS "mi_leads" (
      "id"            serial PRIMARY KEY NOT NULL,
      "lead_id"       text NOT NULL UNIQUE,
      "tenant_id"     text NOT NULL,
      "source"        text DEFAULT 'google' NOT NULL,
      "source_url"    text DEFAULT '' NOT NULL,
      "source_channel" text DEFAULT '' NOT NULL,
      "company"       text DEFAULT '' NOT NULL,
      "contact"       text DEFAULT '' NOT NULL,
      "phone"         text DEFAULT '' NOT NULL,
      "email"         text DEFAULT '' NOT NULL,
      "telegram"      text DEFAULT '' NOT NULL,
      "website"       text DEFAULT '' NOT NULL,
      "city"          text DEFAULT '' NOT NULL,
      "country"       text DEFAULT 'RU' NOT NULL,
      "type"          text DEFAULT 'unknown' NOT NULL,
      "temperature"   text DEFAULT 'COLD' NOT NULL,
      "score"         integer DEFAULT 0 NOT NULL,
      "score_reason"  text DEFAULT '' NOT NULL,
      "description"   text DEFAULT '' NOT NULL,
      "next_action"   text DEFAULT '' NOT NULL,
      "pipeline"      text DEFAULT 'NEW' NOT NULL,
      "created_at"    text NOT NULL,
      "updated_at"    text NOT NULL
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS "mi_radar" (
      "id"               serial PRIMARY KEY NOT NULL,
      "signal_id"        text NOT NULL UNIQUE,
      "tenant_id"        text NOT NULL,
      "type"             text DEFAULT 'trend' NOT NULL,
      "name"             text DEFAULT '' NOT NULL,
      "description"      text DEFAULT '' NOT NULL,
      "url"              text DEFAULT '' NOT NULL,
      "subscribers"      integer DEFAULT 0 NOT NULL,
      "growth"           integer DEFAULT 0 NOT NULL,
      "activity"         text DEFAULT '' NOT NULL,
      "country"          text DEFAULT 'RU' NOT NULL,
      "opportunity_score" integer DEFAULT 0 NOT NULL,
      "ai_analysis"      text DEFAULT '' NOT NULL,
      "created_at"       text NOT NULL,
      "updated_at"       text NOT NULL
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS "mi_reports" (
      "id"                    serial PRIMARY KEY NOT NULL,
      "tenant_id"             text NOT NULL,
      "report_id"             text NOT NULL UNIQUE,
      "date"                  text NOT NULL,
      "leads_found"           integer DEFAULT 0 NOT NULL,
      "leads_google"          integer DEFAULT 0 NOT NULL,
      "leads_telegram"        integer DEFAULT 0 NOT NULL,
      "leads_vk"              integer DEFAULT 0 NOT NULL,
      "hot_leads"             integer DEFAULT 0 NOT NULL,
      "new_companies"         integer DEFAULT 0 NOT NULL,
      "new_telegram_channels" integer DEFAULT 0 NOT NULL,
      "new_vk_communities"    integer DEFAULT 0 NOT NULL,
      "top_deal_company"      text DEFAULT '' NOT NULL,
      "top_deal_score"        integer DEFAULT 0 NOT NULL,
      "top_deal_probability"  integer DEFAULT 0 NOT NULL,
      "top_deal_revenue"      numeric DEFAULT 0 NOT NULL,
      "trend_of_week"         text DEFAULT '' NOT NULL,
      "trend_growth"          integer DEFAULT 0 NOT NULL,
      "recommendations"       jsonb DEFAULT '[]'::jsonb NOT NULL,
      "full_text"             text DEFAULT '' NOT NULL,
      "created_at"            text NOT NULL
    )
  `;

  await db`CREATE INDEX IF NOT EXISTS "mi_leads_tenant_idx" ON "mi_leads" ("tenant_id")`;
  await db`CREATE INDEX IF NOT EXISTS "mi_leads_source_idx" ON "mi_leads" ("source")`;
  await db`CREATE INDEX IF NOT EXISTS "mi_leads_temp_idx"   ON "mi_leads" ("temperature")`;
  await db`CREATE INDEX IF NOT EXISTS "mi_radar_tenant_idx" ON "mi_radar" ("tenant_id")`;
  await db`CREATE INDEX IF NOT EXISTS "mi_radar_type_idx"   ON "mi_radar" ("type")`;
  await db`CREATE INDEX IF NOT EXISTS "mi_reports_tenant_idx" ON "mi_reports" ("tenant_id")`;
}

// ─── MI Leads ─────────────────────────────────────────────────────────────────

function rowToLead(r: Record<string, unknown>): MILead {
  return {
    id:            r.id as number,
    leadId:        r.lead_id as string,
    tenantId:      r.tenant_id as string,
    source:        r.source as MILead["source"],
    sourceUrl:     r.source_url as string,
    sourceChannel: r.source_channel as string,
    company:       r.company as string,
    contact:       r.contact as string,
    phone:         r.phone as string,
    email:         r.email as string,
    telegram:      r.telegram as string,
    website:       r.website as string,
    city:          r.city as string,
    country:       r.country as string,
    type:          r.type as MILead["type"],
    temperature:   r.temperature as MILead["temperature"],
    score:         Number(r.score),
    scoreReason:   r.score_reason as string,
    description:   r.description as string,
    nextAction:    r.next_action as string,
    pipeline:      r.pipeline as MILeadPipeline,
    createdAt:     r.created_at as string,
    updatedAt:     r.updated_at as string,
  };
}

export async function getMILeads(tenantId: string, filters: {
  source?: string; temperature?: string; type?: string; pipeline?: string;
} = {}): Promise<MILead[]> {
  await ensureMISchema();
  const db = sql();

  let rows: Record<string, unknown>[];
  if (filters.source && filters.temperature) {
    rows = await db`SELECT * FROM mi_leads WHERE tenant_id = ${tenantId} AND source = ${filters.source} AND temperature = ${filters.temperature} ORDER BY score DESC, created_at DESC LIMIT 500`;
  } else if (filters.source) {
    rows = await db`SELECT * FROM mi_leads WHERE tenant_id = ${tenantId} AND source = ${filters.source} ORDER BY score DESC, created_at DESC LIMIT 500`;
  } else if (filters.temperature) {
    rows = await db`SELECT * FROM mi_leads WHERE tenant_id = ${tenantId} AND temperature = ${filters.temperature} ORDER BY score DESC, created_at DESC LIMIT 500`;
  } else if (filters.pipeline) {
    rows = await db`SELECT * FROM mi_leads WHERE tenant_id = ${tenantId} AND pipeline = ${filters.pipeline} ORDER BY score DESC, created_at DESC LIMIT 500`;
  } else {
    rows = await db`SELECT * FROM mi_leads WHERE tenant_id = ${tenantId} ORDER BY score DESC, created_at DESC LIMIT 500`;
  }

  return (rows as Record<string, unknown>[]).map(rowToLead);
}

export async function saveMILead(lead: Omit<MILead, "id">): Promise<void> {
  await ensureMISchema();
  const db = sql();
  await db`
    INSERT INTO mi_leads (lead_id, tenant_id, source, source_url, source_channel, company, contact, phone, email, telegram, website, city, country, type, temperature, score, score_reason, description, next_action, pipeline, created_at, updated_at)
    VALUES (${lead.leadId}, ${lead.tenantId}, ${lead.source}, ${lead.sourceUrl ?? ""}, ${lead.sourceChannel ?? ""}, ${lead.company}, ${lead.contact ?? ""}, ${lead.phone ?? ""}, ${lead.email ?? ""}, ${lead.telegram ?? ""}, ${lead.website ?? ""}, ${lead.city ?? ""}, ${lead.country ?? "RU"}, ${lead.type}, ${lead.temperature}, ${lead.score}, ${lead.scoreReason}, ${lead.description}, ${lead.nextAction ?? ""}, ${lead.pipeline}, ${lead.createdAt}, ${lead.updatedAt})
    ON CONFLICT (lead_id) DO UPDATE SET score = EXCLUDED.score, temperature = EXCLUDED.temperature, updated_at = EXCLUDED.updated_at
  `;
}

export async function updateMILeadPipeline(id: number, pipeline: MILeadPipeline): Promise<void> {
  await ensureMISchema();
  const db = sql();
  await db`UPDATE mi_leads SET pipeline = ${pipeline}, updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export async function getMILeadStats(tenantId: string) {
  await ensureMISchema();
  const db = sql();
  const [row] = await db`
    SELECT
      COUNT(*)::int                                        AS total,
      COUNT(*) FILTER (WHERE temperature='HOT')::int       AS hot,
      COUNT(*) FILTER (WHERE temperature='WARM')::int      AS warm,
      COUNT(*) FILTER (WHERE temperature='COLD')::int      AS cold,
      COUNT(*) FILTER (WHERE source='google')::int         AS google,
      COUNT(*) FILTER (WHERE source='telegram')::int       AS telegram,
      COUNT(*) FILTER (WHERE source='vk')::int             AS vk,
      COUNT(*) FILTER (WHERE pipeline='CLIENT')::int       AS clients,
      AVG(score)::int                                      AS avg_score
    FROM mi_leads WHERE tenant_id = ${tenantId}
  ` as unknown as Record<string, number>[];
  return row ?? { total:0, hot:0, warm:0, cold:0, google:0, telegram:0, vk:0, clients:0, avg_score:0 };
}

// ─── MI Radar ─────────────────────────────────────────────────────────────────

function rowToSignal(r: Record<string, unknown>): MIRadarSignal {
  return {
    id:               r.id as number,
    signalId:         r.signal_id as string,
    tenantId:         r.tenant_id as string,
    type:             r.type as MIRadarSignal["type"],
    name:             r.name as string,
    description:      r.description as string,
    url:              r.url as string,
    subscribers:      Number(r.subscribers),
    growth:           Number(r.growth),
    activity:         r.activity as string,
    country:          r.country as string,
    opportunityScore: Number(r.opportunity_score),
    aiAnalysis:       r.ai_analysis as string,
    createdAt:        r.created_at as string,
    updatedAt:        r.updated_at as string,
  };
}

export async function getRadarSignals(tenantId: string, type?: string): Promise<MIRadarSignal[]> {
  await ensureMISchema();
  const db = sql();
  const rows = type
    ? await db`SELECT * FROM mi_radar WHERE tenant_id = ${tenantId} AND type = ${type} ORDER BY opportunity_score DESC, created_at DESC LIMIT 200`
    : await db`SELECT * FROM mi_radar WHERE tenant_id = ${tenantId} ORDER BY opportunity_score DESC, created_at DESC LIMIT 200`;
  return (rows as Record<string, unknown>[]).map(rowToSignal);
}

export async function saveRadarSignal(signal: Omit<MIRadarSignal, "id">): Promise<void> {
  await ensureMISchema();
  const db = sql();
  await db`
    INSERT INTO mi_radar (signal_id, tenant_id, type, name, description, url, subscribers, growth, activity, country, opportunity_score, ai_analysis, created_at, updated_at)
    VALUES (${signal.signalId}, ${signal.tenantId}, ${signal.type}, ${signal.name}, ${signal.description ?? ""}, ${signal.url ?? ""}, ${signal.subscribers ?? 0}, ${signal.growth ?? 0}, ${signal.activity ?? ""}, ${signal.country ?? "RU"}, ${signal.opportunityScore}, ${signal.aiAnalysis ?? ""}, ${signal.createdAt}, ${signal.updatedAt})
    ON CONFLICT (signal_id) DO UPDATE SET opportunity_score = EXCLUDED.opportunity_score, updated_at = EXCLUDED.updated_at
  `;
}

// ─── MI Reports ───────────────────────────────────────────────────────────────

export async function saveReport(report: MIDailyReport): Promise<void> {
  await ensureMISchema();
  const db = sql();
  await db`
    INSERT INTO mi_reports (tenant_id, report_id, date, leads_found, leads_google, leads_telegram, leads_vk, hot_leads, new_companies, new_telegram_channels, new_vk_communities, top_deal_company, top_deal_score, top_deal_probability, top_deal_revenue, trend_of_week, trend_growth, recommendations, full_text, created_at)
    VALUES (${report.tenantId}, ${report.reportId}, ${report.date}, ${report.leadsFound}, ${report.leadsGoogle}, ${report.leadsTelegram}, ${report.leadsVk}, ${report.hotLeads}, ${report.newCompanies}, ${report.newTelegramChannels}, ${report.newVkCommunities}, ${report.topDealCompany ?? ""}, ${report.topDealScore ?? 0}, ${report.topDealProbability ?? 0}, ${report.topDealRevenue ?? 0}, ${report.trendOfWeek ?? ""}, ${report.trendGrowth ?? 0}, ${JSON.stringify(report.recommendations)}, ${report.fullText}, ${report.createdAt})
    ON CONFLICT (report_id) DO NOTHING
  `;
}

export async function getLatestReport(tenantId: string): Promise<MIDailyReport | null> {
  await ensureMISchema();
  const db = sql();
  const [row] = await db`SELECT * FROM mi_reports WHERE tenant_id = ${tenantId} ORDER BY date DESC LIMIT 1` as unknown as Record<string, unknown>[];
  if (!row) return null;
  return {
    id:                   row.id as number,
    tenantId:             row.tenant_id as string,
    reportId:             row.report_id as string,
    date:                 row.date as string,
    leadsFound:           Number(row.leads_found),
    leadsGoogle:          Number(row.leads_google),
    leadsTelegram:        Number(row.leads_telegram),
    leadsVk:              Number(row.leads_vk),
    hotLeads:             Number(row.hot_leads),
    newCompanies:         Number(row.new_companies),
    newTelegramChannels:  Number(row.new_telegram_channels),
    newVkCommunities:     Number(row.new_vk_communities),
    topDealCompany:       row.top_deal_company as string,
    topDealScore:         Number(row.top_deal_score),
    topDealProbability:   Number(row.top_deal_probability),
    topDealRevenue:       Number(row.top_deal_revenue),
    trendOfWeek:          row.trend_of_week as string,
    trendGrowth:          Number(row.trend_growth),
    recommendations:      (row.recommendations as string[]) ?? [],
    fullText:             row.full_text as string,
    createdAt:            row.created_at as string,
  };
}
