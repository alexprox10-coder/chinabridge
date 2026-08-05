import { getDb } from "../db";
import { crmLeads } from "../db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import type { CRMLead, LeadUpdate } from "./types";

const TENANT_ID = "tenant-chinabridge";

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
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLeads(filters: LeadFilters = {}): Promise<CRMLead[]> {
  const db = getDb();
  const conditions = [eq(crmLeads.tenantId, TENANT_ID)];

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

export async function getLeadByLeadId(leadId: string): Promise<CRMLead | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(crmLeads)
    .where(and(eq(crmLeads.tenantId, TENANT_ID), eq(crmLeads.leadId, leadId)));
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function getLead(id: number): Promise<CRMLead | null> {
  const db = getDb();
  const rows = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function createLead(data: Omit<CRMLead, "id">): Promise<CRMLead> {
  const db = getDb();
  const now = new Date().toISOString();
  const [row] = await db.insert(crmLeads).values({
    leadId:             data.lead_id || `lead-${Date.now()}`,
    tenantId:           TENANT_ID,
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
  }).returning();
  return rowToLead(row);
}

export async function updateLead(id: number, update: LeadUpdate): Promise<boolean> {
  try {
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
      .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, TENANT_ID)));
    return true;
  } catch {
    return false;
  }
}

export async function deleteLead(id: number): Promise<boolean> {
  try {
    const db = getDb();
    await db
      .delete(crmLeads)
      .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, TENANT_ID)));
    return true;
  } catch {
    return false;
  }
}

export async function getDashboardStats() {
  const leads = await getLeads();
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
