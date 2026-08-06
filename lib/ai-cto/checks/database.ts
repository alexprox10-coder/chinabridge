import { neon } from "@neondatabase/serverless";
import type { CheckResult } from "../types";

const sql = neon(process.env.DATABASE_URL!);

type CntRow = { cnt: unknown }[];

async function countTable(name: string, query: Promise<CntRow>): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const rows = await query;
    const cnt  = Number(rows[0]?.cnt ?? 0);
    return { name: `Table: ${name}`, status: "OK", message: `${cnt} rows`, ms: Date.now() - t0 };
  } catch (e) {
    return { name: `Table: ${name}`, status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkConnection(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await sql`SELECT 1`;
    return { name: "Neon connection", status: "OK", message: "Connected", ms: Date.now() - t0 };
  } catch (e) {
    return { name: "Neon connection", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkQueryPerf(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await sql`SELECT COUNT(*) FROM crm_leads`;
    const ms = Date.now() - t0;
    return { name: "Query performance", status: ms < 500 ? "OK" : ms < 1500 ? "WARNING" : "ERROR", message: `${ms}ms`, ms };
  } catch (e) {
    return { name: "Query performance", status: "ERROR", message: String(e) };
  }
}

export async function checkDatabase(): Promise<CheckResult[]> {
  return Promise.all([
    checkConnection(),
    checkQueryPerf(),
    countTable("tenants",         sql`SELECT COUNT(*) AS cnt FROM tenants`         as unknown as Promise<CntRow>),
    countTable("crm_leads",       sql`SELECT COUNT(*) AS cnt FROM crm_leads`       as unknown as Promise<CntRow>),
    countTable("finance_orders",  sql`SELECT COUNT(*) AS cnt FROM finance_orders`  as unknown as Promise<CntRow>),
    countTable("tochka_payments", sql`SELECT COUNT(*) AS cnt FROM tochka_payments` as unknown as Promise<CntRow>),
    countTable("cto_reports",     sql`SELECT COUNT(*) AS cnt FROM cto_reports`     as unknown as Promise<CntRow>),
  ]);
}
