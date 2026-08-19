import { neon } from '@neondatabase/serverless';

const FALLBACK_CNY     = 12.48;
const FALLBACK_USD     = 84.54;
const FALLBACK_CUSTOMS = 0.20; // 20%

// fact_key → mp_commissions key mapping
const INTEL_MP_KEYS: Record<string, string> = {
  WB_COMMISSION_STANDARD:    'wb',
  OZON_COMMISSION_STANDARD:  'ozon',
  KASPI_COMMISSION_STANDARD: 'kaspi',
  YANDEX_COMMISSION_STANDARD:'yandex',
};

export interface SystemRates {
  cny:            number;
  usd:            number;
  customs_rate:   number; // fraction: 0.20 = 20%
  mp_commissions: Record<string, number>; // e.g. { wb: 23, ozon: 18, kaspi: 12.6, yandex: 12 }
}

export async function getExchangeRates(): Promise<{ cny: number; usd: number }> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Intel_facts is the primary source; finance_settings is fallback
    const intelRows = await sql`
      SELECT fact_key, current_value FROM intel_facts
      WHERE fact_key IN ('CNY_RATE', 'USD_RATE')
    `.catch(() => []);

    const intelMap: Record<string, number> = {};
    for (const r of intelRows) intelMap[String(r.fact_key)] = Number(r.current_value);

    const cnyIntel = intelMap['CNY_RATE'];
    const usdIntel = intelMap['USD_RATE'];
    if (cnyIntel > 0 && usdIntel > 0) return { cny: cnyIntel, usd: usdIntel };

    // Fallback to finance_settings
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

    // ── 1. Intel_facts (primary, human-approved) ─────────────────────────────
    const intelKeys = ['CNY_RATE', 'USD_RATE', 'CUSTOMS_DUTY_DEFAULT', ...Object.keys(INTEL_MP_KEYS)];
    const intelRows = await sql`
      SELECT fact_key, current_value FROM intel_facts
      WHERE fact_key = ANY(${intelKeys}::text[])
    `.catch(() => []);

    const intel: Record<string, number> = {};
    for (const r of intelRows) {
      const v = Number(r.current_value);
      if (!isNaN(v)) intel[String(r.fact_key)] = v;
    }

    const intelMp: Record<string, number> = {};
    for (const [fk, mpKey] of Object.entries(INTEL_MP_KEYS)) {
      if (intel[fk] > 0) intelMp[mpKey] = intel[fk];
    }

    // ── 2. finance_settings (legacy fallback) ────────────────────────────────
    const fsRows = await sql`
      SELECT key, value FROM finance_settings
      WHERE tenant_id = 'tenant-chinabridge'
        AND (key IN ('cny_rate', 'usd_rate') OR key LIKE 'mp_%_commission')
    `.catch(() => []);

    const fs: Record<string, number> = {};
    for (const r of fsRows) fs[String(r.key)] = Number(r.value);

    const fsMp: Record<string, number> = {};
    for (const [k, v] of Object.entries(fs)) {
      const m = k.match(/^mp_(.+)_commission$/);
      if (m && v > 0) fsMp[m[1]] = v;
    }

    // ── 3. Merge: intel wins ──────────────────────────────────────────────────
    return {
      cny:          intel['CNY_RATE']  > 0 ? intel['CNY_RATE']  : (fs['cny_rate'] > 0 ? fs['cny_rate'] : FALLBACK_CNY),
      usd:          intel['USD_RATE']  > 0 ? intel['USD_RATE']  : (fs['usd_rate'] > 0 ? fs['usd_rate'] : FALLBACK_USD),
      customs_rate: intel['CUSTOMS_DUTY_DEFAULT'] > 0
        ? intel['CUSTOMS_DUTY_DEFAULT'] / 100 // stored as "20" → 0.20
        : FALLBACK_CUSTOMS,
      mp_commissions: { ...fsMp, ...intelMp },
    };
  } catch {
    return { cny: FALLBACK_CNY, usd: FALLBACK_USD, customs_rate: FALLBACK_CUSTOMS, mp_commissions: {} };
  }
}
