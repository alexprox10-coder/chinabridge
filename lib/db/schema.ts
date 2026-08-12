import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

// ─── Tenants ──────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id:               text("id").primaryKey(),
  slug:             text("slug").notNull().unique(),
  companyName:      text("company_name").notNull(),
  domain:           text("domain"),
  subdomain:        text("subdomain").notNull(),
  country:          text("country").notNull().default("RU"),
  timezone:         text("timezone").notNull().default("Europe/Moscow"),
  currency:         text("currency").notNull().default("RUB"),
  language:         text("language").notNull().default("ru"),
  plan:             text("plan").notNull().default("trial"),
  status:           text("status").notNull().default("trial"),
  trialEnds:        text("trial_ends"),
  createdAt:        text("created_at").notNull(),
  updatedAt:        text("updated_at").notNull(),
  owner:            text("owner").notNull(),
  brandColor:       text("brand_color").notNull().default("#2563eb"),
  logo:             text("logo"),
  description:      text("description").notNull().default(""),
  industry:         text("industry").notNull().default("cargo"),
  aiEnabled:        boolean("ai_enabled").notNull().default(true),
  contactEmail:     text("contact_email"),
  contactPhone:     text("contact_phone"),
  contactTelegram:  text("contact_telegram"),
  contactWhatsapp:  text("contact_whatsapp"),
  website:          text("website"),
  mrr:              integer("mrr").notNull().default(0),
  usersCount:       integer("users_count").notNull().default(1),
  lastActiveAt:     text("last_active_at"),
  pinHash:          text("pin_hash"),
}, (t) => [index("tenants_slug_idx").on(t.slug)]);

// ─── Tenant Settings ──────────────────────────────────────────────────────────

export const tenantSettings = pgTable("tenant_settings", {
  tenantId:       text("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  companyGoals:   jsonb("company_goals").notNull().default([]),
  targetMarkets:  jsonb("target_markets").notNull().default([]),
  kpiTargets:     jsonb("kpi_targets").notNull().default({}),
  primaryColor:   text("primary_color").notNull().default("#2563eb"),
  accentColor:    text("accent_color").notNull().default("#7c3aed"),
  fontFamily:     text("font_family").notNull().default("Inter"),
  logoUrl:        text("logo_url"),
  faviconUrl:     text("favicon_url"),
  welcomeMessage: text("welcome_message").notNull().default(""),
  modules:        jsonb("modules").notNull().default({}),
});

// ─── CRM Leads ────────────────────────────────────────────────────────────────

export const crmLeads = pgTable("crm_leads", {
  id:                 serial("id").primaryKey(),
  leadId:             text("lead_id").notNull().unique(),
  tenantId:           text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt:          text("created_at").notNull(),
  updatedAt:          text("updated_at").notNull(),
  // Client
  name:               text("name").notNull().default(""),
  phone:              text("phone").notNull().default(""),
  telegram:           text("telegram").notNull().default(""),
  email:              text("email").notNull().default(""),
  company:            text("company").notNull().default(""),
  // Product
  product:            text("product").notNull().default(""),
  productLink:        text("product_link").notNull().default(""),
  category:           text("category").notNull().default(""),
  quantity:           text("quantity").notNull().default(""),
  weight:             text("weight").notNull().default(""),
  volume:             text("volume").notNull().default(""),
  // Logistics
  countryDestination: text("country_destination").notNull().default(""),
  cityDestination:    text("city_destination").notNull().default(""),
  deliveryType:       text("delivery_type").notNull().default(""),
  serviceType:        text("service_type").notNull().default(""),
  // Sales
  status:             text("status").notNull().default("NEW"),
  priority:           text("priority").notNull().default("WARM"),
  estimatedValue:     numeric("estimated_value").notNull().default("0"),
  manager:            text("manager").notNull().default(""),
  comment:            text("comment").notNull().default(""),
  // Source
  source:             text("source").notNull().default(""),
  utmSource:          text("utm_source").notNull().default(""),
  utmCampaign:        text("utm_campaign").notNull().default(""),
  // Cost Engine
  deliveryCost:       numeric("delivery_cost"),
  carrierCost:        numeric("carrier_cost"),
  markupPercent:      numeric("markup_percent"),
  profit:             numeric("profit"),
  marginPercent:      numeric("margin_percent"),
  pricingRule:        text("pricing_rule"),
}, (t) => [
  index("crm_leads_tenant_idx").on(t.tenantId),
  index("crm_leads_status_idx").on(t.status),
  index("crm_leads_lead_id_idx").on(t.leadId),
]);

// ─── Finance Orders ───────────────────────────────────────────────────────────

export const financeOrders = pgTable("finance_orders", {
  id:             serial("id").primaryKey(),
  tenantId:       text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  leadId:         text("lead_id").notNull().default(""),
  orderId:        text("order_id").notNull().unique(),
  clientId:       text("client_id").notNull().default(""),
  clientName:     text("client_name").notNull().default(""),
  manager:        text("manager").notNull().default(""),
  currency:       text("currency").notNull().default("USD"),
  goodsCost:      numeric("goods_cost").notNull().default("0"),
  deliveryCost:   numeric("delivery_cost").notNull().default("0"),
  servicesCost:   numeric("services_cost").notNull().default("0"),
  bankFee:        numeric("bank_fee").notNull().default("0"),
  customsCost:    numeric("customs_cost").notNull().default("0"),
  otherExpenses:  numeric("other_expenses").notNull().default("0"),
  totalCost:      numeric("total_cost").notNull().default("0"),
  clientPrice:    numeric("client_price").notNull().default("0"),
  grossProfit:    numeric("gross_profit").notNull().default("0"),
  netProfit:      numeric("net_profit").notNull().default("0"),
  marginPercent:  numeric("margin_percent").notNull().default("0"),
  notes:          text("notes").notNull().default(""),
  status:         text("status").notNull().default("active"),
  createdAt:      text("created_at").notNull(),
  updatedAt:      text("updated_at").notNull(),
}, (t) => [index("finance_orders_tenant_idx").on(t.tenantId)]);

// ─── Finance Payments ─────────────────────────────────────────────────────────

export const financePayments = pgTable("finance_payments", {
  id:              serial("id").primaryKey(),
  tenantId:        text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  paymentId:       text("payment_id").notNull().unique(),
  leadId:          text("lead_id").notNull().default(""),
  orderId:         text("order_id").notNull().default(""),
  financeOrderId:  text("finance_order_id").notNull().default(""),
  clientName:      text("client_name").notNull().default(""),
  type:            text("type").notNull().default("prepayment"),
  amount:          numeric("amount").notNull().default("0"),
  currency:        text("currency").notNull().default("USD"),
  paymentDate:     text("payment_date").notNull(),
  paymentMethod:   text("payment_method").notNull().default(""),
  status:          text("status").notNull().default("pending"),
  comment:         text("comment").notNull().default(""),
  createdAt:       text("created_at").notNull(),
}, (t) => [index("finance_payments_tenant_idx").on(t.tenantId)]);

// ─── Finance Expenses ─────────────────────────────────────────────────────────

export const financeExpenses = pgTable("finance_expenses", {
  id:             serial("id").primaryKey(),
  tenantId:       text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  expenseId:      text("expense_id").notNull().unique(),
  leadId:         text("lead_id").notNull().default(""),
  orderId:        text("order_id").notNull().default(""),
  financeOrderId: text("finance_order_id").notNull().default(""),
  category:       text("category").notNull().default(""),
  amount:         numeric("amount").notNull().default("0"),
  currency:       text("currency").notNull().default("USD"),
  expenseDate:    text("expense_date").notNull(),
  description:    text("description").notNull().default(""),
  receiptUrl:     text("receipt_url").notNull().default(""),
  createdAt:      text("created_at").notNull(),
}, (t) => [index("finance_expenses_tenant_idx").on(t.tenantId)]);

// ─── Finance Settings ─────────────────────────────────────────────────────────

export const financeSettings = pgTable("finance_settings", {
  id:        serial("id").primaryKey(),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key:       text("key").notNull(),
  value:     text("value").notNull().default(""),
  label:     text("label").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
}, (t) => [index("finance_settings_tenant_idx").on(t.tenantId)]);

// ─── Product Analyses ─────────────────────────────────────────────────────────

export const productAnalyses = pgTable("product_analyses", {
  id:              serial("id").primaryKey(),
  analysisId:      text("analysis_id").notNull().unique(),
  tenantId:        text("tenant_id").notNull().default("tenant-chinabridge"),
  leadId:          text("lead_id").notNull().default(""),
  sourceUrl:       text("source_url").notNull().default(""),
  sourcePlatform:  text("source_platform").notNull().default(""),
  productName:     text("product_name").notNull().default(""),
  productData:     jsonb("product_data").notNull().default({}),
  marketplace:     text("marketplace").notNull().default(""),
  cityDestination: text("city_destination").notNull().default(""),
  quantity:        integer("quantity").notNull().default(1),
  unitPriceCny:    numeric("unit_price_cny").notNull().default("0"),
  salePriceRub:    numeric("sale_price_rub").notNull().default("0"),
  marginPct:       numeric("margin_pct").notNull().default("0"),
  roiPct:          numeric("roi_pct").notNull().default("0"),
  netProfitRub:    numeric("net_profit_rub").notNull().default("0"),
  productScore:    numeric("product_score").notNull().default("0"),
  verdict:         text("verdict").notNull().default(""),
  tariffVersion:   text("tariff_version").notNull().default(""),
  cnyRate:         numeric("cny_rate").notNull().default("0"),
  createdAt:       text("created_at").notNull(),
}, (t) => [index("product_analyses_tenant_idx").on(t.tenantId)]);

// ─── Marketplace Rates ────────────────────────────────────────────────────────
// Хранит актуальные тарифы — обновляются через admin без деплоя

export const marketplaceRates = pgTable("marketplace_rates", {
  id:                 serial("id").primaryKey(),
  marketplace:        text("marketplace").notNull(),
  country:            text("country").notNull().default("RU"),
  category:           text("category").notNull().default("general"),
  commissionPct:      numeric("commission_pct").notNull(),
  logisticsBaseRub:   numeric("logistics_base_rub").notNull().default("0"),
  logisticsPerKgRub:  numeric("logistics_per_kg_rub").notNull().default("0"),
  lastMilePct:        numeric("last_mile_pct").notNull().default("0"),
  lastMileMaxRub:     numeric("last_mile_max_rub").notNull().default("0"),
  effectiveFrom:      text("effective_from").notNull(),
  effectiveTo:        text("effective_to"),
  source:             text("source").notNull().default(""),
  version:            text("version").notNull().default("1"),
  status:             text("status").notNull().default("active"),
}, (t) => [index("marketplace_rates_mp_idx").on(t.marketplace)]);

// ─── Tax Rates ────────────────────────────────────────────────────────────────

export const taxRates = pgTable("tax_rates", {
  id:            serial("id").primaryKey(),
  country:       text("country").notNull(),
  taxRegime:     text("tax_regime").notNull(),
  label:         text("label").notNull().default(""),
  rate:          numeric("rate").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo:   text("effective_to"),
  version:       text("version").notNull().default("1"),
  status:        text("status").notNull().default("active"),
});

// ─── Cash Flow ────────────────────────────────────────────────────────────────

export const cashFlow = pgTable("cash_flow", {
  id:              serial("id").primaryKey(),
  tenantId:        text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  cashflowId:      text("cashflow_id").notNull().unique(),
  type:            text("type").notNull().default("income"),
  category:        text("category").notNull().default(""),
  amount:          numeric("amount").notNull().default("0"),
  currency:        text("currency").notNull().default("USD"),
  account:         text("account").notNull().default("bank"),
  leadId:          text("lead_id").notNull().default(""),
  orderId:         text("order_id").notNull().default(""),
  description:     text("description").notNull().default(""),
  transactionDate: text("transaction_date").notNull(),
  createdAt:       text("created_at").notNull(),
}, (t) => [index("cash_flow_tenant_idx").on(t.tenantId)]);
