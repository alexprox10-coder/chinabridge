import { cookies, headers } from "next/headers";
import { getTenantBySlug, getTenantByDomain, getTenantById } from "./store";
import type { Tenant } from "./types";

const DEFAULT_TENANT_SLUG = "chinabridge";
const SUPER_ADMIN_COOKIE  = "cb_super_admin";
const TENANT_COOKIE       = "cb_tenant_id";

export async function getCurrentTenant(): Promise<Tenant | null> {
  const cookieStore = await cookies();

  // 1. Explicit tenant override (Super Admin impersonation)
  const tenantIdCookie = cookieStore.get(TENANT_COOKIE)?.value;
  if (tenantIdCookie) {
    const t = await getTenantById(tenantIdCookie);
    if (t) return t;
  }

  // 2. Subdomain detection from Host header
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "www" && subdomain !== "chinabridge" && subdomain !== "localhost") {
    const t = await getTenantByDomain(subdomain);
    if (t) return t;
  }

  // 3. Custom domain match
  if (host && !host.includes("localhost") && !host.includes("chinabridge.pro") && !host.includes("vercel.app")) {
    const t = await getTenantByDomain(host.split(":")[0]);
    if (t) return t;
  }

  // 4. Default tenant (ChinaBridge)
  return getTenantBySlug(DEFAULT_TENANT_SLUG);
}

export async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const val = cookieStore.get(SUPER_ADMIN_COOKIE)?.value;
  return !!(val && process.env.SUPER_ADMIN_SECRET && val === process.env.SUPER_ADMIN_SECRET);
}

export async function requireSuperAdmin(): Promise<boolean> {
  return isSuperAdmin();
}

export function getTenantIdFromCookie(cookieValue: string | undefined): string | null {
  return cookieValue ?? null;
}

export function buildTenantCookieHeader(tenantId: string): string {
  return `${TENANT_COOKIE}=${tenantId}; Path=/; HttpOnly; SameSite=Lax`;
}
