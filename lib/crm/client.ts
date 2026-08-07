import { getDb } from "../db";
import { crmLeads, tenants } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { CRMLead, LeadUpdate } from "./types";

const OWNER_TENANT_ID = "tenant-chinabridge";

// Bootstrap owner tenant + required tables via raw SQL (no Drizzle schema drift risk)
let ownerTenantReady = false;
async function ensureOwnerTenant(): Promise<void> {
  if (ownerTenantReady) return;
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const now = new Date().toISOString();

    await sql`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" text PRIMARY KEY NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "company_name" text NOT NULL,
        "domain" text,
        "subdomain" text NOT NULL DEFAULT '',
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
        "last_active_at" text
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "crm_leads" (
        "id" serial PRIMARY KEY NOT NULL,
        "lead_id" text NOT NULL UNIQUE,
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
        "pricing_rule" text
      )
    `;

    await sql`
      INSERT INTO "tenants" (
        id, slug, company_name, domain, subdomain, country, timezone, currency, language,
        plan, status, created_at, updated_at, owner, brand_color, description, industry, ai_enabled,
        mrr, users_count
      ) VALUES (
        ${OWNER_TENANT_ID}, 'chinabridge', 'ChinaBridge', 'chinabridge.pro', 'chinabridge',
        'RU', 'Europe/Moscow', 'RUB', 'ru', 'enterprise', 'active',
        '2024-01-15T00:00:00.000Z', ${now},
        'admin@chinabridge.pro', '#2563eb', 'Логистика и ВЭД из Китая', 'cargo', true,
        0, 1
      )
      ON CONFLICT (id) DO NOTHING
    `;

    ownerTenantReady = true; // Set AFTER success so retries work on failure
  } catch (e) {
    console.error("[CRM] ensureOwnerTenant failed:", e);
  }
}

async function resolveTenantId(override?: string): Promise<string> {
  if (override) return override;
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    if (store.get("cb_admin")?.value) return OWNER_TENANT_ID;
    return store.get("cb_tenant_id")?.value || OWNER_TENANT_ID;
  } catch {
    return OWNER_TENANT_ID;
  }
}

// ─── Row → Domain mapper ──────────────────────────────────────────────────────

function rowToLead(r: typeof crmLeads.$inferSelect): CRMLead {
  return {
    id:                 r.id,
    lead_id:            r.leadId,
    created_at:         r.createdAt,
    updated_at:         r.updatedAt,
    name:               r.name,
    phone:              r.phone,
    telegram:           r.telegram,
    email:              r.email,
    company:            r.company,
    product:            r.product,
    product_link:       r.productLink,
    category:           r.category,
    quantity:           r.quantity,
    weight:             r.weight,
    volume:             r.volume,
    country_destination: r.countryDestination,
    city_destination:   r.cityDestination,
    delivery_type:      r.deliveryType,
    service_type:       r.serviceType,
    status:             r.status as CRMLead["status"],
    priority:           r.priority as CRMLead["priority"],
    estimated_value:    Number(r.estimatedValue),
    manager:            r.manager,
    comment:            r.comment,
    source:             r.source,
    utm_source:         r.utmSource,
    utm_campaign:       r.utmCampaign,
    delivery_cost:      r.deliveryCost != null ? Number(r.deliveryCost) : undefined,
    carrier_cost:       r.carrierCost != null ? Number(r.carrierCost) : undefined,
    markup_percent:     r.markupPercent != null ? Number(r.markupPercent) : undefined,
    profit:             r.profit != null ? Number(r.profit) : undefined,
    margin_percent:     r.marginPercent != null ? Number(r.marginPercent) : undefined,
    pricing_rule:       r.pricingRule ?? undefined,
  };
}

// ─── Filter type ──────────────────────────────────────────────────────────────

export type LeadFilters = {
  status?: string;
  priority?: string;
  search?: string;
  lead_id?: string;
  tenantId?: string;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLeads(filters: LeadFilters = {}): Promise<CRMLead[]> {
  const tenantId = await resolveTenantId(filters.tenantId);
  const db = getDb();
  const conditions = [eq(crmLeads.tenantId, tenantId)];

  if (filters.status)   conditions.push(eq(crmLeads.status, filters.status));
  if (filters.priority) conditions.push(eq(crmLeads.priority, filters.priority));
  if (filters.lead_id)  conditions.push(eq(crmLeads.leadId, filters.lead_id));

  const rows = await db
    .select()
    .from(crmLeads)
    .where(and(...conditions))
    .orderBy(desc(crmLeads.createdAt));

  return rows.map(rowToLead);
}

export async function getLeadByLeadId(leadId: string, tenantIdOverride?: string): Promise<CRMLead | null> {
  const tenantId = await resolveTenantId(tenantIdOverride);
  const db = getDb();
  const rows = await db
    .select()
    .from(crmLeads)
    .where(and(eq(crmLeads.tenantId, tenantId), eq(crmLeads.leadId, leadId)));
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function getLead(id: number, tenantIdOverride?: string): Promise<CRMLead | null> {
  const tenantId = await resolveTenantId(tenantIdOverride);
  const db = getDb();
  const rows = await db
    .select()
    .from(crmLeads)
    .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, tenantId)));
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function createLead(data: Omit<CRMLead, "id">, tenantIdOverride?: string): Promise<CRMLead> {
  const tenantId = await resolveTenantId(tenantIdOverride);
  if (tenantId === OWNER_TENANT_ID) await ensureOwnerTenant();
  const db = getDb();
  const now = new Date().toISOString();
  const [row] = await db.insert(crmLeads).values({
    leadId:             data.lead_id || `lead-${Date.now()}`,
    tenantId,
    createdAt:          data.created_at || now,
    updatedAt:          data.updated_at || now,
    name:               data.name,
    phone:              data.phone,
    telegram:           data.telegram,
    email:              data.email,
    company:            data.company,
    product:            data.product,
    productLink:        data.product_link,
    category:           data.category,
    quantity:           data.quantity,
    weight:             data.weight,
    volume:             data.volume,
    countryDestination: data.country_destination,
    cityDestination:    data.city_destination,
    deliveryType:       data.delivery_type,
    serviceType:        data.service_type,
    status:             data.status,
    priority:           data.priority,
    estimatedValue:     String(data.estimated_value ?? 0),
    manager:            data.manager,
    comment:            data.comment,
    source:             data.source,
    utmSource:          data.utm_source,
    utmCampaign:        data.utm_campaign,
    deliveryCost:       data.delivery_cost != null ? String(data.delivery_cost) : null,
    carrierCost:        data.carrier_cost != null ? String(data.carrier_cost) : null,
    markupPercent:      data.markup_percent != null ? String(data.markup_percent) : null,
    profit:             data.profit != null ? String(data.profit) : null,
    marginPercent:      data.margin_percent != null ? String(data.margin_percent) : null,
    pricingRule:        data.pricing_rule ?? null,
  }).onConflictDoNothing().returning();
  if (!row) {
    const existing = await db.select().from(crmLeads)
      .where(eq(crmLeads.leadId, data.lead_id || ""))
      .limit(1);
    if (existing[0]) return rowToLead(existing[0]);
    throw new Error(`Lead insert returned no row and no existing record found for lead_id="${data.lead_id}"`);
  }
  return rowToLead(row);
}

export async function updateLead(id: number, update: LeadUpdate, tenantIdOverride?: string): Promise<boolean> {
  try {
    const tenantId = await resolveTenantId(tenantIdOverride);
    const db = getDb();
    await db
      .update(crmLeads)
      .set({
        ...(update.status    !== undefined && { status:         update.status }),
        ...(update.priority  !== undefined && { priority:       update.priority }),
        ...(update.manager   !== undefined && { manager:        update.manager }),
        ...(update.comment   !== undefined && { comment:        update.comment }),
        ...(update.estimated_value !== undefined && { estimatedValue: String(update.estimated_value) }),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, tenantId)));
    return true;
  } catch {
    return false;
  }
}

export async function deleteLead(id: number, tenantIdOverride?: string): Promise<boolean> {
  try {
    const tenantId = await resolveTenantId(tenantIdOverride);
    const db = getDb();
    await db
      .delete(crmLeads)
      .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, tenantId)));
    return true;
  } catch {
    return false;
  }
}

export async function getDashboardStats(tenantIdOverride?: string) {
  const leads = await getLeads({ tenantId: tenantIdOverride });
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const d3  = 3  * h24;
  const d7  = 7  * h24;

  const todayLeads    = leads.filter((l) => (l.created_at ?? "").startsWith(today));
  const successLeads  = leads.filter((l) => l.status === "SUCCESS");
  const openLeads     = leads.filter((l) => !["SUCCESS", "LOST"].includes(l.status ?? ""));

  const totalRevenue   = successLeads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const potentialValue = openLeads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const conversion     = leads.length > 0 ? Math.round((successLeads.length / leads.length) * 100) : 0;

  const msAgo      = (iso: string) => now - new Date(iso || 0).getTime();
  const newLeads   = leads.filter((l) => l.status === "NEW");
  const unanswered = newLeads.filter((l) => msAgo(l.created_at) > h24);
  const stale3d    = openLeads.filter((l) => msAgo(l.updated_at || l.created_at) > d3);
  const sleeping   = openLeads.filter((l) => msAgo(l.updated_at || l.created_at) > d7);

  return {
    total: leads.length,
    today: todayLeads.length,
    today_new:          todayLeads.filter((l) => l.status === "NEW").length,
    today_unanswered:   unanswered.length,
    today_calculations: leads.filter((l) => l.status === "CALCULATION").length,
    today_proposals:    leads.filter((l) => l.status === "OFFER_SENT").length,
    today_paid:         leads.filter((l) => l.status === "PAYMENT").length,
    today_completed:    leads.filter((l) => l.status === "SUCCESS").length,
    hot:                leads.filter((l) => l.priority === "HOT").length,
    open:               openLeads.length,
    closed_success:     successLeads.length,
    closed_lost:        leads.filter((l) => l.status === "LOST").length,
    potential_value:    potentialValue,
    total_revenue:      totalRevenue,
    conversion,
    unanswered_count:   unanswered.length,
    stale3d_count:      stale3d.length,
    sleeping_count:     sleeping.length,
    by_status: Object.fromEntries(
      ["NEW","CONTACTED","QUALIFICATION","CALCULATION","OFFER_SENT","NEGOTIATION","PAYMENT","DELIVERY","SUCCESS","LOST"]
        .map((s) => [s, leads.filter((l) => l.status === s).length])
    ) as Record<string, number>,
  };
}
