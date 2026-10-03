-- ============================================================
-- Migration 003: Lead Qualification fields
-- ChinaBridge AI Sales Department pipeline
-- Run: psql $DATABASE_URL -f migrations/003_qualify_leads.sql
-- ============================================================

BEGIN;

ALTER TABLE outreach_contacts
  ADD COLUMN IF NOT EXISTS lead_score      CHAR(1)      CHECK (lead_score IN ('A','B','C','D')),
  ADD COLUMN IF NOT EXISTS ai_analysis     TEXT,
  ADD COLUMN IF NOT EXISTS website_scraped BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qualified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tokens_used     INTEGER,

  ADD COLUMN IF NOT EXISTS sales_channel   TEXT,
  ADD COLUMN IF NOT EXISTS stop_factors    TEXT,
  ADD COLUMN IF NOT EXISTS china_products  TEXT,
  ADD COLUMN IF NOT EXISTS deal_cycle      TEXT,

  ADD COLUMN IF NOT EXISTS offer_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_received_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outreach_channel   TEXT,
  ADD COLUMN IF NOT EXISTS outreach_message   TEXT;

CREATE INDEX IF NOT EXISTS idx_outreach_lead_score
  ON outreach_contacts (lead_score)
  WHERE lead_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_qualified_at
  ON outreach_contacts (qualified_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_outreach_offer_sent
  ON outreach_contacts (offer_sent_at)
  WHERE offer_sent_at IS NOT NULL;

CREATE OR REPLACE VIEW v_hot_leads AS
SELECT
  id,
  company_name,
  region,
  okvad AS okved,
  revenue,
  employees,
  director,
  phone,
  email,
  site_url AS website,
  lead_score,
  sales_channel,
  china_products,
  stop_factors,
  deal_cycle,
  outreach_message,
  qualified_at,
  offer_sent_at,
  reply_received_at,
  status
FROM outreach_contacts
WHERE lead_score IN ('A', 'B')
  AND (phone IS NOT NULL OR email IS NOT NULL)
ORDER BY
  lead_score ASC,
  revenue DESC NULLS LAST;

COMMENT ON VIEW v_hot_leads IS 'Горячие лиды A/B с контактами — для менеджера по продажам';

COMMIT;

-- Проверка
SELECT
  COUNT(*) FILTER (WHERE lead_score IS NULL)  AS "не квалифицированы",
  COUNT(*) FILTER (WHERE lead_score = 'A')     AS "Score A",
  COUNT(*) FILTER (WHERE lead_score = 'B')     AS "Score B",
  COUNT(*) FILTER (WHERE lead_score = 'C')     AS "Score C",
  COUNT(*) FILTER (WHERE lead_score = 'D')     AS "Score D"
FROM outreach_contacts;
