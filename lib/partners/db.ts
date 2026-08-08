import { neon } from "@neondatabase/serverless";

let ready = false;

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

async function bootstrap() {
  if (ready) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_links (
      id         text PRIMARY KEY,
      tenant_id  text NOT NULL,
      code       text NOT NULL UNIQUE,
      name       text,
      created_at text NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS referrals (
      id                   text PRIMARY KEY,
      affiliate_link_id    text NOT NULL,
      referred_tenant_id   text,
      ip                   text,
      status               text NOT NULL DEFAULT 'click',
      created_at           text NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS partner_commissions (
      id                text PRIMARY KEY,
      referral_id       text NOT NULL,
      affiliate_link_id text NOT NULL,
      amount_rub        integer NOT NULL,
      status            text NOT NULL DEFAULT 'pending',
      period            text NOT NULL,
      created_at        text NOT NULL
    )
  `;
  ready = true;
}

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function getOrCreateLink(tenantId: string): Promise<{ code: string }> {
  await bootstrap();
  const sql = getSql();

  const existing = await sql`
    SELECT code FROM affiliate_links WHERE tenant_id = ${tenantId} LIMIT 1
  `;
  if (existing.length > 0) return { code: existing[0].code as string };

  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const conflict = await sql`SELECT id FROM affiliate_links WHERE code = ${code} LIMIT 1`;
    if (conflict.length === 0) break;
    code = randomCode();
  }

  const id = `afl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await sql`
    INSERT INTO affiliate_links (id, tenant_id, code, created_at)
    VALUES (${id}, ${tenantId}, ${code}, ${nowIso()})
  `;
  return { code };
}

export async function recordClick(code: string, ip: string): Promise<void> {
  await bootstrap();
  const sql = getSql();

  const link = await sql`SELECT id FROM affiliate_links WHERE code = ${code} LIMIT 1`;
  if (link.length === 0) return;

  const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await sql`
    INSERT INTO referrals (id, affiliate_link_id, ip, status, created_at)
    VALUES (${id}, ${link[0].id as string}, ${ip}, 'click', ${nowIso()})
  `;
}

export interface PartnerStats {
  code: string;
  clicks: number;
  signups: number;
  paid_referrals: number;
  total_commission_rub: number;
  pending_commission_rub: number;
}

export async function getStats(tenantId: string): Promise<PartnerStats | null> {
  await bootstrap();
  const sql = getSql();

  const link = await sql`SELECT id, code FROM affiliate_links WHERE tenant_id = ${tenantId} LIMIT 1`;
  if (link.length === 0) return null;

  const linkId = link[0].id as string;
  const code = link[0].code as string;

  const [clicks, signups, paid, commissions] = await Promise.all([
    sql`SELECT COUNT(*)::int as n FROM referrals WHERE affiliate_link_id = ${linkId} AND status = 'click'`,
    sql`SELECT COUNT(*)::int as n FROM referrals WHERE affiliate_link_id = ${linkId} AND status = 'signup'`,
    sql`SELECT COUNT(*)::int as n FROM referrals WHERE affiliate_link_id = ${linkId} AND status = 'paid'`,
    sql`SELECT COALESCE(SUM(amount_rub),0)::int as total, COALESCE(SUM(CASE WHEN status='pending' THEN amount_rub ELSE 0 END),0)::int as pending FROM partner_commissions WHERE affiliate_link_id = ${linkId}`,
  ]);

  return {
    code,
    clicks: Number(clicks[0].n ?? 0),
    signups: Number(signups[0].n ?? 0),
    paid_referrals: Number(paid[0].n ?? 0),
    total_commission_rub: Number(commissions[0].total ?? 0),
    pending_commission_rub: Number(commissions[0].pending ?? 0),
  };
}
