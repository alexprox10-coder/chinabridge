import type { CheckResult } from "../types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";

// Routes that MUST return 401 without auth
const PROTECTED = [
  "/api/admin/leads",
  "/api/admin/finance/orders",
  "/api/billing",
  "/api/payments/create",
  "/api/admin/documents",
];

async function checkProtected(path: string): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method:  path.includes("create") ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body:    path.includes("create") ? JSON.stringify({ plan: "starter" }) : undefined,
      signal:  AbortSignal.timeout(8000),
    });
    if (res.status === 401) {
      return { name: `Auth: ${path}`, status: "OK", message: "Returns 401 (protected)" };
    }
    if (res.status === 200) {
      return { name: `Auth: ${path}`, status: "ERROR", message: "Returns 200 without auth! (EXPOSED)" };
    }
    return { name: `Auth: ${path}`, status: "WARNING", message: `Returns ${res.status} without auth` };
  } catch (e) {
    return { name: `Auth: ${path}`, status: "ERROR", message: String(e) };
  }
}

async function checkSecurityHeaders(): Promise<CheckResult[]> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(8000) });
    const results: CheckResult[] = [];

    const csp = res.headers.get("content-security-policy");
    results.push({ name: "Content-Security-Policy", status: csp ? "OK" : "WARNING", message: csp ? "Present" : "Missing" });

    const xfo = res.headers.get("x-frame-options");
    results.push({ name: "X-Frame-Options", status: xfo ? "OK" : "WARNING", message: xfo ?? "Missing" });

    const xct = res.headers.get("x-content-type-options");
    results.push({ name: "X-Content-Type-Options", status: xct ? "OK" : "WARNING", message: xct ?? "Missing" });

    return results;
  } catch (e) {
    return [{ name: "Security headers", status: "ERROR", message: String(e) }];
  }
}

async function checkJwtEnvSet(): Promise<CheckResult> {
  const jwt = process.env.TOCHKA_JWT;
  if (!jwt || jwt.length < 100) {
    return { name: "TOCHKA_JWT env", status: "ERROR", message: "Not set or too short" };
  }
  return { name: "TOCHKA_JWT env", status: "OK", message: `Set (${jwt.length} chars)` };
}

async function checkCronSecretSet(): Promise<CheckResult> {
  const s = process.env.CRON_SECRET;
  if (!s || s.length < 8) return { name: "CRON_SECRET env", status: "WARNING", message: "Not set" };
  return { name: "CRON_SECRET env", status: "OK", message: "Set" };
}

export async function checkSecurity(): Promise<CheckResult[]> {
  const [protectedResults, headers, jwt, cronSecret] = await Promise.all([
    Promise.all(PROTECTED.map(checkProtected)),
    checkSecurityHeaders(),
    checkJwtEnvSet(),
    checkCronSecretSet(),
  ]);
  return [...protectedResults, ...headers, jwt, cronSecret];
}
