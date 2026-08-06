import type { NextRequest } from "next/server";

/**
 * Accepts both owner (cb_admin) and registered tenant (cb_tenant_session) sessions.
 * Used in all /api/* routes that should be accessible to any logged-in cabinet.
 */
export function isAuthorized(req: NextRequest): boolean {
  return !!(
    req.cookies.get("cb_admin")?.value ||
    req.cookies.get("cb_tenant_session")?.value
  );
}

/**
 * Returns the tenant id from cookie, falling back to owner tenant.
 */
export function getTenantId(req: NextRequest): string {
  return req.cookies.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}
