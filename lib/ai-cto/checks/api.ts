import type { CheckResult } from "../types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
const AUTH  = { "x-cron-secret": process.env.CRON_SECRET ?? "" };
const TIMEOUT = 8000;

interface RouteSpec {
  label:    string;
  path:     string;
  method?:  string;
  auth?:    boolean;
  expect?:  number;
  body?:    Record<string, unknown>;
}

const ROUTES: RouteSpec[] = [
  { label: "GET /api/rates",                   path: "/api/rates",                         auth: true, expect: 200 },
  { label: "GET /api/admin/leads",             path: "/api/admin/leads",                   auth: true, expect: 200 },
  { label: "GET /api/platform/metrics",        path: "/api/platform/metrics",              auth: true, expect: 200 },
  { label: "GET /api/billing",                 path: "/api/billing",                       auth: true, expect: 200 },
  { label: "GET /api/admin/finance/orders",    path: "/api/admin/finance/orders",          auth: true, expect: 200 },
  { label: "GET /api/admin/finance/payments",  path: "/api/admin/finance/payments",        auth: true, expect: 200 },
  { label: "GET /api/admin/finance/expenses",  path: "/api/admin/finance/expenses",        auth: true, expect: 200 },
  { label: "GET /api/admin/finance/settings",  path: "/api/admin/finance/settings",        auth: true, expect: 200 },
  { label: "GET /api/admin/finance/reports",   path: "/api/admin/finance/reports",         auth: true, expect: 200 },
  { label: "GET /api/admin/documents",         path: "/api/admin/documents",               auth: true, expect: 200 },
  { label: "GET /api/admin/settings/company",  path: "/api/admin/settings/company",        auth: true, expect: 200 },
  { label: "GET /api/market-intelligence/deals", path: "/api/market-intelligence/deals",   auth: true, expect: 200 },
  { label: "GET /api/market-intelligence/radar", path: "/api/market-intelligence/radar",   auth: true, expect: 200 },
  // Auth protection checks (no auth → must return 401)
  { label: "Auth: /api/billing (no auth)",         path: "/api/billing",             auth: false, expect: 401 },
  { label: "Auth: /api/platform/metrics (no auth)", path: "/api/platform/metrics",  auth: false, expect: 401 },
  { label: "Auth: /api/admin/documents (no auth)", path: "/api/admin/documents",    auth: false, expect: 401 },
];

async function fetchRoute(spec: RouteSpec): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (spec.auth) Object.assign(headers, AUTH);

    const res = await fetch(`${BASE}${spec.path}`, {
      method:  spec.method ?? "GET",
      headers,
      body:    spec.body ? JSON.stringify(spec.body) : undefined,
      signal:  AbortSignal.timeout(TIMEOUT),
    });
    const ms = Date.now() - t0;
    const expected = spec.expect ?? 200;

    if (res.status === expected) {
      return { name: spec.label, status: "OK",      message: `${res.status} OK`,             ms };
    }
    if (Math.floor(res.status / 100) === 5) {
      return { name: spec.label, status: "ERROR",   message: `${res.status} Server Error`,   ms };
    }
    return   { name: spec.label, status: "WARNING", message: `${res.status} (expected ${expected})`, ms };
  } catch (e) {
    return { name: spec.label, status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

export async function checkApi(): Promise<CheckResult[]> {
  const results = await Promise.allSettled(ROUTES.map(r => fetchRoute(r)));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { name: ROUTES[i].label, status: "ERROR" as const, message: String(r.reason) }
  );
}
