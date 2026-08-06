import type { CheckResult } from "../types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";

const PAGES = [
  { label: "Главная",    path: "/" },
  { label: "CRM/Лиды",  path: "/admin/leads" },
  { label: "CEO AI",    path: "/admin/ai-company/ceo" },
  { label: "Analytics", path: "/admin/ai-company/analytics" },
  { label: "Finance",   path: "/admin/finance" },
  { label: "Billing",   path: "/admin/settings/billing" },
  { label: "Pricing",   path: "/admin/pricing" },
];

async function checkPage(label: string, path: string): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(10000),
      headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
    });
    const ms = Date.now() - t0;
    if (!res.ok && res.status !== 302 && res.status !== 307 && res.status !== 200) {
      return { name: label, status: "WARNING", message: `HTTP ${res.status}`, ms };
    }
    const status = ms < 2000 ? "OK" : ms < 5000 ? "WARNING" : "ERROR";
    return { name: label, status, message: `${ms}ms`, ms };
  } catch (e) {
    return { name: label, status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

export async function checkPerformance(): Promise<CheckResult[]> {
  const results = await Promise.allSettled(
    PAGES.map(p => checkPage(p.label, p.path))
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { name: PAGES[i].label, status: "ERROR" as const, message: String(r.reason) }
  );
}
