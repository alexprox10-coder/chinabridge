// Per-tenant localStorage key helpers (client-side)
// Usage: import on client components only

export const tenantKey = (tenantId: string, key: string) =>
  `tenant_${tenantId}_${key}`;

export const CEO_TASKS_KEY     = (tid: string) => tenantKey(tid, "ceo_tasks");
export const CEO_DECISIONS_KEY = (tid: string) => tenantKey(tid, "ceo_decisions");
export const CEO_HISTORY_KEY   = (tid: string) => tenantKey(tid, "ceo_history");
export const CEO_INBOX_KEY     = (tid: string) => tenantKey(tid, "ceo_inbox");

export function readTenantStorage<T>(tenantId: string, key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(tenantKey(tenantId, key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeTenantStorage<T>(tenantId: string, key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(tenantKey(tenantId, key), JSON.stringify(value));
  } catch {}
}

export function clearTenantStorage(tenantId: string): void {
  if (typeof window === "undefined") return;
  const prefix = `tenant_${tenantId}_`;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
  keys.forEach(k => localStorage.removeItem(k));
}
