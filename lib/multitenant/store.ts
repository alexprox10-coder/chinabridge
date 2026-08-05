import type { Tenant, TenantSettings, PlatformMetrics, BillingPlan, TenantCountry, Currency } from "./types";

// ─── Seed data: ChinaBridge = Tenant #1 ───────────────────────────────────────

const SEED_TENANTS: Tenant[] = [
  {
    id: "tenant-chinabridge",
    slug: "chinabridge",
    companyName: "ChinaBridge",
    domain: "chinabridge.pro",
    subdomain: "chinabridge",
    country: "RU",
    timezone: "Europe/Moscow",
    currency: "RUB",
    language: "ru",
    plan: "enterprise",
    status: "active",
    trialEnds: null,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    owner: "admin@chinabridge.pro",
    brandColor: "#2563eb",
    logo: null,
    description: "Логистика и ВЭД из Китая. Доставка грузов, выкуп на 1688, таможня.",
    industry: "cargo",
    aiEnabled: true,
    contactEmail: "info@chinabridge.pro",
    contactPhone: "+7 (800) 000-00-00",
    contactTelegram: "@chinabridge",
    contactWhatsapp: null,
    website: "https://chinabridge.pro",
    mrr: 59900,
    usersCount: 5,
    lastActiveAt: new Date().toISOString(),
  },
];

const SEED_SETTINGS: TenantSettings = {
  tenantId: "tenant-chinabridge",
  companyGoals: [
    "Увеличить оборот до 50 млн ₽/мес",
    "Расширить клиентскую базу до 500 компаний",
    "Запустить White Label SaaS для других карго",
  ],
  targetMarkets: ["Russia", "Kazakhstan", "Belarus", "Uzbekistan"],
  kpiTargets: {
    mrr: "500000",
    leads_per_month: "100",
    conversion: "15",
    client_count: "200",
  },
  primaryColor: "#2563eb",
  accentColor: "#7c3aed",
  fontFamily: "Inter",
  logoUrl: null,
  faviconUrl: null,
  welcomeMessage: "Добро пожаловать в ChinaBridge — ваш надёжный партнёр по логистике из Китая",
  modules: {
    sales: true,
    marketing: true,
    content: true,
    analytics: true,
    operations: true,
    finance: true,
    strategy: true,
    ceo: true,
    crm: true,
    calculator: true,
    clientCabinet: true,
    partnerCabinet: true,
  },
};

// ─── In-memory store (runtime cache) ──────────────────────────────────────────

let _tenants: Tenant[] = [...SEED_TENANTS];
let _settings: TenantSettings[] = [SEED_SETTINGS];

// ─── n8n-backed persistence (optional) ────────────────────────────────────────

async function loadFromN8n(): Promise<Tenant[] | null> {
  const tableId = process.env.N8N_TENANTS_TABLE_ID;
  const baseUrl = process.env.N8N_BASE_URL;
  if (!tableId || !baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/webhook/data-tables/${tableId}/rows`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows: Tenant[] = (data.rows ?? data ?? []).map((r: Record<string, unknown>) => ({
      id:             String(r.id ?? ""),
      slug:           String(r.slug ?? ""),
      companyName:    String(r.company_name ?? r.companyName ?? ""),
      domain:         r.domain ? String(r.domain) : null,
      subdomain:      String(r.subdomain ?? r.slug ?? ""),
      country:        (r.country as TenantCountry) ?? "RU",
      timezone:       String(r.timezone ?? "Europe/Moscow"),
      currency:       (r.currency as Currency) ?? "RUB",
      language:       (r.language as "ru" | "en") ?? "ru",
      plan:           (r.plan as BillingPlan) ?? "trial",
      status:         (r.status as Tenant["status"]) ?? "trial",
      trialEnds:      r.trial_ends ? String(r.trial_ends) : null,
      createdAt:      String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
      updatedAt:      String(r.updated_at ?? r.updatedAt ?? new Date().toISOString()),
      owner:          String(r.owner ?? ""),
      brandColor:     String(r.brand_color ?? "#2563eb"),
      logo:           r.logo ? String(r.logo) : null,
      description:    String(r.description ?? ""),
      industry:       (r.industry as Tenant["industry"]) ?? "cargo",
      aiEnabled:      Boolean(r.ai_enabled ?? true),
      contactEmail:   r.contact_email ? String(r.contact_email) : null,
      contactPhone:   r.contact_phone ? String(r.contact_phone) : null,
      contactTelegram:r.contact_telegram ? String(r.contact_telegram) : null,
      contactWhatsapp:r.contact_whatsapp ? String(r.contact_whatsapp) : null,
      website:        r.website ? String(r.website) : null,
      mrr:            Number(r.mrr ?? 0),
      usersCount:     Number(r.users_count ?? 1),
      lastActiveAt:   r.last_active_at ? String(r.last_active_at) : null,
    }));
    // Ensure chinabridge seed is always present
    const hasSeed = rows.some(r => r.slug === "chinabridge");
    return hasSeed ? rows : [SEED_TENANTS[0], ...rows];
  } catch {
    return null;
  }
}

async function saveToN8n(tenant: Tenant): Promise<boolean> {
  const tableId = process.env.N8N_TENANTS_TABLE_ID;
  const baseUrl = process.env.N8N_BASE_URL;
  if (!tableId || !baseUrl) return false;
  try {
    const row = {
      id: tenant.id,
      slug: tenant.slug,
      company_name: tenant.companyName,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      country: tenant.country,
      timezone: tenant.timezone,
      currency: tenant.currency,
      language: tenant.language,
      plan: tenant.plan,
      status: tenant.status,
      trial_ends: tenant.trialEnds,
      created_at: tenant.createdAt,
      updated_at: tenant.updatedAt,
      owner: tenant.owner,
      brand_color: tenant.brandColor,
      logo: tenant.logo,
      description: tenant.description,
      industry: tenant.industry,
      ai_enabled: tenant.aiEnabled,
      contact_email: tenant.contactEmail,
      contact_phone: tenant.contactPhone,
      contact_telegram: tenant.contactTelegram,
      contact_whatsapp: tenant.contactWhatsapp,
      website: tenant.website,
      mrr: tenant.mrr,
      users_count: tenant.usersCount,
      last_active_at: tenant.lastActiveAt,
    };
    await fetch(`${baseUrl}/webhook/data-tables/${tableId}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row }),
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function getAllTenants(): Promise<Tenant[]> {
  const n8nData = await loadFromN8n();
  if (n8nData) _tenants = n8nData;
  return _tenants;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const all = await getAllTenants();
  return all.find(t => t.id === id) ?? null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const all = await getAllTenants();
  return all.find(t => t.slug === slug) ?? null;
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const all = await getAllTenants();
  return all.find(t => t.domain === domain || t.subdomain === domain.split(".")[0]) ?? null;
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
  const now = new Date().toISOString();
  const trialDays = data.plan === "trial" ? 14 : null;
  const trialEnds = trialDays
    ? new Date(Date.now() + trialDays * 86400000).toISOString()
    : null;

  const tenant: Tenant = {
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
    mrr: data.plan === "trial" ? 0 : 0,
    usersCount: 1,
    lastActiveAt: now,
  };

  _tenants = [..._tenants, tenant];
  await saveToN8n(tenant);

  // Create default settings
  const settings: TenantSettings = {
    tenantId: tenant.id,
    companyGoals: [`Запустить CRM-систему`, `Автоматизировать продажи`, `Подключить AI-отделы`],
    targetMarkets: [data.country],
    kpiTargets: { mrr: "0", leads_per_month: "50", conversion: "10" },
    primaryColor: data.brandColor,
    accentColor: "#7c3aed",
    fontFamily: "Inter",
    logoUrl: null,
    faviconUrl: null,
    welcomeMessage: `Добро пожаловать в ${data.companyName}`,
    modules: {
      sales: true,
      marketing: data.plan !== "trial",
      content: data.plan !== "trial",
      analytics: true,
      operations: data.plan !== "trial",
      finance: data.plan !== "trial",
      strategy: data.plan === "pro" || data.plan === "enterprise",
      ceo: data.plan === "pro" || data.plan === "enterprise",
      crm: true,
      calculator: true,
      clientCabinet: data.plan !== "trial",
      partnerCabinet: data.plan === "enterprise",
    },
  };
  _settings = [..._settings.filter(s => s.tenantId !== tenant.id), settings];

  return tenant;
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  const idx = _tenants.findIndex(t => t.id === id);
  if (idx < 0) return null;
  const updated = { ..._tenants[idx], ...patch, updatedAt: new Date().toISOString() };
  _tenants = [..._tenants.slice(0, idx), updated, ..._tenants.slice(idx + 1)];
  await saveToN8n(updated);
  return updated;
}

export function getTenantSettings(tenantId: string): TenantSettings {
  return _settings.find(s => s.tenantId === tenantId) ?? SEED_SETTINGS;
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
