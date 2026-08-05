CREATE TABLE "cash_flow" (
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
	CONSTRAINT "cash_flow_cashflow_id_unique" UNIQUE("cashflow_id")
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
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
	CONSTRAINT "crm_leads_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "finance_expenses" (
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
	CONSTRAINT "finance_expenses_expense_id_unique" UNIQUE("expense_id")
);
--> statement-breakpoint
CREATE TABLE "finance_orders" (
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
	CONSTRAINT "finance_orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "finance_payments" (
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
	CONSTRAINT "finance_payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "finance_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
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
	"modules" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
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
);
--> statement-breakpoint
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_orders" ADD CONSTRAINT "finance_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_flow_tenant_idx" ON "cash_flow" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "crm_leads_tenant_idx" ON "crm_leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "crm_leads_status_idx" ON "crm_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_leads_lead_id_idx" ON "crm_leads" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "finance_expenses_tenant_idx" ON "finance_expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "finance_orders_tenant_idx" ON "finance_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "finance_payments_tenant_idx" ON "finance_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "finance_settings_tenant_idx" ON "finance_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");