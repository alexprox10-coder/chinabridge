import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getChannelStats, getCampaigns, type ChannelRow } from "@/lib/marketing/db";

export const runtime = "nodejs";

/* ────────────────────────────────────────────────────────────────────────────
   Marketing analytics.
   Until GA4 / Яндекс.Метрика / рекламные кабинеты are actually connected the
   top-level funnel is DEMO data. Real rows from `marketing_channels` override
   the demo channel list whenever they exist.
   ──────────────────────────────────────────────────────────────────────────── */

type Period = "today" | "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
};

/* Base = 30 days. Other periods are scaled from it. */
const PERIOD_SCALE: Record<Period, number> = {
  today: 1 / 30,
  "7d": 7 / 30,
  "30d": 1,
  "90d": 3,
};

const DEMO_BASE = {
  visitors: 8420,
  leads: 214,
  qualified: 132,
  proposals: 61,
  payments: 19,
  spend_rub: 315000,
  revenue_rub: 2660000,
};

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

function round(n: number): number {
  return Math.max(0, Math.round(n));
}

function safeDiv(a: number, b: number): number | null {
  if (!b) return null;
  return Number((a / b).toFixed(2));
}

function pct(a: number, b: number): number {
  if (!b) return 0;
  return Number(((a / b) * 100).toFixed(1));
}

function buildChannel(c: DemoChannel, isDemo: boolean) {
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
    isDemo,
  };
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cb_admin")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const raw = (req.nextUrl.searchParams.get("period") ?? "30d") as Period;
  const period: Period = (["today", "7d", "30d", "90d"] as const).includes(raw) ? raw : "30d";
  const k = PERIOD_SCALE[period];

  let dbChannels: ChannelRow[] = [];
  let campaignCount = 0;
  let campaignSpend = 0;
  let campaignLeads = 0;
  let campaignPayments = 0;

  try {
    dbChannels = await getChannelStats();
  } catch {
    dbChannels = [];
  }

  try {
    const campaigns = await getCampaigns();
    campaignCount = campaigns.length;
    for (const c of campaigns) {
      campaignSpend += c.spend_rub ?? 0;
      campaignLeads += c.leads ?? 0;
      campaignPayments += c.payments ?? 0;
    }
  } catch {
    /* campaigns are optional for the dashboard */
  }

  const hasRealChannels = dbChannels.length > 0;

  const channels = hasRealChannels
    ? dbChannels.map((c) =>
        buildChannel(
          {
            name: c.name,
            platform: c.platform,
            spend: c.spend_total,
            leads: c.leads_total,
            trials: c.trials_total,
            payments: c.payments_total,
          },
          false,
        ),
      )
    : DEMO_CHANNELS.map((c) =>
        buildChannel(
          {
            ...c,
            spend: round(c.spend * k),
            leads: round(c.leads * k),
            trials: round(c.trials * k),
            payments: round(c.payments * k),
          },
          true,
        ),
      );

  /* Funnel: demo numbers scaled to the requested period. */
  const visitors = round(DEMO_BASE.visitors * k);
  const leads = round(DEMO_BASE.leads * k);
  const qualified = round(DEMO_BASE.qualified * k);
  const proposals = round(DEMO_BASE.proposals * k);
  const payments = round(DEMO_BASE.payments * k);
  const spend = round(DEMO_BASE.spend_rub * k);
  const revenue = round(DEMO_BASE.revenue_rub * k);

  const funnel = [
    { stage: "visitors",  label: "Посетители сайта", count: visitors,  pct: 100 },
    { stage: "leads",     label: "Заявки / лиды",    count: leads,     pct: pct(leads, visitors) },
    { stage: "qualified", label: "Квалифицированы",  count: qualified, pct: pct(qualified, visitors) },
    { stage: "proposals", label: "Расчёты отправлены", count: proposals, pct: pct(proposals, visitors) },
    { stage: "payments",  label: "Оплаты",           count: payments,  pct: pct(payments, visitors) },
  ];

  const kpi = {
    visitors,
    leads,
    payments,
    spend_rub: spend,
    revenue_rub: revenue,
    cpl: safeDiv(spend, leads),
    cac: safeDiv(spend, payments),
    roas: safeDiv(revenue, spend),
    avg_check_rub: safeDiv(revenue, payments),
    conversion_visitor_to_lead_pct: pct(leads, visitors),
    conversion_lead_to_payment_pct: pct(payments, leads),
  };

  return NextResponse.json({
    ok: true,
    isDemoData: true,
    demoNotice:
      "Данные воронки — ДЕМО. Реальные цифры появятся после подключения GA4 / Яндекс.Метрики и рекламных кабинетов.",
    channelsAreReal: hasRealChannels,
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
