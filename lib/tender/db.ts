import { neon } from "@neondatabase/serverless";
import type {
  RawTender, TenderOpportunity, TenderCompany,
  OpportunityStatus, TenderStream,
} from "./types";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

let schemaReady = false;

export async function ensureTenderSchema(): Promise<void> {
  if (schemaReady) return;
  const db = sql();

  await db`
    CREATE TABLE IF NOT EXISTS tender_sources (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      url           TEXT NOT NULL,
      source_type   TEXT NOT NULL DEFAULT 'government',
      active        BOOLEAN NOT NULL DEFAULT true,
      crawl_frequency INTEGER NOT NULL DEFAULT 4,
      last_checked  TIMESTAMPTZ,
      last_success  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await db`
    CREATE TABLE IF NOT EXISTS tender_procedures (
      id               TEXT PRIMARY KEY,
      source           TEXT NOT NULL,
      purchase_number  TEXT NOT NULL UNIQUE,
      purchase_type    TEXT,
      law_type         TEXT NOT NULL DEFAULT '44fz',
      customer         TEXT NOT NULL,
      customer_inn     TEXT,
      customer_region  TEXT,
      subject          TEXT NOT NULL,
      category         TEXT,
      description      TEXT,
      quantity         NUMERIC,
      unit             TEXT,
      initial_price    NUMERIC NOT NULL,
      final_price      NUMERIC NOT NULL,
      currency         TEXT NOT NULL DEFAULT 'RUB',
      publication_date TIMESTAMPTZ,
      end_date         TIMESTAMPTZ,
      contract_date    TIMESTAMPTZ,
      delivery_deadline INTEGER,
      delivery_region  TEXT,
      winner           TEXT NOT NULL,
      winner_inn       TEXT NOT NULL,
      winner_price     NUMERIC NOT NULL,
      winner_rank      INTEGER NOT NULL DEFAULT 1,
      source_url       TEXT NOT NULL,
      detected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await db`CREATE INDEX IF NOT EXISTS tp_winner_inn ON tender_procedures(winner_inn)`;
  await db`CREATE INDEX IF NOT EXISTS tp_pub_date ON tender_procedures(publication_date DESC)`;

  await db`
    CREATE TABLE IF NOT EXISTS tender_companies (
      inn              TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      region           TEXT,
      win_count        INTEGER NOT NULL DEFAULT 0,
      win_count_30d    INTEGER NOT NULL DEFAULT 0,
      win_count_90d    INTEGER NOT NULL DEFAULT 0,
      win_count_365d   INTEGER NOT NULL DEFAULT 0,
      total_amount     NUMERIC NOT NULL DEFAULT 0,
      categories       TEXT[] NOT NULL DEFAULT '{}',
      repeat_winner    BOOLEAN NOT NULL DEFAULT false,
      is_new_winner    BOOLEAN NOT NULL DEFAULT false,
      contact_phone    TEXT,
      contact_email    TEXT,
      website          TEXT,
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await db`
    CREATE TABLE IF NOT EXISTS tender_opportunities (
      id                      TEXT PRIMARY KEY,
      tender_id               TEXT NOT NULL REFERENCES tender_procedures(id),
      company_id              TEXT NOT NULL,
      source                  TEXT NOT NULL DEFAULT 'eis',
      purchase_number         TEXT NOT NULL,
      subject                 TEXT NOT NULL,
      category                TEXT NOT NULL DEFAULT '',
      law_type                TEXT NOT NULL DEFAULT '44fz',
      contract_value          NUMERIC NOT NULL,
      winner_price            NUMERIC NOT NULL,
      delivery_deadline       INTEGER,
      urgency                 TEXT NOT NULL DEFAULT 'MEDIUM',
      china_import_fit        INTEGER NOT NULL DEFAULT 0,
      opportunity_score       INTEGER NOT NULL DEFAULT 0,
      lead_score              INTEGER NOT NULL DEFAULT 0,
      intent_score            INTEGER NOT NULL DEFAULT 0,
      priority                TEXT NOT NULL DEFAULT 'LOW',
      status                  TEXT NOT NULL DEFAULT 'NEW',
      stream                  TEXT NOT NULL DEFAULT 'winners',
      repeat_winner           BOOLEAN NOT NULL DEFAULT false,
      win_count               INTEGER NOT NULL DEFAULT 1,
      ai_summary              TEXT,
      recommended_offer       TEXT,
      next_best_action        TEXT,
      estimated_china_cost    NUMERIC,
      estimated_logistics     NUMERIC,
      estimated_customs       NUMERIC,
      estimated_margin        NUMERIC,
      estimated_margin_percent NUMERIC,
      scoring_model_version   TEXT NOT NULL DEFAULT 'tender_scoring_v1.0',
      source_url              TEXT NOT NULL,
      crm_lead_id             TEXT,
      manager_feedback        TEXT,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await db`CREATE INDEX IF NOT EXISTS to_status ON tender_opportunities(status)`;
  await db`CREATE INDEX IF NOT EXISTS to_opp_score ON tender_opportunities(opportunity_score DESC)`;
  await db`CREATE INDEX IF NOT EXISTS to_company ON tender_opportunities(company_id)`;
  await db`CREATE INDEX IF NOT EXISTS to_created ON tender_opportunities(created_at DESC)`;

  // Seed default sources
  await db`
    INSERT INTO tender_sources (id, name, url, source_type, crawl_frequency)
    VALUES
      ('eis_44fz', 'ЕИС 44-ФЗ', 'https://zakupki.gov.ru', 'government', 4),
      ('eis_223fz', 'ЕИС 223-ФЗ', 'https://zakupki.gov.ru', 'government', 6)
    ON CONFLICT (id) DO NOTHING`;

  schemaReady = true;
}

export async function saveProcedure(t: RawTender): Promise<boolean> {
  const db = sql();
  try {
    await db`
      INSERT INTO tender_procedures (
        id, source, purchase_number, purchase_type, law_type,
        customer, customer_inn, customer_region,
        subject, category, description, quantity, unit,
        initial_price, final_price, currency,
        publication_date, end_date, contract_date,
        delivery_deadline, delivery_region,
        winner, winner_inn, winner_price, winner_rank, source_url
      ) VALUES (
        ${t.tender_id}, ${t.source}, ${t.purchase_number}, ${t.purchase_type}, ${t.law_type},
        ${t.customer}, ${t.customer_inn}, ${t.customer_region},
        ${t.subject}, ${t.category}, ${t.description}, ${t.quantity}, ${t.unit},
        ${t.initial_price}, ${t.final_price}, ${t.currency},
        ${t.publication_date}, ${t.end_date}, ${t.contract_date},
        ${t.delivery_deadline}, ${t.delivery_region},
        ${t.winner}, ${t.winner_inn}, ${t.winner_price}, ${t.winner_rank}, ${t.source_url}
      )
      ON CONFLICT (purchase_number) DO NOTHING`;
    return true;
  } catch {
    return false;
  }
}

export async function upsertCompany(company: Omit<TenderCompany, "updated_at">): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO tender_companies (
      inn, name, region, win_count, win_count_30d, win_count_90d, win_count_365d,
      total_amount, categories, repeat_winner, is_new_winner,
      contact_phone, contact_email, website
    ) VALUES (
      ${company.inn}, ${company.name}, ${company.region},
      ${company.win_count}, ${company.win_count_30d}, ${company.win_count_90d}, ${company.win_count_365d},
      ${company.total_amount}, ${company.categories},
      ${company.repeat_winner}, ${company.is_new_winner},
      ${company.contact_phone}, ${company.contact_email}, ${company.website}
    )
    ON CONFLICT (inn) DO UPDATE SET
      name            = EXCLUDED.name,
      win_count       = EXCLUDED.win_count,
      win_count_30d   = EXCLUDED.win_count_30d,
      win_count_90d   = EXCLUDED.win_count_90d,
      win_count_365d  = EXCLUDED.win_count_365d,
      total_amount    = EXCLUDED.total_amount,
      categories      = EXCLUDED.categories,
      repeat_winner   = EXCLUDED.repeat_winner,
      is_new_winner   = EXCLUDED.is_new_winner,
      updated_at      = NOW()`;
}

export async function getCompanyStats(inn: string): Promise<{
  win_count_30d: number; win_count_90d: number; win_count_365d: number; total_amount: number;
}> {
  const db = sql();
  const now = new Date();
  const d30  = new Date(now); d30.setDate(now.getDate() - 30);
  const d90  = new Date(now); d90.setDate(now.getDate() - 90);
  const d365 = new Date(now); d365.setDate(now.getDate() - 365);

  const rows = await db`
    SELECT
      COUNT(*) FILTER (WHERE detected_at >= ${d30.toISOString()})   AS c30,
      COUNT(*) FILTER (WHERE detected_at >= ${d90.toISOString()})   AS c90,
      COUNT(*) FILTER (WHERE detected_at >= ${d365.toISOString()})  AS c365,
      COALESCE(SUM(winner_price), 0)                                AS total
    FROM tender_procedures
    WHERE winner_inn = ${inn}`;

  const r = rows[0] as { c30: string; c90: string; c365: string; total: string };
  return {
    win_count_30d:  parseInt(r.c30)  || 0,
    win_count_90d:  parseInt(r.c90)  || 0,
    win_count_365d: parseInt(r.c365) || 0,
    total_amount:   parseFloat(r.total) || 0,
  };
}

export async function saveOpportunity(op: Omit<TenderOpportunity, "created_at" | "updated_at">): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO tender_opportunities (
      id, tender_id, company_id, source, purchase_number, subject, category, law_type,
      contract_value, winner_price, delivery_deadline, urgency,
      china_import_fit, opportunity_score, lead_score, intent_score,
      priority, status, stream, repeat_winner, win_count,
      ai_summary, recommended_offer, next_best_action,
      estimated_china_cost, estimated_logistics, estimated_customs,
      estimated_margin, estimated_margin_percent,
      scoring_model_version, source_url
    ) VALUES (
      ${op.id}, ${op.tender_id}, ${op.company_id}, ${op.source},
      ${op.purchase_number}, ${op.subject}, ${op.category}, ${op.law_type},
      ${op.contract_value}, ${op.winner_price}, ${op.delivery_deadline}, ${op.urgency},
      ${op.china_import_fit}, ${op.opportunity_score}, ${op.lead_score}, ${op.intent_score},
      ${op.priority}, ${op.status}, ${op.stream}, ${op.repeat_winner}, ${op.win_count},
      ${op.ai_summary}, ${op.recommended_offer}, ${op.next_best_action},
      ${op.estimated_china_cost}, ${op.estimated_logistics}, ${op.estimated_customs},
      ${op.estimated_margin}, ${op.estimated_margin_percent},
      ${op.scoring_model_version}, ${op.source_url}
    )
    ON CONFLICT (id) DO NOTHING`;
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus, feedback?: string): Promise<void> {
  const db = sql();
  await db`
    UPDATE tender_opportunities
    SET status = ${status}, manager_feedback = ${feedback ?? null}, updated_at = NOW()
    WHERE id = ${id}`;
}

export async function setOpportunityCRMLead(id: string, crmLeadId: string): Promise<void> {
  const db = sql();
  await db`UPDATE tender_opportunities SET crm_lead_id = ${crmLeadId}, updated_at = NOW() WHERE id = ${id}`;
}

export interface OpportunityFilters {
  status?: string;
  priority?: string;
  law_type?: string;
  stream?: string;
  min_fit?: number;
  min_score?: number;
  region?: string;
  page?: number;
  limit?: number;
}

export async function getOpportunities(filters: OpportunityFilters = {}): Promise<{
  rows: TenderOpportunity[]; total: number;
}> {
  const db = sql();
  const limit = filters.limit ?? 50;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const st  = filters.status   ?? "";
  const pr  = filters.priority ?? "";
  const lt  = filters.law_type ?? "";
  const sm  = filters.stream   ?? "";
  const mf  = filters.min_fit   ?? 0;
  const ms  = filters.min_score ?? 0;

  const rows = await db`
    SELECT o.*, c.name as company_name, c.repeat_winner as c_repeat, c.win_count_365d
    FROM tender_opportunities o
    LEFT JOIN tender_companies c ON c.inn = o.company_id
    WHERE 1=1
      AND (${st} = '' OR o.status = ${st})
      AND (${pr} = '' OR o.priority = ${pr})
      AND (${lt} = '' OR o.law_type = ${lt})
      AND (${sm} = '' OR o.stream = ${sm})
      AND (${mf} = 0 OR o.china_import_fit >= ${mf})
      AND (${ms} = 0 OR o.opportunity_score >= ${ms})
    ORDER BY o.opportunity_score DESC, o.created_at DESC
    LIMIT ${limit} OFFSET ${offset}`;

  const countRows = await db`
    SELECT COUNT(*) AS n FROM tender_opportunities o
    WHERE 1=1
      AND (${st} = '' OR o.status = ${st})
      AND (${pr} = '' OR o.priority = ${pr})`;

  return {
    rows: rows as unknown as TenderOpportunity[],
    total: parseInt((countRows[0] as { n: string }).n) || 0,
  };
}

export async function getDailyStats(): Promise<{
  total_procedures: number;
  total_winners: number;
  china_fit_80: number;
  opportunity_80: number;
  hot_count: number;
  repeat_winners: number;
  total_contract_value: number;
}> {
  const db = sql();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [p, o] = await Promise.all([
    db`SELECT COUNT(*) AS n FROM tender_procedures WHERE detected_at >= ${yesterday.toISOString()}`,
    db`
      SELECT
        COUNT(*)                                              AS total,
        COUNT(*) FILTER (WHERE china_import_fit >= 80)       AS fit80,
        COUNT(*) FILTER (WHERE opportunity_score >= 80)      AS opp80,
        COUNT(*) FILTER (WHERE status = 'HOT')               AS hot,
        COUNT(*) FILTER (WHERE repeat_winner = true)         AS repeat,
        COALESCE(SUM(contract_value) FILTER (WHERE opportunity_score >= 80), 0) AS val
      FROM tender_opportunities
      WHERE created_at >= ${yesterday.toISOString()}`,
  ]);

  const r = o[0] as Record<string, string>;
  return {
    total_procedures: parseInt((p[0] as { n: string }).n) || 0,
    total_winners: parseInt(r.total) || 0,
    china_fit_80: parseInt(r.fit80) || 0,
    opportunity_80: parseInt(r.opp80) || 0,
    hot_count: parseInt(r.hot) || 0,
    repeat_winners: parseInt(r.repeat) || 0,
    total_contract_value: parseFloat(r.val) || 0,
  };
}
