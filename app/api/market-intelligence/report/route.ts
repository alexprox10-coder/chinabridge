import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMILeadStats, getLatestReport } from "@/lib/market-intelligence/db";
import { getLeads } from "@/lib/crm/client";
import { analyzeDealIntelligence } from "@/lib/market-intelligence/deal-intelligence";
import { saveReport } from "@/lib/market-intelligence/db";
import type { MIDailyReport } from "@/lib/market-intelligence/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getTenantId() {
  const store = await cookies();
  return store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}

export async function GET() {
  const tenantId = await getTenantId();
  const report = await getLatestReport(tenantId);
  return NextResponse.json(report ?? null);
}

export async function POST() {
  const tenantId = await getTenantId();
  const today = new Date().toISOString().slice(0, 10);

  const [stats, crmLeads] = await Promise.all([
    getMILeadStats(tenantId),
    getLeads({ tenantId }),
  ]);

  const dealResult = analyzeDealIntelligence(crmLeads);
  const topDeal = dealResult.topDeals[0];

  const recommendations: string[] = [];
  if (stats.hot > 0) recommendations.push(`Связаться с ${stats.hot} HOT-лидами сегодня`);
  if (dealResult.urgentDeals.length > 0) recommendations.push(`${dealResult.urgentDeals.length} сделок требуют срочного внимания`);
  if (dealResult.staleDeals.length > 0) recommendations.push(`Реактивировать ${dealResult.staleDeals.length} зависших сделок`);
  if (dealResult.forecast.d7 > 0) recommendations.push(`Потенциальная выручка за 7 дней: ${dealResult.forecast.d7.toLocaleString("ru")} ₽`);
  if (stats.telegram > 0) recommendations.push(`Изучить ${stats.telegram} Telegram-каналов из базы лидов`);

  const fullText = `📊 Market Intelligence Daily Report — ${today}

ЛИДЫ:
• Всего найдено: ${stats.total}
• HOT: ${stats.hot} | WARM: ${stats.warm} | COLD: ${stats.cold}
• Google: ${stats.google} | Telegram: ${stats.telegram} | VK: ${stats.vk}

СДЕЛКИ:
• В воронке: ${dealResult.deals.length}
• Средний Deal Score: ${dealResult.avgScore}/100
• Весь пайплайн: ${dealResult.totalPipeline.toLocaleString("ru")} ₽
• Прогноз 7 дней: ${dealResult.forecast.d7.toLocaleString("ru")} ₽
• Прогноз 30 дней: ${dealResult.forecast.d30.toLocaleString("ru")} ₽
• Прогноз 90 дней: ${dealResult.forecast.d90.toLocaleString("ru")} ₽

ТОП СДЕЛКА:
${topDeal ? `• ${topDeal.company} | Score: ${topDeal.score} | Вероятность: ${topDeal.winProbability}% | Выручка: ${topDeal.expectedRevenue.toLocaleString("ru")} ₽` : "• Нет данных"}

РЕКОМЕНДАЦИИ CEO:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;

  const report: MIDailyReport = {
    tenantId,
    reportId: `report-${tenantId}-${today}`,
    date: today,
    leadsFound: stats.total,
    leadsGoogle: stats.google,
    leadsTelegram: stats.telegram,
    leadsVk: stats.vk,
    hotLeads: stats.hot,
    newCompanies: stats.total,
    newTelegramChannels: stats.telegram,
    newVkCommunities: stats.vk,
    topDealCompany: topDeal?.company,
    topDealScore: topDeal?.score,
    topDealProbability: topDeal?.winProbability,
    topDealRevenue: topDeal?.expectedRevenue,
    trendOfWeek: "Электроника и автозапчасти",
    trendGrowth: 34,
    recommendations,
    fullText,
    createdAt: new Date().toISOString(),
  };

  await saveReport(report);
  return NextResponse.json({ ok: true, report });
}
