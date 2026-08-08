import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { getChannelStats, getCampaigns, type ChannelRow } from "@/lib/marketing/db";

export const runtime = "nodejs";

type Period = "today" | "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
};

/* How many days back to look */
const PERIOD_DAYS: Record<Period, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

function safeDiv(a: number, b: number): number | null {
  if (!b) return null;
  return Number((a / b).toFixed(2));
}

function pct(a: number, b: number): number {
  if (!b) return 0;
  return Number(((a / b) * 100).toFixed(1));
}

/* ── CRM funnel from real Neon tables ──────────────────────────────────────── */
interface CrmStats {
  leads: number;
  qualified: number;
  proposals: number;
  won: number;
  revenueUsd: number;
}

async function getCrmStats(days: number): Promise<CrmStats> {
  const sql = getSql();
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

  /* Leads created in the period */
  const leadsRows = (await sql`
    SELECT
      COUNT(*)                                                           AS total,
      COUNT(*) FILTER (WHERE status IN ('QUALIFIED','PROPOSAL','WON'))  AS qualified,
      COUNT(*) FILTER (WHERE status IN ('PROPOSAL','WON'))              AS proposals,
      COUNT(*) FILTER (WHERE status = 'WON')                           AS won
    FROM crm_leads
    WHERE created_at >= ${since}
  `) as Array<Record<string, string>>;

  const r = leadsRows[0] ?? {};

  /* Revenue from finance_orders in the same period */
  const revenueRows = (await sql`
    SELECT COALESCE(SUM(CAST(client_price AS numeric)), 0) AS revenue
    FROM finance_orders
    WHERE created_at >= ${since}
      AND status != 'cancelled'
  `) as Array<Record<string, string>>;

  return {
    leads:      Number(r.total      ?? 0),
    qualified:  Number(r.qualified  ?? 0),
    proposals:  Number(r.proposals  ?? 0),
    won:        Number(r.won        ?? 0),
    revenueUsd: Number(revenueRows[0]?.revenue ?? 0),
  };
}

/* ── UTM-based channel attribution from CRM ───────────────────────────────── */
interface UtmChannel {
  name: string;
  platform: string;
  leads: number;
}

async function getUtmChannels(days: number): Promise<UtmChannel[]> {
  const sql = getSql();
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

  const rows = (await sql`
    SELECT
      COALESCE(NULLIF(utm_source, ''), source, 'Прямой трафик') AS channel,
      COUNT(*) AS leads
    FROM crm_leads
    WHERE created_at >= ${since}
    GROUP BY 1
    ORDER BY leads DESC
    LIMIT 8
  `) as Array<Record<string, string>>;

  return rows.map((r) => ({
    name: r.channel,
    platform: r.channel.toLowerCase(),
    leads: Number(r.leads),
  }));
}

/* ── Demo channels (fallback when no marketing_channels rows) ──────────────── */
interface DemoChannel {
  name: string;
  platform: string;
  spend: number;
  leads: number;
  trials: number;
  payments: number;
}

const DEMO_CHANNELS: DemoChannel[] = [
  { name: "Telegram Ads",       platform: "telegram", spend: 96000, leads: 71, trials: 44, payments: 7 },
  { name: "Яндекс Директ",      platform: "yandex",   spend: 88000, leads: 52, trials: 31, payments: 5 },
  { name: "SEO / органика",     platform: "organic",  spend: 25000, leads: 38, trials: 24, payments: 4 },
  { name: "VK Реклама",         platform: "vk",       spend: 54000, leads: 29, trials: 15, payments: 2 },
  { name: "Авито",              platform: "avito",    spend: 32000, leads: 17, trials: 9,  payments: 1 },
  { name: "Партнёрские каналы", platform: "partner",  spend: 20000, leads: 7,  trials: 5,  payments: 0 },
];

function buildDemoChannel(c: DemoChannel) {
  return {
    name: c.name,
    platform: c.platform,
    spend_rub: c.spend,
    leads: c.leads,
    trials: c.trials,
    payments: c.payments,
    cpl: safeDiv(c.spend, c.leads),
    cac: safeDiv(c.spend, c.payments),
    lead_to_payment_pct: pct(c.payments, c.leads),
    isDemo: true,
  };
}

function buildRealDbChannel(c: ChannelRow) {
  return {
    name: c.name,
    platform: c.platform,
    spend_rub: c.spend_total,
    leads: c.leads_total,
    trials: c.trials_total,
    payments: c.payments_total,
    cpl: safeDiv(c.spend_total, c.leads_total),
    cac: safeDiv(c.spend_total, c.payments_total),
    lead_to_payment_pct: pct(c.payments_total, c.leads_total),
    isDemo: false,
  };
}

/* ── Route ─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cb_admin")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const raw = (req.nextUrl.searchParams.get("period") ?? "30d") as Period;
  const period: Period = (["today", "7d", "30d", "90d"] as const).includes(raw) ? raw : "30d";
  const days = PERIOD_DAYS[period];

  /* ── Real CRM data ── */
  let crm: CrmStats = { leads: 0, qualified: 0, proposals: 0, won: 0, revenueUsd: 0 };
  let utmChannels: UtmChannel[] = [];
  let hasCrmData = false;

  try {
    crm = await getCrmStats(days);
    utmChannels = await getUtmChannels(days);
    hasCrmData = crm.leads > 0;
  } catch {
    /* DB unavailable — fall through to show zeros */
  }

  /* ── Marketing DB channels (manually tracked ad spend) ── */
  let dbChannels: ChannelRow[] = [];
  try {
    dbChannels = await getChannelStats();
  } catch {
    dbChannels = [];
  }

  /* ── Campaigns ── */
  let campaignCount = 0;
  let campaignSpend = 0;
  let campaignLeads = 0;
  let campaignPayments = 0;
  try {
    const campaigns = await getCampaigns();
    campaignCount = campaigns.length;
    for (const c of campaigns) {
      campaignSpend += c.spend_rub ?? 0;
      campaignLeads += c.leads ?? 0;
      campaignPayments += c.payments ?? 0;
    }
  } catch { /* optional */ }

  /* ── Build funnel ── */
  /* Visitors: still no real source → show 0 with honest label */
  const visitors = 0; // requires GA4/Metrika API — not connected
  const leads      = crm.leads;
  const qualified  = crm.qualified;
  const proposals  = crm.proposals;
  const payments   = crm.won;

  /* Revenue: convert USD to RUB (rough 90x) */
  const revenueRub = Math.round(crm.revenueUsd * 90);

  /* Ad spend from marketing_campaigns if available */
  const spendRub = campaignSpend > 0 ? campaignSpend : 0;

  const funnel = [
    { stage: "leads",     label: "Лиды (CRM)",            count: leads,     pct: 100 },
    { stage: "qualified", label: "Квалифицированы",        count: qualified, pct: pct(qualified, leads) },
    { stage: "proposals", label: "Расчёты отправлены",     count: proposals, pct: pct(proposals, leads) },
    { stage: "payments",  label: "Оплаты / сделки",        count: payments,  pct: pct(payments, leads) },
  ];

  const kpi = {
    visitors,
    leads,
    payments,
    spend_rub: spendRub,
    revenue_rub: revenueRub,
    cpl: safeDiv(spendRub, leads),
    cac: safeDiv(spendRub, payments),
    roas: safeDiv(revenueRub, spendRub),
    avg_check_rub: safeDiv(revenueRub, payments),
    conversion_visitor_to_lead_pct: null,
    conversion_lead_to_payment_pct: pct(payments, leads),
  };

  /* ── Channels: priority = marketing_channels table → UTM attribution → demo ── */
  let channels: ReturnType<typeof buildRealDbChannel>[];
  let channelsAreReal = false;

  if (dbChannels.length > 0) {
    channels = dbChannels.map(buildRealDbChannel);
    channelsAreReal = true;
  } else if (utmChannels.length > 0) {
    channels = utmChannels.map((u) => ({
      name: u.name,
      platform: u.platform,
      spend_rub: 0,
      leads: u.leads,
      trials: 0,
      payments: 0,
      cpl: null,
      cac: null,
      lead_to_payment_pct: 0,
      isDemo: false,
    }));
    channelsAreReal = true;
  } else {
    channels = DEMO_CHANNELS.map(buildDemoChannel);
  }

  const isDemoData = !hasCrmData;

  return NextResponse.json({
    ok: true,
    isDemoData,
    demoNotice: isDemoData
      ? "Лиды в CRM ещё не добавлены. Как только появятся — воронка заполнится реальными данными."
      : null,
    visitorsNote: "Посетители сайта: подключите GA4 или Яндекс.Метрику для реальных цифр.",
    channelsAreReal,
    period,
    periodLabel: PERIOD_LABELS[period],
    generatedAt: new Date().toISOString(),
    kpi,
    funnel,
    channels,
    campaigns: {
      total: campaignCount,
      spend_rub: campaignSpend,
      leads: campaignLeads,
      payments: campaignPayments,
      cpl: safeDiv(campaignSpend, campaignLeads),
      cac: safeDiv(campaignSpend, campaignPayments),
    },
  });
}
