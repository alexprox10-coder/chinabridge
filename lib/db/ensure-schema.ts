import { neon } from "@neondatabase/serverless";

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;
  initialized = true;

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS "tenants" (
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "tenant_settings" (
      "tenant_id" text PRIMARY KEY NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "company_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "target_markets" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "kpi_targets" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "primary_color" text DEFAULT '#2563eb' NOT NULL,
      "accent_color" text DEFAULT '#7c3aed' NOT NULL,
      "font_family" text DEFAULT 'Inter' NOT NULL,
      "logo_url" text,
      "favicon_url" text,
      "welcome_message" text DEFAULT '' NOT NULL,
      "modules" jsonb DEFAULT '{}'::jsonb NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "crm_leads" (
      "id" serial PRIMARY KEY NOT NULL,
      "lead_id" text NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
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
      CONSTRAINT "crm_leads_lead_id_unique" UNIQUE("lead_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "finance_orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
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
      CONSTRAINT "finance_orders_order_id_unique" UNIQUE("order_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "finance_payments" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
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
      CONSTRAINT "finance_payments_payment_id_unique" UNIQUE("payment_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "finance_expenses" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
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
      CONSTRAINT "finance_expenses_expense_id_unique" UNIQUE("expense_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "finance_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "key" text NOT NULL,
      "value" text DEFAULT '' NOT NULL,
      "label" text DEFAULT '' NOT NULL,
      "updated_at" text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "cash_flow" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
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
      CONSTRAINT "cash_flow_cashflow_id_unique" UNIQUE("cashflow_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_analyses" (
      "id" serial PRIMARY KEY NOT NULL,
      "analysis_id" text NOT NULL,
      "tenant_id" text DEFAULT 'tenant-chinabridge' NOT NULL,
      "lead_id" text DEFAULT '' NOT NULL,
      "source_url" text DEFAULT '' NOT NULL,
      "source_platform" text DEFAULT '' NOT NULL,
      "product_name" text DEFAULT '' NOT NULL,
      "product_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "marketplace" text DEFAULT '' NOT NULL,
      "city_destination" text DEFAULT '' NOT NULL,
      "quantity" integer DEFAULT 1 NOT NULL,
      "unit_price_cny" numeric DEFAULT '0' NOT NULL,
      "sale_price_rub" numeric DEFAULT '0' NOT NULL,
      "margin_pct" numeric DEFAULT '0' NOT NULL,
      "roi_pct" numeric DEFAULT '0' NOT NULL,
      "net_profit_rub" numeric DEFAULT '0' NOT NULL,
      "product_score" numeric DEFAULT '0' NOT NULL,
      "verdict" text DEFAULT '' NOT NULL,
      "tariff_version" text DEFAULT '' NOT NULL,
      "cny_rate" numeric DEFAULT '0' NOT NULL,
      "created_at" text NOT NULL,
      CONSTRAINT "product_analyses_analysis_id_unique" UNIQUE("analysis_id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "marketplace_rates" (
      "id" serial PRIMARY KEY NOT NULL,
      "marketplace" text NOT NULL,
      "country" text DEFAULT 'RU' NOT NULL,
      "category" text DEFAULT 'general' NOT NULL,
      "commission_pct" numeric NOT NULL,
      "logistics_base_rub" numeric DEFAULT '0' NOT NULL,
      "logistics_per_kg_rub" numeric DEFAULT '0' NOT NULL,
      "last_mile_pct" numeric DEFAULT '0' NOT NULL,
      "last_mile_max_rub" numeric DEFAULT '0' NOT NULL,
      "effective_from" text NOT NULL,
      "effective_to" text,
      "source" text DEFAULT '' NOT NULL,
      "version" text DEFAULT '1' NOT NULL,
      "status" text DEFAULT 'active' NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "tax_rates" (
      "id" serial PRIMARY KEY NOT NULL,
      "country" text NOT NULL,
      "tax_regime" text NOT NULL,
      "label" text DEFAULT '' NOT NULL,
      "rate" numeric NOT NULL,
      "effective_from" text NOT NULL,
      "effective_to" text,
      "version" text DEFAULT '1' NOT NULL,
      "status" text DEFAULT 'active' NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS "product_analyses_tenant_idx" ON "product_analyses" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "marketplace_rates_mp_idx" ON "marketplace_rates" ("marketplace")`;

  await sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "pin_hash" text`;
  await sql`CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" ("slug")`;
  await sql`CREATE INDEX IF NOT EXISTS "crm_leads_tenant_idx" ON "crm_leads" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads" ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "crm_leads_lead_id_idx" ON "crm_leads" ("lead_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "finance_orders_tenant_idx" ON "finance_orders" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "finance_payments_tenant_idx" ON "finance_payments" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "finance_expenses_tenant_idx" ON "finance_expenses" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "finance_settings_tenant_idx" ON "finance_settings" ("tenant_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "cash_flow_tenant_idx" ON "cash_flow" ("tenant_id")`;
}
