import type {
  SalesAnalytics, MarketingAnalytics, ContentAnalytics, FinanceAnalytics,
  DepartmentScore, CompanyHealth, BIInsight, AnalyticsStatus,
} from "./types";

// ── Scoring ────────────────────────────────────────────────────────────────

export function scoreSales(s: SalesAnalytics): number {
  let score = 0;
  if (s.importLeads >= 20)      score += 25;
  else if (s.importLeads >= 5)  score += 12;
  if (s.hotLeads >= 3)          score += 20;
  else if (s.hotLeads >= 1)     score += 10;
  if (s.conversion >= 10)       score += 20;
  else if (s.conversion >= 3)   score += 10;
  if (s.staleLeads === 0)       score += 20;
  else if (s.staleLeads <= 2)   score += 10;
  if (s.crmTotal >= 5)          score += 15;
  else if (s.crmTotal >= 1)     score += 7;
  return Math.min(100, score);
}

export function scoreMarketing(m: MarketingAnalytics): number {
  let score = 0;
  if (m.visitors >= 10000)      score += 25;
  else if (m.visitors >= 3000)  score += 12;
  if (m.leads >= 15)            score += 25;
  else if (m.leads >= 5)        score += 12;
  if (m.cpl <= 1500)            score += 25;
  else if (m.cpl <= 2500)       score += 12;
  if (m.trafficSources.length >= 4) score += 25;
  else if (m.trafficSources.length >= 2) score += 12;
  return Math.min(100, score);
}

export function scoreContent(c: ContentAnalytics): number {
  let score = 0;
  if (c.articles >= 10)         score += 25;
  else if (c.articles >= 5)     score += 12;
  if (c.totalViews >= 100000)   score += 25;
  else if (c.totalViews >= 20000) score += 12;
  if (c.telegramPosts >= 100)   score += 25;
  else if (c.telegramPosts >= 30) score += 12;
  if (c.shorts >= 15)           score += 25;
  else if (c.shorts >= 5)       score += 12;
  return Math.min(100, score);
}

export function scoreFinance(f: FinanceAnalytics): number {
  if (!f.connected) return 40;
  let score = 0;
  if (f.revenue > 0)      score += 40;
  if (f.margin >= 20)     score += 30;
  else if (f.margin > 0)  score += 15;
  if (f.expenses > 0)     score += 30;
  return Math.min(100, score);
}

function status(s: number): AnalyticsStatus {
  return s >= 90 ? "GOOD" : s >= 60 ? "WARNING" : "CRITICAL";
}

export function calculateCompanyHealth(
  sales: SalesAnalytics,
  marketing: MarketingAnalytics,
  content: ContentAnalytics,
  finance: FinanceAnalytics,
): CompanyHealth {
  const depts: DepartmentScore[] = [
    { id: "sales",     name: "Sales",     score: sales.score,     status: status(sales.score),     trend: sales.score >= 60 ? "up" : "down",     keyMetric: `${sales.totalLeads} лидов`,               weight: 30 },
    { id: "marketing", name: "Marketing", score: marketing.score, status: status(marketing.score), trend: marketing.score >= 60 ? "stable" : "down", keyMetric: `${marketing.leads} лидов из маркетинга`, weight: 25 },
    { id: "content",   name: "Content",   score: content.score,   status: status(content.score),   trend: "up",                                  keyMetric: `${content.totalViews.toLocaleString()} просмотров`, weight: 20 },
    { id: "finance",   name: "Finance",   score: finance.score,   status: status(finance.score),   trend: "stable",                              keyMetric: finance.connected ? `${finance.revenue.toLocaleString()}₽` : "Нет данных", weight: 25 },
  ];

  const weighted = depts.reduce((s, d) => s + d.score * d.weight / 100, 0);
  const totalScore = Math.round(weighted);
  const healthStatus = totalScore >= 90 ? "GOOD" : totalScore >= 60 ? "WARNING" : "CRITICAL";

  const positives: string[] = [];
  const problems: string[] = [];

  if (content.score >= 80)   positives.push(`Контент-отдел GOOD (${content.score}/100) — выпуск регулярный`);
  if (marketing.visitors > 5000) positives.push(`Трафик ${marketing.visitors.toLocaleString()} визитов / мес`);
  if (content.shorts >= 15)  positives.push(`Shorts активен — ${content.shorts} роликов`);

  if (sales.staleLeads > 2)  problems.push(`${sales.staleLeads} лидов без активности >7 дней`);
  if (marketing.cpl > 2500)  problems.push(`CPL ${marketing.cpl}₽ выше целевых 2000₽`);
  if (!finance.connected)    problems.push("Finance Module не подключён — нет данных о выручке");
  if (sales.conversion < 5)  problems.push(`Конверсия ${sales.conversion}% ниже нормы 10%`);

  return {
    score: totalScore,
    status: healthStatus,
    trend: totalScore >= 65 ? "up" : "stable",
    departments: depts,
    positives,
    problems,
  };
}

// ── BI Insight detection ───────────────────────────────────────────────────

export function detectInsights(
  sales: SalesAnalytics,
  marketing: MarketingAnalytics,
  content: ContentAnalytics,
  finance: FinanceAnalytics,
): BIInsight[] {
  const insights: BIInsight[] = [];

  // P1: HOT leads stale
  if (sales.hotLeads > 0 && sales.staleLeads > 1) {
    insights.push({
      id: "bi_hot_stale",
      type: "problem",
      title: "Горячие лиды зависают без обработки",
      description: `HOT лидов в базе: ${sales.hotLeads}. Из них ${sales.staleLeads} без активности более 7 дней. Каждый день промедления снижает шанс конверсии на 15%.`,
      dataPoint: `HOT: ${sales.hotLeads} | Зависших: ${sales.staleLeads} | Конверсия: ${sales.conversion}%`,
      recommendation: "Sales Director: обработать все HOT лиды сегодня. Запустить Telegram-уведомления для Sales.",
      department: "Sales",
      priority: "HIGH",
      impact: "HIGH",
    });
  }

  // P2: Traffic/Leads gap
  if (marketing.visitors > 3000 && marketing.leads < 8) {
    const conv = ((marketing.leads / marketing.visitors) * 100).toFixed(2);
    insights.push({
      id: "bi_traffic_leads_gap",
      type: "problem",
      title: "Разрыв: трафик растёт, лиды не растут",
      description: `${marketing.visitors.toLocaleString()} визитов в месяц дают только ${marketing.leads} лидов. Конверсия сайта ${conv}% — критически низко для B2B.`,
      dataPoint: `Трафик: ${marketing.visitors.toLocaleString()} | Лиды: ${marketing.leads} | Конверсия: ${conv}%`,
      recommendation: "CRO-аудит сайта: добавить pop-up с калькулятором через 30 сек, улучшить CTA на главной.",
      department: "Marketing",
      priority: "HIGH",
      impact: "HIGH",
    });
  }

  // O1: SEO cheaper than Ads
  const organic = marketing.trafficSources.find(s => s.name === "organic");
  const paid    = marketing.trafficSources.find(s => ["yandex","google"].includes(s.name) && s.cpl > 0);
  if (organic && paid && organic.leads > 0 && organic.cpl < paid.cpl) {
    insights.push({
      id: "bi_seo_over_ads",
      type: "opportunity",
      title: "SEO дешевле рекламы — масштабировать контент",
      description: `Органический лид стоит 0₽, платный — ${paid.cpl}₽. SEO генерирует ${organic.leads} лидов без рекламного бюджета.`,
      dataPoint: `SEO CPL: 0₽ | Ads CPL: ${paid.cpl}₽ | SEO лидов: ${organic.leads}`,
      recommendation: "Увеличить производство SEO-статей с 1 до 4 в месяц. ROI от SEO превысит ROI рекламы.",
      department: "Content → Marketing",
      priority: "HIGH",
      impact: "HIGH",
    });
  }

  // O2: Shorts scaling
  if (content.shorts < 30 && content.totalViews > 50000) {
    insights.push({
      id: "bi_shorts_scale",
      type: "opportunity",
      title: "YouTube Shorts: потенциал роста ×3",
      description: `${content.shorts} Shorts дают ${content.totalViews.toLocaleString()} просмотров. При выходе 1 Shorts/день охват вырастет в 3 раза.`,
      dataPoint: `Shorts: ${content.shorts} | Просмотры: ${content.totalViews.toLocaleString()} | Среднее: ${Math.round(content.totalViews / Math.max(content.shorts, 1)).toLocaleString()}/ролик`,
      recommendation: "Запустить ежедневный Shorts AI. Использовать готовый пул из 10 сценариев.",
      department: "Content",
      priority: "MEDIUM",
      impact: "HIGH",
    });
  }

  // T1: Kazakhstan growth
  insights.push({
    id: "bi_kz_growth",
    type: "opportunity",
    title: "Казахстанское направление: незакрытый спрос",
    description: "Запросы «импорт из Китая Казахстан» растут на 65% YoY. Конкуренция низкая — специализированного контента почти нет.",
    dataPoint: "Рост запросов КЗ: +65% | Позиция статьи: #31 | Объём: 1 200 запросов/мес",
    recommendation: "Создать отдельный лендинг + 3 статьи под КЗ-рынок. Таргет: предприниматели Казахстана.",
    department: "Content → Sales",
    priority: "MEDIUM",
    impact: "HIGH",
  });

  // T2: Telegram monetization
  if (content.telegramPosts >= 100) {
    insights.push({
      id: "bi_telegram_mono",
      type: "trend",
      title: "Telegram-аудитория растёт, лиды не конвертируются",
      description: "Канал с активной аудиторией, но без системного CTA. Подписчики не превращаются в клиентов.",
      dataPoint: `Постов: ${content.telegramPosts} | Лидов из Telegram: 2-4/мес | Конверсия: ~0.1%`,
      recommendation: "Добавить CTA в каждый пост. Тест: pinned-пост с калькулятором + 1 продающий пост/нед.",
      department: "Content → Sales",
      priority: "MEDIUM",
      impact: "MEDIUM",
    });
  }

  // T3: Finance not connected
  if (!finance.connected) {
    insights.push({
      id: "bi_finance_blind",
      type: "problem",
      title: "Финансовый blindspot — нет данных о выручке",
      description: "CEO AI принимает решения без данных о Revenue, Profit и ROI. Невозможно приоритизировать каналы по прибыльности.",
      dataPoint: "Revenue: 0 | Profit: 0 | Finance Module: не подключён",
      recommendation: "Подключить Finance Module к n8n. Начать вносить сделки в таблицу finance_orders.",
      department: "Operations → Finance",
      priority: "HIGH",
      impact: "HIGH",
    });
  }

  // Sort by impact then priority
  const impScore = (i: BIInsight) =>
    (i.impact === "HIGH" ? 3 : i.impact === "MEDIUM" ? 2 : 1) * 10 +
    (i.priority === "HIGH" ? 3 : i.priority === "MEDIUM" ? 2 : 1);

  return insights.sort((a, b) => impScore(b) - impScore(a));
}
