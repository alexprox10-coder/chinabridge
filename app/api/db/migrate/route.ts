import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

// SQL embedded directly — avoids filesystem issues in Vercel serverless
const MIGRATION_STATEMENTS = [
  // Tables — tenants first (FK target)
  `CREATE TABLE IF NOT EXISTS "tenants" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL,
    "company_name" text NOT NULL,
    "domain" text,
    "subdomain" text NOT NULL,
    "country" text DEFAULT 'RU' NOT NULL,
    "timezone" text DEFAULT 'Europe/Moscow' NOT NULL,
    "currency" text DEFAULT 'RUB' NOT NULL,
    "language" text DEFAULT 'ru' NOT NULL,
    "plan" text DEFAULT 'trial' NOT NULL,
    "status" text DEFAULT 'trial' NOT NULL,
    "trial_ends" text,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    "owner" text NOT NULL,
    "brand_color" text DEFAULT '#2563eb' NOT NULL,
    "logo" text,
    "description" text DEFAULT '' NOT NULL,
    "industry" text DEFAULT 'cargo' NOT NULL,
    "ai_enabled" boolean DEFAULT true NOT NULL,
    "contact_email" text,
    "contact_phone" text,
    "contact_telegram" text,
    "contact_whatsapp" text,
    "website" text,
    "mrr" integer DEFAULT 0 NOT NULL,
    "users_count" integer DEFAULT 1 NOT NULL,
    "last_active_at" text,
    CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
  )`,
  `CREATE TABLE IF NOT EXISTS "tenant_settings" (
    "tenant_id" text PRIMARY KEY NOT NULL,
    "company_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "target_markets" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "kpi_targets" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "primary_color" text DEFAULT '#2563eb' NOT NULL,
    "accent_color" text DEFAULT '#7c3aed' NOT NULL,
    "font_family" text DEFAULT 'Inter' NOT NULL,
    "logo_url" text,
    "favicon_url" text,
    "welcome_message" text DEFAULT '' NOT NULL,
    "modules" jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "crm_leads" (
    "id" serial PRIMARY KEY NOT NULL,
    "lead_id" text NOT NULL,
    "tenant_id" text NOT NULL,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    "name" text DEFAULT '' NOT NULL,
    "phone" text DEFAULT '' NOT NULL,
    "telegram" text DEFAULT '' NOT NULL,
    "email" text DEFAULT '' NOT NULL,
    "company" text DEFAULT '' NOT NULL,
    "product" text DEFAULT '' NOT NULL,
    "product_link" text DEFAULT '' NOT NULL,
    "category" text DEFAULT '' NOT NULL,
    "quantity" text DEFAULT '' NOT NULL,
    "weight" text DEFAULT '' NOT NULL,
    "volume" text DEFAULT '' NOT NULL,
    "country_destination" text DEFAULT '' NOT NULL,
    "city_destination" text DEFAULT '' NOT NULL,
    "delivery_type" text DEFAULT '' NOT NULL,
    "service_type" text DEFAULT '' NOT NULL,
    "status" text DEFAULT 'NEW' NOT NULL,
    "priority" text DEFAULT 'WARM' NOT NULL,
    "estimated_value" numeric DEFAULT '0' NOT NULL,
    "manager" text DEFAULT '' NOT NULL,
    "comment" text DEFAULT '' NOT NULL,
    "source" text DEFAULT '' NOT NULL,
    "utm_source" text DEFAULT '' NOT NULL,
    "utm_campaign" text DEFAULT '' NOT NULL,
    "delivery_cost" numeric,
    "carrier_cost" numeric,
    "markup_percent" numeric,
    "profit" numeric,
    "margin_percent" numeric,
    "pricing_rule" text,
    CONSTRAINT "crm_leads_lead_id_unique" UNIQUE("lead_id"),
    CONSTRAINT "crm_leads_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "finance_orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" text NOT NULL,
    "lead_id" text DEFAULT '' NOT NULL,
    "order_id" text NOT NULL,
    "client_id" text DEFAULT '' NOT NULL,
    "client_name" text DEFAULT '' NOT NULL,
    "manager" text DEFAULT '' NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "goods_cost" numeric DEFAULT '0' NOT NULL,
    "delivery_cost" numeric DEFAULT '0' NOT NULL,
    "services_cost" numeric DEFAULT '0' NOT NULL,
    "bank_fee" numeric DEFAULT '0' NOT NULL,
    "customs_cost" numeric DEFAULT '0' NOT NULL,
    "other_expenses" numeric DEFAULT '0' NOT NULL,
    "total_cost" numeric DEFAULT '0' NOT NULL,
    "client_price" numeric DEFAULT '0' NOT NULL,
    "gross_profit" numeric DEFAULT '0' NOT NULL,
    "net_profit" numeric DEFAULT '0' NOT NULL,
    "margin_percent" numeric DEFAULT '0' NOT NULL,
    "notes" text DEFAULT '' NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    CONSTRAINT "finance_orders_order_id_unique" UNIQUE("order_id"),
    CONSTRAINT "finance_orders_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "finance_payments" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" text NOT NULL,
    "payment_id" text NOT NULL,
    "lead_id" text DEFAULT '' NOT NULL,
    "order_id" text DEFAULT '' NOT NULL,
    "finance_order_id" text DEFAULT '' NOT NULL,
    "client_name" text DEFAULT '' NOT NULL,
    "type" text DEFAULT 'prepayment' NOT NULL,
    "amount" numeric DEFAULT '0' NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "payment_date" text NOT NULL,
    "payment_method" text DEFAULT '' NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "comment" text DEFAULT '' NOT NULL,
    "created_at" text NOT NULL,
    CONSTRAINT "finance_payments_payment_id_unique" UNIQUE("payment_id"),
    CONSTRAINT "finance_payments_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "finance_expenses" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" text NOT NULL,
    "expense_id" text NOT NULL,
    "lead_id" text DEFAULT '' NOT NULL,
    "order_id" text DEFAULT '' NOT NULL,
    "finance_order_id" text DEFAULT '' NOT NULL,
    "category" text DEFAULT '' NOT NULL,
    "amount" numeric DEFAULT '0' NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "expense_date" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "receipt_url" text DEFAULT '' NOT NULL,
    "created_at" text NOT NULL,
    CONSTRAINT "finance_expenses_expense_id_unique" UNIQUE("expense_id"),
    CONSTRAINT "finance_expenses_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "finance_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" text NOT NULL,
    "key" text NOT NULL,
    "value" text DEFAULT '' NOT NULL,
    "label" text DEFAULT '' NOT NULL,
    "updated_at" text NOT NULL,
    CONSTRAINT "finance_settings_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS "cash_flow" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" text NOT NULL,
    "cashflow_id" text NOT NULL,
    "type" text DEFAULT 'income' NOT NULL,
    "category" text DEFAULT '' NOT NULL,
    "amount" numeric DEFAULT '0' NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "account" text DEFAULT 'bank' NOT NULL,
    "lead_id" text DEFAULT '' NOT NULL,
    "order_id" text DEFAULT '' NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "transaction_date" text NOT NULL,
    "created_at" text NOT NULL,
    CONSTRAINT "cash_flow_cashflow_id_unique" UNIQUE("cashflow_id"),
    CONSTRAINT "cash_flow_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
  )`,
  // Indexes
  `CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug")`,
  `CREATE INDEX IF NOT EXISTS "crm_leads_tenant_idx" ON "crm_leads" USING btree ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads" USING btree ("status")`,
  `CREATE INDEX IF NOT EXISTS "crm_leads_lead_id_idx" ON "crm_leads" USING btree ("lead_id")`,
  `CREATE INDEX IF NOT EXISTS "finance_orders_tenant_idx" ON "finance_orders" USING btree ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "finance_payments_tenant_idx" ON "finance_payments" USING btree ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "finance_expenses_tenant_idx" ON "finance_expenses" USING btree ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "finance_settings_tenant_idx" ON "finance_settings" USING btree ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "cash_flow_tenant_idx" ON "cash_flow" USING btree ("tenant_id")`,
];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const results: string[] = [];

  for (const stmt of MIGRATION_STATEMENTS) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${stmt.slice(7, 60).trim()}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`ERR: ${msg.slice(0, 80)}`);
    }
  }

  const now = new Date().toISOString();

  // Seed ChinaBridge tenant
  try {
    await sql.unsafe(`
      INSERT INTO tenants (
        id, slug, company_name, domain, subdomain, country, timezone, currency, language,
        plan, status, trial_ends, created_at, updated_at, owner, brand_color, logo, description,
        industry, ai_enabled, contact_email, contact_phone, contact_telegram, contact_whatsapp,
        website, mrr, users_count, last_active_at
      ) VALUES (
        'tenant-chinabridge', 'chinabridge', 'ChinaBridge', 'chinabridge.pro', 'chinabridge',
        'RU', 'Europe/Moscow', 'RUB', 'ru', 'enterprise', 'active', NULL,
        '2024-01-15T00:00:00.000Z', '${now}',
        'admin@chinabridge.pro', '#2563eb', NULL,
        'Логистика и ВЭД из Китая. Доставка грузов, выкуп на 1688, таможня.',
        'cargo', true, 'info@chinabridge.pro', '+7 (800) 000-00-00', '@chinabridge', NULL,
        'https://chinabridge.pro', 59900, 5, '${now}'
      ) ON CONFLICT (id) DO NOTHING
    `);
    results.push("OK: seeded tenant-chinabridge");
  } catch (err: unknown) {
    results.push(`ERR seed tenant: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const goals = JSON.stringify(["Увеличить оборот до 50 млн ₽/мес", "Расширить клиентскую базу", "Запустить White Label SaaS"]).replace(/'/g, "''");
    const markets = JSON.stringify(["Russia", "Kazakhstan", "Belarus", "Uzbekistan"]).replace(/'/g, "''");
    const kpi = JSON.stringify({ mrr: "500000", leads_per_month: "100", conversion: "15" }).replace(/'/g, "''");
    const modules = JSON.stringify({ sales: true, marketing: true, content: true, analytics: true, operations: true, finance: true, strategy: true, ceo: true, crm: true, calculator: true, clientCabinet: true, partnerCabinet: true }).replace(/'/g, "''");
    await sql.unsafe(`
      INSERT INTO tenant_settings (
        tenant_id, company_goals, target_markets, kpi_targets,
        primary_color, accent_color, font_family, logo_url, favicon_url,
        welcome_message, modules
      ) VALUES (
        'tenant-chinabridge',
        '${goals}'::jsonb, '${markets}'::jsonb, '${kpi}'::jsonb,
        '#2563eb', '#7c3aed', 'Inter', NULL, NULL,
        'Добро пожаловать в ChinaBridge — ваш надёжный партнёр по логистике из Китая',
        '${modules}'::jsonb
      ) ON CONFLICT (tenant_id) DO NOTHING
    `);
    results.push("OK: seeded tenant_settings");
  } catch (err: unknown) {
    results.push(`ERR seed settings: ${err instanceof Error ? err.message : String(err)}`);
  }

  const errors = results.filter((r) => r.startsWith("ERR"));
  return NextResponse.json({
    success: errors.length === 0,
    total: results.length,
    errors: errors.length,
    results,
  });
}
