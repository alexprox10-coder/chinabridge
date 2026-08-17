import { neon } from '@neondatabase/serverless';

const FALLBACK_CNY = 12.48;
const FALLBACK_USD = 84.54;

export interface SystemRates {
  cny: number;
  usd: number;
  mp_commissions: Record<string, number>; // e.g. { wb: 23, ozon: 18, kaspi: 12.6, yandex: 12 }
}

export async function getExchangeRates(): Promise<{ cny: number; usd: number }> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT key, value FROM finance_settings
      WHERE key IN ('cny_rate', 'usd_rate') AND tenant_id = 'tenant-chinabridge'
    `;
    const map: Record<string, number> = {};
    for (const r of rows) map[String(r.key)] = Number(r.value);
    return {
      cny: map['cny_rate'] > 0 ? map['cny_rate'] : FALLBACK_CNY,
      usd: map['usd_rate'] > 0 ? map['usd_rate'] : FALLBACK_USD,
    };
  } catch {
    return { cny: FALLBACK_CNY, usd: FALLBACK_USD };
  }
}

export async function getSystemRates(): Promise<SystemRates> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT key, value FROM finance_settings
      WHERE tenant_id = 'tenant-chinabridge'
        AND (key IN ('cny_rate', 'usd_rate') OR key LIKE 'mp_%_commission')
    `;
    const map: Record<string, number> = {};
    for (const r of rows) map[String(r.key)] = Number(r.value);

    const mp_commissions: Record<string, number> = {};
    for (const [k, v] of Object.entries(map)) {
      const m = k.match(/^mp_(.+)_commission$/);
      if (m && v > 0) mp_commissions[m[1]] = v;
    }

    return {
      cny: map['cny_rate'] > 0 ? map['cny_rate'] : FALLBACK_CNY,
      usd: map['usd_rate'] > 0 ? map['usd_rate'] : FALLBACK_USD,
      mp_commissions,
    };
  } catch {
    return { cny: FALLBACK_CNY, usd: FALLBACK_USD, mp_commissions: {} };
  }
}
