export type BillingPlan   = "trial" | "starter" | "pro" | "enterprise";
export type TenantStatus  = "active" | "trial" | "suspended" | "cancelled";
export type TenantRole    = "owner" | "admin" | "manager" | "operator" | "viewer";
export type TenantCountry = "RU" | "KZ" | "BY" | "UZ" | "KG" | "AE" | "CN" | "OTHER";
export type Currency      = "RUB" | "USD" | "EUR" | "KZT" | "AED" | "CNY";

export interface Tenant {
  id: string;
  slug: string;
  companyName: string;
  domain: string | null;
  subdomain: string;
  country: TenantCountry;
  timezone: string;
  currency: Currency;
  language: "ru" | "en";
  plan: BillingPlan;
  status: TenantStatus;
  trialEnds: string | null;
  createdAt: string;
  updatedAt: string;
  owner: string;
  brandColor: string;
  logo: string | null;
  description: string;
  industry: "logistics" | "cargo" | "ved" | "wholesale" | "retail" | "other";
  aiEnabled: boolean;
  // White label
  contactEmail: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
  website: string | null;
  // Billing
  mrr: number;
  usersCount: number;
  lastActiveAt: string | null;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: TenantRole;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface TenantSettings {
  tenantId: string;
  // AI context
  companyGoals: string[];
  targetMarkets: string[];
  kpiTargets: Record<string, string | number>;
  // White label
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  welcomeMessage: string;
  // Modules enabled
  modules: {
    sales: boolean;
    marketing: boolean;
    content: boolean;
    analytics: boolean;
    operations: boolean;
    finance: boolean;
    strategy: boolean;
    ceo: boolean;
    crm: boolean;
    calculator: boolean;
    clientCabinet: boolean;
    partnerCabinet: boolean;
  };
}

export interface TenantAiContext {
  tenantId: string;
  companyName: string;
  industry: string;
  country: string;
  language: string;
  currency: string;
  plan: BillingPlan;
  goals: string[];
  markets: string[];
  description: string;
}

export interface BillingInfo {
  tenantId: string;
  plan: BillingPlan;
  status: TenantStatus;
  trialEnds: string | null;
  nextPayment: string | null;
  mrr: number;
  totalPaid: number;
  invoices: BillingInvoice[];
}

export interface BillingInvoice {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  status: "paid" | "pending" | "failed";
  description: string;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  paidTenants: number;
  suspendedTenants: number;
  mrr: number;
  arr: number;
  churn: number;
  growth: number;
  avgLtv: number;
  newThisMonth: number;
  byCountry: Record<string, number>;
  byPlan: Record<BillingPlan, number>;
}

export const PLAN_CONFIG: Record<BillingPlan, {
  label: string;
  price: number;
  currency: string;
  maxUsers: number;
  maxLeads: number;
  aiDepts: number;
  features: string[];
}> = {
  trial: {
    label: "Trial",
    price: 0,
    currency: "RUB",
    maxUsers: 3,
    maxLeads: 100,
    aiDepts: 3,
    features: ["Sales AI", "CRM", "Calculator"],
  },
  starter: {
    label: "Starter",
    price: 9900,
    currency: "RUB",
    maxUsers: 5,
    maxLeads: 500,
    aiDepts: 5,
    features: ["Sales AI", "Marketing AI", "Analytics AI", "CRM", "Calculator", "Client Cabinet"],
  },
  pro: {
    label: "Pro",
    price: 24900,
    currency: "RUB",
    maxUsers: 20,
    maxLeads: 5000,
    aiDepts: 7,
    features: ["All 7 AI Departments", "CEO AI", "Full CRM", "Partner Cabinet", "White Label"],
  },
  enterprise: {
    label: "Enterprise",
    price: 59900,
    currency: "RUB",
    maxUsers: 999,
    maxLeads: 999999,
    aiDepts: 9,
    features: ["Unlimited everything", "Custom domain", "API access", "SLA", "Dedicated support"],
  },
};
