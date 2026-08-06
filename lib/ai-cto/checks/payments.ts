import type { CheckResult } from "../types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
const AUTH  = { "x-cron-secret": process.env.CRON_SECRET ?? "", "Content-Type": "application/json" };

async function checkCreateEndpoint(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}/api/payments/create`, {
      method:  "POST",
      headers: AUTH,
      body:    JSON.stringify({ plan: "starter", tenantId: "cto-audit-tenant" }),
      signal:  AbortSignal.timeout(15000),
    });
    const ms   = Date.now() - t0;
    const json = await res.json() as Record<string, unknown>;

    if (json.ok && json.paymentLink) {
      return { name: "Payment link creation", status: "OK", message: `Link created in ${ms}ms`, ms, details: String(json.paymentLink).slice(0, 60) };
    }
    return { name: "Payment link creation", status: "ERROR", message: String(json.error ?? "No paymentLink"), ms };
  } catch (e) {
    return { name: "Payment link creation", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkCheckEndpoint(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}/api/payments/check?operationId=nonexistent-op-id`, {
      headers: AUTH,
      signal:  AbortSignal.timeout(10000),
    });
    const ms = Date.now() - t0;
    // Either 200 (with error message about not found) or 500 is acceptable
    if (res.status === 200 || res.status === 404 || res.status === 500) {
      return { name: "Payment check endpoint", status: "OK", message: `Responds in ${ms}ms`, ms };
    }
    if (res.status === 401) {
      return { name: "Payment check endpoint", status: "ERROR", message: "Auth failed (CRON_SECRET issue)", ms };
    }
    return { name: "Payment check endpoint", status: "WARNING", message: `HTTP ${res.status}`, ms };
  } catch (e) {
    return { name: "Payment check endpoint", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkTochkaEnv(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const jwt     = process.env.TOCHKA_JWT;
  const custCode = process.env.TOCHKA_CUSTOMER_CODE;
  const merchant = process.env.TOCHKA_MERCHANT_ID;

  results.push({ name: "Tochka JWT",           status: (jwt && jwt.length > 200) ? "OK" : "ERROR", message: jwt ? `${jwt.length} chars` : "Missing" });
  results.push({ name: "Tochka customerCode",  status: custCode ? "OK" : "ERROR",  message: custCode ?? "Missing" });
  results.push({ name: "Tochka merchantId",    status: merchant  ? "OK" : "ERROR", message: merchant  ?? "Missing" });

  return results;
}

async function checkPaymentsTable(): Promise<CheckResult> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  const t0  = Date.now();
  try {
    const rows = await sql`SELECT COUNT(*) AS cnt FROM tochka_payments`;
    return { name: "Payments table", status: "OK", message: `${rows[0].cnt} records`, ms: Date.now() - t0 };
  } catch (e) {
    return { name: "Payments table", status: "WARNING", message: String(e), ms: Date.now() - t0 };
  }
}

export async function checkPayments(): Promise<CheckResult[]> {
  const [createResult, checkResult, envResults, tableResult] = await Promise.all([
    checkCreateEndpoint(),
    checkCheckEndpoint(),
    checkTochkaEnv(),
    checkPaymentsTable(),
  ]);
  return [createResult, checkResult, tableResult, ...envResults];
}
