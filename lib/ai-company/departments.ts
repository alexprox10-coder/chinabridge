import type { DepartmentReport, KPIMetric, AgentInfo, CompanyMetrics } from "./types";
import { getDeletedLeadIds } from "@/lib/import-leads/status-store";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";

async function fetchTableRows(tableId: string): Promise<Record<string, unknown>[]> {
  if (!tableId || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json) ? json : (json.rows ?? json.data ?? []);
  } catch {
    return [];
  }
}

function agent(name: string, fn: string, connected: boolean): AgentInfo {
  return { name, function: fn, connected };
}

function kpi(label: string, value: string | number, target?: string | number, trend?: "up" | "down" | "stable"): KPIMetric {
  return { label, value, target, trend };
}

function idleReport(id: string, name: string, nameRu: string, icon: string, agents: AgentInfo[]): DepartmentReport {
  return {
    id, name, nameRu, director: `${nameRu} AI Director`, icon,
    status: "IDLE",
    kpis: [{ label: "Статус", value: "Агент не подключён" }],
    agents,
    problems: ["Отдел не подключён к системе данных"],
    recommendations: ["Подключить агента для получения реальных данных"],
    lastUpdated: new Date().toISOString(),
  };
}

// --- SALES ---
async function buildSalesDept(): Promise<DepartmentReport> {
  const [rawLeads, deletedIds] = await Promise.all([
    fetchTableRows(process.env.N8N_IMPORT_LEADS_TABLE_ID ?? ""),
    getDeletedLeadIds().catch(() => new Set<string>()),
  ]);
  const leads = rawLeads.filter(r => {
    const lid = String(r.lead_id ?? "");
    const synth = !lid && r.id != null ? `n8n_${r.id}` : lid;
    return !synth || !deletedIds.has(synth);
  });
  const total = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const contacted = leads.filter(l => l.status === "contacted" || l.status === "approved").length;
  const highScore = leads.filter(l => Number(l.score) >= 4).length;
  const conv = total > 0 ? Math.round((contacted / total) * 100) : 0;

  const status = total >= 20 ? "GOOD" : total >= 5 ? "WARNING" : "CRITICAL";

  return {
    id: "sales",
    name: "Sales Department",
    nameRu: "Отдел продаж",
    director: "Sales Director AI",
    icon: "💼",
    status,
    kpis: [
      kpi("Лидов в базе", total, 30, total > 10 ? "up" : "down"),
      kpi("Новых лидов", newLeads),
      kpi("Высокий рейтинг (4-5⭐)", highScore),
      kpi("Конверсия в контакт", `${conv}%`, "20%"),
    ],
    agents: [
      agent("Import Client Finder", "Поиск B2B импортёров через Firecrawl", true),
      agent("Platform Sales Finder", "Поиск на маркетплейсах", false),
      agent("CRM AI", "Ведение сделок и статусов", false),
      agent("Follow-up AI", "Автодоработка холодных лидов", false),
    ],
    problems: total < 5 ? ["Критически мало лидов в базе"] : contacted < 2 ? ["Нет обработанных лидов"] : [],
    recommendations: total < 5
      ? ["Немедленно запустить Import Client Finder"]
      : [`Обработать ${highScore} лидов с рейтингом 4-5 в первую очередь`],
    lastUpdated: new Date().toISOString(),
  };
}

// --- ANALYTICS ---
async function buildAnalyticsDept(): Promise<DepartmentReport> {
  try {
    const { fetchAnalyticsData } = await import("./analytics/data");
    const { health, sales, marketing, content, finance, insights } = await fetchAnalyticsData();
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    const topInsight = insights[0];
    return {
      id: "analytics",
      name: "Analytics Department",
      nameRu: "Аналитика",
      director: "Analytics Director AI",
      icon: "📊",
      status,
      kpis: [
        kpi("Company Health Score", `${health.score}/100`, "90/100", health.trend),
        kpi("Лидов (Sales)", sales.totalLeads, 20, sales.totalLeads >= 10 ? "up" : "down"),
        kpi("CPL (Marketing)", `${marketing.cpl}₽`, "2000₽", marketing.cpl <= 2000 ? "up" : "down"),
        kpi("BI Сигналов", insights.length),
      ],
      agents: [
        agent("Company Health AI", "Расчёт Health Score по 4 отделам", true),
        agent("BI Intelligence AI", "Детекция паттернов и инсайтов", true),
        agent("Sales Analytics AI", "Анализ лидов и конверсии", sales.totalLeads > 0),
        agent("Finance Analytics AI", "P&L и unit-экономика", finance.connected),
      ],
      problems: [
        ...health.problems.slice(0, 2),
        ...(topInsight ? [`BI: ${topInsight.title}`] : []),
      ].slice(0, 3),
      recommendations: [`Health Score: ${health.score}/100 — ${health.status === "GOOD" ? "компания растёт" : "требуется внимание CEO"}`],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("analytics", "Analytics Department", "Аналитика", "📊", [
      agent("Company Health AI", "Расчёт Health Score", false),
      agent("BI Intelligence AI", "Детекция инсайтов", false),
      agent("Sales Analytics AI", "Анализ лидов", false),
      agent("Finance Analytics AI", "P&L и unit-экономика", false),
    ]);
  }
}

// --- OPERATIONS ---
async function buildOperationsDept(): Promise<DepartmentReport> {
  try {
    const { fetchOperationsData } = await import("./operations/data");
    const { generateOperationsDirectorReport } = await import("./operations/director");
    const { deals, partners, cargos, documents, clients, kpis, health, risks } =
      await fetchOperationsData();
    const report = await generateOperationsDirectorReport(
      health, kpis, deals, partners, cargos, documents, clients, risks,
    );
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    return {
      id: "operations",
      name: "Operations Department",
      nameRu: "Операции",
      director: "Operations Director AI",
      icon: "⚙️",
      status,
      kpis: [
        kpi("Активных сделок", kpis.activeDeals, 10, "stable"),
        kpi("Грузов в пути",   kpis.inLogistics),
        kpi("Проблем",         kpis.problems, 0, kpis.problems > 0 ? "down" : "up"),
        kpi("Health Score",    `${health.score}/100`),
      ],
      agents: [
        agent("Client Success AI", "Контроль клиентов после продажи", true),
        agent("China Partner AI",  "Контроль поставщиков",            true),
        agent("Logistics AI",      "Грузы, маршруты, сроки",          true),
        agent("Documents AI",      "Документы и таможня",             true),
        agent("Risk Monitor AI",   "Обнаружение рисков и проблем",    risks.length > 0),
      ],
      problems: health.risks.slice(0, 2),
      recommendations: [report.topAction ? report.topAction : `Health: ${health.score}/100`],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("operations", "Operations Department", "Операции", "⚙️", [
      agent("Client Success AI", "Контроль клиентов", false),
      agent("China Partner AI",  "Контроль поставщиков", false),
      agent("Logistics AI",      "Грузы и маршруты", false),
      agent("Documents AI",      "Документы и таможня", false),
      agent("Risk Monitor AI",   "Риски и проблемы", false),
    ]);
  }
}

// --- MARKETING ---
async function buildMarketingDept(): Promise<DepartmentReport> {
  try {
    const { fetchMarketingData } = await import("./marketing/data");
    const { kpis, health } = await fetchMarketingData();
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    return {
      id: "marketing",
      name: "Marketing Department",
      nameRu: "Маркетинг",
      director: "Marketing Director AI",
      icon: "📣",
      status,
      kpis: [
        kpi("Посетители / мес", kpis.visitors.toLocaleString("ru"), undefined, kpis.trafficSources[0]?.trend),
        kpi("Лидов из маркетинга", kpis.leads, 20),
        kpi("CPL средний", `${kpis.costPerLead}₽`, "2000₽", kpis.costPerLead <= 2000 ? "up" : "down"),
        kpi("Лучший канал", kpis.bestChannel),
      ],
      agents: [
        agent("Ads AI",     "Яндекс Директ + Google Ads", kpis.trafficSources.some(s => s.name === "yandex" || s.name === "google")),
        agent("SEO AI",     "Органический трафик и блог",  true),
        agent("Channel AI", "Telegram, VK, YouTube, MAX",  true),
        agent("Traffic AI", "Атрибуция и аналитика",       kpis.trafficSources.length >= 3),
      ],
      problems: health.reasons.filter((_, i) => i < 2),
      recommendations: [`Health Score: ${health.score}/100 — ${health.status === "GOOD" ? "маркетинг работает стабильно" : "требуется внимание"}`],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("marketing", "Marketing Department", "Маркетинг", "📣", [
      agent("Ads AI",     "Управление рекламой Яндекс/VK", false),
      agent("SEO AI",     "Контент и оптимизация",          false),
      agent("Channel AI", "Telegram, VK, YouTube",          false),
    ]);
  }
}

// --- CONTENT ---
async function buildContentDept(): Promise<DepartmentReport> {
  try {
    const { fetchContentData } = await import("./content/data");
    const { kpis, health } = await fetchContentData();
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    return {
      id: "content",
      name: "Content Department",
      nameRu: "Контент",
      director: "Content Director AI",
      icon: "🎬",
      status,
      kpis: [
        kpi("Материалов создано", kpis.totalMaterials, 200),
        kpi("Просмотров",          kpis.totalViews.toLocaleString("ru")),
        kpi("Подписчиков",         kpis.subscribers.toLocaleString("ru")),
        kpi("Shorts",              kpis.shorts, 30),
      ],
      agents: [
        agent("SEO AI",      "Статьи и органический трафик", true),
        agent("Telegram AI", "Посты и контент-план",          true),
        agent("YouTube AI",  "Видео и сценарии",              true),
        agent("Shorts AI",   "Ежедневные Shorts-идеи",        true),
        agent("Image AI",    "Промпты для изображений",       true),
      ],
      problems: health.reasons.filter(r => !r.includes("регулярно")).slice(0, 2),
      recommendations: [`Health Score: ${health.score}/100 — ${health.status === "GOOD" ? "контент выходит регулярно" : "требуется масштабирование"}`],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("content", "Content Department", "Контент", "🎬", [
      agent("Telegram AI", "Посты и контент-план", false),
      agent("YouTube AI",  "Видео-стратегия",      false),
      agent("Shorts AI",   "Shorts-идеи",           false),
      agent("Image AI",    "Генерация визуалов",    false),
    ]);
  }
}

// --- FINANCE ---
async function buildFinanceDept(): Promise<DepartmentReport> {
  try {
    const { fetchFinanceData } = await import("./finance/data");
    const { generateFinanceDirectorReport } = await import("./finance/director");
    const { revenue, costs, profit, unitEconomics, forecast, saas, health } =
      await fetchFinanceData();
    const report = await generateFinanceDirectorReport(
      health, revenue, costs, profit, unitEconomics, forecast, saas,
    );
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    return {
      id: "finance",
      name: "Finance Department",
      nameRu: "Финансы",
      director: "Finance Director AI",
      icon: "💼",
      status,
      kpis: [
        kpi("Выручка / мес", revenue.total > 1_000_000 ? `${(revenue.total / 1_000_000).toFixed(1)}млн₽` : revenue.total > 0 ? `${Math.round(revenue.total / 1000)}К₽` : "—", undefined, revenue.growth > 0 ? "up" : "stable"),
        kpi("Маржа", `${profit.margin}%`, "20%", profit.margin >= 20 ? "up" : "down"),
        kpi("LTV/CAC", `${unitEconomics.ltvToCac}x`, "3x", unitEconomics.ltvToCac >= 3 ? "up" : "down"),
        kpi("Health Score", `${health.score}/100`),
      ],
      agents: [
        agent("Revenue AI",        "Анализ выручки и продаж",        true),
        agent("Cost AI",           "Контроль расходов и бюджета",     true),
        agent("Profit AI",         "P&L и маржинальность",            true),
        agent("Forecast AI",       "Прогнозирование финансов",        true),
        agent("Unit Economics AI", "CAC, LTV, ARPU, Payback",         true),
        agent("Financial Analyst AI", "CEO финансовые отчёты",        true),
      ],
      problems: health.problems.slice(0, 2),
      recommendations: [report.ceoSummary.topDecision],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("finance", "Finance Department", "Финансы", "💼", [
      agent("Revenue AI",        "Анализ выручки", false),
      agent("Cost AI",           "Контроль расходов", false),
      agent("Profit AI",         "P&L", false),
      agent("Forecast AI",       "Прогнозирование", false),
      agent("Unit Economics AI", "CAC, LTV, ARPU", false),
    ]);
  }
}

// --- CLIENT SUCCESS (idle) ---
function buildClientSuccessDept(): DepartmentReport {
  return idleReport("client_success", "Client Success", "Клиентский сервис", "❤️", [
    agent("Onboarding AI", "Онбординг новых клиентов", false),
    agent("Support AI", "Ответы на вопросы", false),
    agent("Retention AI", "Удержание и апселл", false),
  ]);
}

// --- PRODUCT (idle) ---
function buildProductDept(): DepartmentReport {
  return idleReport("product", "Product Department", "Продукт", "🚀", [
    agent("Roadmap AI", "Планирование функций", false),
    agent("Pricing AI", "Тарифы и упаковка", false),
    agent("UX Research AI", "Анализ поведения пользователей", false),
  ]);
}

// --- STRATEGY ---
async function buildStrategyDept(): Promise<DepartmentReport> {
  try {
    const { fetchStrategyData } = await import("./strategy/data");
    const { generateStrategyDirectorReport } = await import("./strategy/director");
    const data   = fetchStrategyData();
    const report = await generateStrategyDirectorReport(data);
    const { health } = data;
    const status = health.status as "GOOD" | "WARNING" | "CRITICAL";
    const topOpp = [...data.opportunities].sort((a, b) => b.score - a.score)[0];
    return {
      id: "strategy",
      name: "Strategy & Innovation",
      nameRu: "Стратегия",
      director: "Strategy Director AI",
      icon: "🔭",
      status,
      kpis: [
        kpi("Health Score",   `${health.score}/100`),
        kpi("Возможностей",   health.opportunitiesCount, undefined, "up"),
        kpi("Лучший рынок",   [...data.markets].sort((a, b) => b.score - a.score)[0]?.name ?? "—"),
        kpi("SaaS Readiness", `${report.ceoInsight.saasReadiness}%`),
      ],
      agents: [
        agent("Market Research AI",  "Анализ рынков СНГ",              true),
        agent("Competitor AI",        "Мониторинг конкурентов",          true),
        agent("Opportunity AI",       "Поиск возможностей роста",        true),
        agent("Product Innovation AI","Идеи продуктов и фич",            true),
        agent("Growth Strategy AI",   "90-дневный план роста",           true),
        agent("Trend Monitor AI",     "Тренды AI / Логистика / Законы",  true),
      ],
      problems: health.risks.slice(0, 2),
      recommendations: [report.ceoInsight.topDecision],
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return idleReport("strategy", "Strategy & Innovation", "Стратегия", "🔭", [
      agent("Market Research AI",   "Анализ рынков",      false),
      agent("Competitor AI",         "Конкуренты",          false),
      agent("Opportunity AI",        "Возможности роста",   false),
      agent("Growth Strategy AI",    "План роста 90 дней",  false),
    ]);
  }
}

export async function buildAllDepartments(): Promise<DepartmentReport[]> {
  const [sales, analytics, marketing, content, operations, finance, strategy] = await Promise.all([
    buildSalesDept(),
    buildAnalyticsDept(),
    buildMarketingDept(),
    buildContentDept(),
    buildOperationsDept(),
    buildFinanceDept(),
    buildStrategyDept(),
  ]);

  return [
    sales,
    marketing,
    content,
    analytics,
    operations,
    finance,
    strategy,
    buildClientSuccessDept(),
    buildProductDept(),
  ];
}

export async function buildCompanyMetrics(departments: DepartmentReport[]): Promise<CompanyMetrics> {
  const salesDept = departments.find(d => d.id === "sales");
  const leadsKpi = salesDept?.kpis.find(k => k.label === "Лидов в базе");
  const leads = Number(leadsKpi?.value ?? 0);

  const opsDept = departments.find(d => d.id === "operations");
  const dealsKpi = opsDept?.kpis.find(k => k.label === "Активных сделок");
  const activeDeals = Number(dealsKpi?.value ?? 0);

  return {
    revenue: 0,
    profit: 0,
    leads,
    conversion: leads > 0 ? 18 : 0,
    traffic: 0,
    customers: 0,
    activeDeals,
  };
}
