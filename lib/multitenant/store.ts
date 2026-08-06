import { getDb } from "../db";
import { tenants as tenantsTable, tenantSettings as settingsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Tenant, TenantSettings, PlatformMetrics, BillingPlan, TenantCountry, Currency } from "./types";

// ─── Row → Domain mappers ─────────────────────────────────────────────────────

function rowToTenant(r: typeof tenantsTable.$inferSelect): Tenant {
  return {
    id:               r.id,
    slug:             r.slug,
    companyName:      r.companyName,
    domain:           r.domain,
    subdomain:        r.subdomain,
    country:          r.country as TenantCountry,
    timezone:         r.timezone,
    currency:         r.currency as Currency,
    language:         r.language as "ru" | "en",
    plan:             r.plan as BillingPlan,
    status:           r.status as Tenant["status"],
    trialEnds:        r.trialEnds,
    createdAt:        r.createdAt,
    updatedAt:        r.updatedAt,
    owner:            r.owner,
    brandColor:       r.brandColor,
    logo:             r.logo,
    description:      r.description,
    industry:         r.industry as Tenant["industry"],
    aiEnabled:        r.aiEnabled,
    contactEmail:     r.contactEmail,
    contactPhone:     r.contactPhone,
    contactTelegram:  r.contactTelegram,
    contactWhatsapp:  r.contactWhatsapp,
    website:          r.website,
    mrr:              r.mrr,
    usersCount:       r.usersCount,
    lastActiveAt:     r.lastActiveAt,
  };
}

function rowToSettings(r: typeof settingsTable.$inferSelect): TenantSettings {
  return {
    tenantId:       r.tenantId,
    companyGoals:   (r.companyGoals as string[]) ?? [],
    targetMarkets:  (r.targetMarkets as string[]) ?? [],
    kpiTargets:     (r.kpiTargets as Record<string, string>) ?? {},
    primaryColor:   r.primaryColor,
    accentColor:    r.accentColor,
    fontFamily:     r.fontFamily,
    logoUrl:        r.logoUrl,
    faviconUrl:     r.faviconUrl,
    welcomeMessage: r.welcomeMessage,
    modules:        (r.modules as TenantSettings["modules"]) ?? defaultModules(true),
  };
}

function defaultModules(full: boolean): TenantSettings["modules"] {
  return {
    sales: true, marketing: full, content: full, analytics: true,
    operations: full, finance: full, strategy: full, ceo: full,
    crm: true, calculator: true, clientCabinet: full, partnerCabinet: false,
  };
}

// ─── Fallback seed (when DB not yet migrated) ─────────────────────────────────

const SEED_TENANT: Tenant = {
  id: "tenant-chinabridge", slug: "chinabridge", companyName: "ChinaBridge",
  domain: "chinabridge.pro", subdomain: "chinabridge", country: "RU",
  timezone: "Europe/Moscow", currency: "RUB", language: "ru", plan: "enterprise",
  status: "active", trialEnds: null, createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: new Date().toISOString(), owner: "admin@chinabridge.pro",
  brandColor: "#2563eb", logo: null,
  description: "Логистика и ВЭД из Китая. Доставка грузов, выкуп на 1688, таможня.",
  industry: "cargo", aiEnabled: true, contactEmail: "info@chinabridge.pro",
  contactPhone: "+7 (800) 000-00-00", contactTelegram: "@chinabridge",
  contactWhatsapp: null, website: "https://chinabridge.pro",
  mrr: 59900, usersCount: 5, lastActiveAt: new Date().toISOString(),
};

const SEED_SETTINGS: TenantSettings = {
  tenantId: "tenant-chinabridge",
  companyGoals: ["Увеличить оборот до 50 млн ₽/мес", "Расширить клиентскую базу до 500 компаний", "Запустить White Label SaaS для других карго"],
  targetMarkets: ["Russia", "Kazakhstan", "Belarus", "Uzbekistan"],
  kpiTargets: { mrr: "500000", leads_per_month: "100", conversion: "15", client_count: "200" },
  primaryColor: "#2563eb", accentColor: "#7c3aed", fontFamily: "Inter",
  logoUrl: null, faviconUrl: null,
  welcomeMessage: "Добро пожаловать в ChinaBridge — ваш надёжный партнёр по логистике из Китая",
  modules: defaultModules(true),
};

// ─── Public API ────────────────────────────────────────────────────────────────

export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const db = getDb();
    const rows = await db.select().from(tenantsTable);
    if (rows.length === 0) return [SEED_TENANT];
    return rows.map(rowToTenant);
  } catch {
    return [SEED_TENANT];
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const db = getDb();
    const rows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
    return rows[0] ? rowToTenant(rows[0]) : null;
  } catch {
    return id === "tenant-chinabridge" ? SEED_TENANT : null;
  }
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const db = getDb();
    const rows = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug));
    return rows[0] ? rowToTenant(rows[0]) : null;
  } catch {
    return slug === "chinabridge" ? SEED_TENANT : null;
  }
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  try {
    const db = getDb();
    const all = await db.select().from(tenantsTable);
    const match = all.find(
      (t) => t.domain === domain || t.subdomain === domain.split(".")[0]
    );
    return match ? rowToTenant(match) : null;
  } catch {
    return SEED_TENANT;
  }
}

export async function createTenant(data: {
  companyName: string;
  slug: string;
  country: TenantCountry;
  currency: Currency;
  language: "ru" | "en";
  plan: BillingPlan;
  owner: string;
  industry: Tenant["industry"];
  description: string;
  timezone: string;
  brandColor: string;
}): Promise<Tenant> {
  const db = getDb();
  const now = new Date().toISOString();
  const trialEnds = data.plan === "trial"
    ? new Date(Date.now() + 14 * 86400000).toISOString()
    : null;

  const tenant: typeof tenantsTable.$inferInsert = {
    id: `tenant-${data.slug}-${Date.now()}`,
    slug: data.slug,
    companyName: data.companyName,
    domain: null,
    subdomain: data.slug,
    country: data.country,
    timezone: data.timezone,
    currency: data.currency,
    language: data.language,
    plan: data.plan,
    status: data.plan === "trial" ? "trial" : "active",
    trialEnds,
    createdAt: now,
    updatedAt: now,
    owner: data.owner,
    brandColor: data.brandColor,
    logo: null,
    description: data.description,
    industry: data.industry,
    aiEnabled: true,
    contactEmail: data.owner,
    contactPhone: null,
    contactTelegram: null,
    contactWhatsapp: null,
    website: null,
    mrr: 0,
    usersCount: 1,
    lastActiveAt: now,
  };

  const [inserted] = await db.insert(tenantsTable).values(tenant).returning();

  const settings: typeof settingsTable.$inferInsert = {
    tenantId: inserted.id,
    companyGoals: ["Запустить CRM-систему", "Автоматизировать продажи", "Подключить AI-отделы"],
    targetMarkets: [data.country],
    kpiTargets: { mrr: "0", leads_per_month: "50", conversion: "10" },
    primaryColor: data.brandColor,
    accentColor: "#7c3aed",
    fontFamily: "Inter",
    logoUrl: null,
    faviconUrl: null,
    welcomeMessage: `Добро пожаловать в ${data.companyName}`,
    modules: defaultModules(data.plan !== "trial"),
  };
  await db.insert(settingsTable).values(settings);

  return rowToTenant(inserted);
}

export async function deleteTenant(id: string): Promise<boolean> {
  try {
    const db = getDb();
    await db.delete(settingsTable).where(eq(settingsTable.tenantId, id));
    const rows = await db.delete(tenantsTable).where(eq(tenantsTable.id, id)).returning();
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  try {
    const db = getDb();
    const [updated] = await db
      .update(tenantsTable)
      .set({
        ...(patch.companyName !== undefined && { companyName: patch.companyName }),
        ...(patch.domain !== undefined && { domain: patch.domain }),
        ...(patch.subdomain !== undefined && { subdomain: patch.subdomain }),
        ...(patch.country !== undefined && { country: patch.country }),
        ...(patch.plan !== undefined && { plan: patch.plan }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.mrr !== undefined && { mrr: patch.mrr }),
        ...(patch.brandColor !== undefined && { brandColor: patch.brandColor }),
        ...(patch.logo !== undefined && { logo: patch.logo }),
        ...(patch.contactEmail !== undefined && { contactEmail: patch.contactEmail }),
        ...(patch.contactPhone !== undefined && { contactPhone: patch.contactPhone }),
        ...(patch.contactTelegram !== undefined && { contactTelegram: patch.contactTelegram }),
        ...(patch.contactWhatsapp !== undefined && { contactWhatsapp: patch.contactWhatsapp }),
        ...(patch.website !== undefined && { website: patch.website }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tenantsTable.id, id))
      .returning();
    return updated ? rowToTenant(updated) : null;
  } catch {
    return null;
  }
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  try {
    const db = getDb();
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.tenantId, tenantId));
    return rows[0] ? rowToSettings(rows[0]) : SEED_SETTINGS;
  } catch {
    return SEED_SETTINGS;
  }
}

export function getPlatformMetrics(tenants: Tenant[]): PlatformMetrics {
  const active    = tenants.filter(t => t.status === "active");
  const trial     = tenants.filter(t => t.status === "trial");
  const paid      = tenants.filter(t => t.plan !== "trial" && t.status === "active");
  const suspended = tenants.filter(t => t.status === "suspended");
  const mrr       = tenants.reduce((s, t) => s + t.mrr, 0);

  const byCountry: Record<string, number> = {};
  const byPlan: Record<BillingPlan, number> = { trial: 0, starter: 0, pro: 0, enterprise: 0 };
  for (const t of tenants) {
    byCountry[t.country] = (byCountry[t.country] ?? 0) + 1;
    byPlan[t.plan]++;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const newThisMonth = tenants.filter(t => t.createdAt >= monthStart).length;

  return {
    totalTenants: tenants.length,
    activeTenants: active.length,
    trialTenants: trial.length,
    paidTenants: paid.length,
    suspendedTenants: suspended.length,
    mrr,
    arr: mrr * 12,
    churn: 0,
    growth: newThisMonth,
    avgLtv: paid.length > 0 ? Math.round(mrr / paid.length * 12) : 0,
    newThisMonth,
    byCountry,
    byPlan,
  };
}
