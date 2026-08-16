-- ChinaBridge Leads Table
-- Выполни в Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS chinabridge_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT,                    -- google_maps / wildberries / ozon / instagram
  company_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  country TEXT DEFAULT 'KZ',
  category TEXT,
  address TEXT,
  rating NUMERIC(3,1),
  reviews INTEGER,
  instagram TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',     -- new / contacted / interested / client / rejected
  contacted_at TIMESTAMP WITH TIME ZONE,
  response TEXT
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_leads_status ON chinabridge_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_city ON chinabridge_leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_source ON chinabridge_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON chinabridge_leads(created_at DESC);

-- Защита от дублей по телефону
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_unique
  ON chinabridge_leads(phone)
  WHERE phone IS NOT NULL AND phone != '';

-- RLS
ALTER TABLE chinabridge_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated" ON chinabridge_leads;
CREATE POLICY "Allow all authenticated" ON chinabridge_leads
  FOR ALL USING (true);

-- View для статистики
CREATE OR REPLACE VIEW chinabridge_leads_stats AS
SELECT
  source,
  city,
  status,
  COUNT(*) as count,
  DATE_TRUNC('week', created_at) as week
FROM chinabridge_leads
GROUP BY source, city, status, DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- Проверка
SELECT 'Table created successfully' as result;
SELECT COUNT(*) as leads_count FROM chinabridge_leads;
