# Graph Report - chinabridge  (2026-08-14)

## Corpus Check
- 597 files · ~907,398 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3366 nodes · 6646 edges · 215 communities (177 shown, 38 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79304550`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content/db.ts
- marketing/db.ts
- partner-portal/api.ts
- FinanceDashboard.tsx
- content/data.ts
- analytics/data.ts
- OperationsDashboard.tsx
- strategy/data.ts
- MarketingDashboard.tsx
- isAuthorized
- ContentPageClient.tsx
- lib/finance/types.ts
- finance/settings/page.tsx
- integrations/page.tsx
- CategoryPage.tsx
- Footer.tsx
- LeadDetail.tsx
- rate-engine/db.ts
- crm/client.ts
- ceo/report/route.ts
- import-leads/types.ts
- sales/data.ts
- ai-cto/index.ts
- CeoDashboard.tsx
- app/services/page.tsx
- OnboardingWizard.tsx
- api/leads/route.ts
- store.ts
- trackGAEvent
- app/page.tsx
- compilerOptions
- client-portal/api.ts
- document.tsx
- AiOsDashboard.tsx
- rate-engine/types.ts
- check/route.ts
- client-portal/types.ts
- agents/index.ts
- market-intelligence/types.ts
- documents/types.ts
- ai-cto/types.ts
- calculator/types.ts
- blog/[slug]/page.tsx
- import-leads/crm.ts
- pricing/page.tsx
- devDependencies
- MarketingPageClient.tsx
- rates/route.ts
- AIEconomicsFunnel.tsx
- analytics/index.ts
- getLLMConfig
- Breadcrumbs.tsx
- dependencies
- ImportLead
- tenants/route.ts
- market-intelligence/db.ts
- crm/auth.ts
- getLeads
- deal-intelligence/index.ts
- ai/types.ts
- CreateWizard.tsx
- memory.ts
- client-portal/auth.ts
- market-radar/index.ts
- rate-calculator.ts
- FAQSection.tsx
- seed-runner.ts
- ai-funnel/submit/route.ts
- client/dashboard/page.tsx
- partners/db.ts
- client/calculator/page.tsx
- UnifiedLeadsDashboard.tsx
- payments/create/route.ts
- KnowledgeUI.tsx
- lead-finder/index.ts
- SeoClustersClient.tsx
- free-guide.tsx
- url-parser.ts
- ai-cto/db.ts
- setup/route.ts
- proposals/create/route.ts
- AnalyticsProvider.tsx
- departments.ts
- reports/page.tsx
- proposals/page.tsx
- VkAdsDashboard.tsx
- proposals/types.ts
- calculator.ts
- ai-company/page.tsx
- ai-sales-agent/route.ts
- sync/route.ts
- LeadMagnetForm.tsx
- WbSellersClient.tsx
- calculator/route.ts
- market-intelligence/leads/route.ts
- SupplierFinderUI.tsx
- HhLeadsClient.tsx
- placements/page.tsx
- PlatformDashboard.tsx
- generator.ts
- fix/route.ts
- AuditClient.tsx
- import-audit/page.tsx
- telegram.ts
- scripts
- CtoDashboard.tsx
- admin/dashboard/page.tsx
- finance/api.ts
- articles/route.ts
- isAdminOnly
- presentation/page.tsx
- tenant-auth.ts
- campaigns/page.tsx
- faq/page.tsx
- ChatWidget.tsx
- leads/[id]/page.tsx
- AdminNav.tsx
- client/calculations/page.tsx
- signup/route.ts
- fulfilment/page.tsx
- app/platform/page.tsx
- settings/marketing/page.tsx
- Marketplace.tsx
- tenant-storage.ts
- seed-db.ts
- billing/route.ts
- getSession
- vk-ads/campaigns/route.ts
- client/layout.tsx
- PartnersDashboard.tsx
- SignupForm.tsx
- crm-debug/route.ts
- admin/calculations/page.tsx
- audit/route.ts
- notifications/route.ts
- content-publish/route.ts
- free/route.ts
- economics/route.ts
- demo/documents/page.tsx
- knowledge/chat/route.ts
- requisites/page.tsx
- AiSettings.tsx
- BillingCenter.tsx
- TochkaLinksSection.tsx
- database.ts
- payments.ts
- security.ts
- middleware.ts
- vercel.json
- product-finder/route.ts
- supplier-finder/route.ts
- client/page.tsx
- crm/page.tsx
- outreach-leads/page.tsx
- product-finder/page.tsx
- ai-providers.ts
- checks/api.ts
- checks/crm.ts
- seo.ts
- china-kazakhstan/page.tsx
- inspection/page.tsx
- migrate/route.ts
- ai/route.ts
- marketing-ai/route.ts
- client/login/page.tsx
- demo/finance/page.tsx
- china-delivery/page.tsx
- backup/page.tsx
- fonts.ts
- query-approved.mjs
- cleanup/leads/route.ts
- test/route.ts
- export/route.ts
- import/route.ts
- complete/route.ts
- demo-request/route.ts
- demo/calculator/page.tsx
- demo/page.tsx
- partner/page.tsx
- icon.tsx
- BackLink.tsx
- SaaSPlatformBlock.tsx
- import-leads/page.tsx
- admin/layout.tsx
- market-intelligence/leads/page.tsx
- client/auth/google/route.ts
- partner/auth/google/route.ts
- translate/route.ts
- vk-ads/callback/route.ts
- client/profile/page.tsx
- demo/layout.tsx
- AiCompanyOsBlock.tsx
- Process.tsx
- validation.ts
- drizzle-orm
- lucide-react
- pdftest/route.ts
- next.config.ts
- postgres
- react-hook-form
- @supabase/supabase-js
- tailwind-merge
- postcss.config.mjs
- tailwind.config.ts
- @neondatabase/serverless

## God Nodes (most connected - your core abstractions)
1. `isAuthorized()` - 85 edges
2. `AdminNav()` - 51 edges
3. `getDb()` - 38 edges
4. `getSession()` - 32 edges
5. `createLead()` - 29 edges
6. `bootstrap()` - 21 edges
7. `getSql()` - 21 edges
8. `bootstrap()` - 20 edges
9. `getSql()` - 20 edges
10. `Breadcrumbs()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `LeadPage()` --calls--> `getLead()`  [EXTRACTED]
  app/admin/leads/[id]/page.tsx → lib/crm/client.ts
- `GET()` --calls--> `isAuthorized()`  [EXTRACTED]
  app/api/billing/route.ts → lib/api-auth.ts
- `POST()` --calls--> `isAuthorized()`  [EXTRACTED]
  app/api/billing/route.ts → lib/api-auth.ts
- `ClientLayout()` --calls--> `getSession()`  [EXTRACTED]
  app/client/layout.tsx → lib/client-portal/auth.ts
- `GET()` --calls--> `isAuthorized()`  [EXTRACTED]
  app/api/admin/crm-debug/route.ts → lib/api-auth.ts

## Import Cycles
- None detected.

## Communities (215 total, 38 thin omitted)

### Community 0 - "content/db.ts"
Cohesion: 0.06
Nodes (86): GET(), PATCH(), POST(), requireAdmin(), runtime, DEMO_FUNNEL, GET(), requireAdmin() (+78 more)

### Community 1 - "marketing/db.ts"
Cohesion: 0.06
Nodes (85): buildDemoChannel(), buildRealDbChannel(), CrmStats, DEMO_CHANNELS, DemoChannel, GET(), getCrmStats(), getSql() (+77 more)

### Community 2 - "partner-portal/api.ts"
Cohesion: 0.05
Nodes (65): GET(), runtime, setPartnerCookie(), POST(), runtime, POST(), runtime, GET() (+57 more)

### Community 3 - "FinanceDashboard.tsx"
Cohesion: 0.06
Nodes (60): CostTab(), DirectorTab(), FinanceDashboard(), fmt(), fmtM(), ForecastTab(), OverviewTab(), priorityBadge() (+52 more)

### Community 4 - "content/data.ts"
Cohesion: 0.06
Nodes (51): CHANNEL_COLORS, ContentDashboard(), PRI, Props, SOURCE_LABEL, STATUS_STYLE, TABS, TYPE_ICONS (+43 more)

### Community 5 - "analytics/data.ts"
Cohesion: 0.07
Nodes (48): AnalyticsDashboard(), BITab(), insightIcon(), OverviewTab(), priorityBadge(), RecsTab(), statusBg(), statusColor() (+40 more)

### Community 6 - "OperationsDashboard.tsx"
Cohesion: 0.07
Nodes (50): DEAL_STATUS_COLOR, DEAL_STATUS_LABEL, DirectorTab(), DOC_STATUS_COLOR, DOC_STATUS_LABEL, DOC_TYPE_LABEL, OperationsDashboard(), OverviewTab() (+42 more)

### Community 7 - "strategy/data.ts"
Cohesion: 0.06
Nodes (42): dynamic, loadReport(), StrategyPage(), IMPACT_CFG, POTENTIAL_CFG, PRIORITY_CFG, Props, StrategyDashboard() (+34 more)

### Community 8 - "MarketingDashboard.tsx"
Cohesion: 0.07
Nodes (44): MarketingDashboard(), PLATFORM_STYLE, PRIORITY_STYLE, Props, STATUS_STYLE, TABS, dynamic, loadReport() (+36 more)

### Community 9 - "isAuthorized"
Cohesion: 0.07
Nodes (35): POST(), dynamic, GET(), runtime, dynamic, GET(), runtime, GET() (+27 more)

### Community 10 - "ContentPageClient.tsx"
Cohesion: 0.08
Nodes (35): CHIP_COLORS, ContentCalendarPage(), dayKey(), parseTimes(), Post, postDate(), Schedule, WEEKDAYS (+27 more)

### Community 11 - "lib/finance/types.ts"
Cohesion: 0.09
Nodes (33): dynamic, FinanceExpensesPage(), fmtDate(), revalidate, dynamic, FinanceOrdersPage(), fmtDate(), revalidate (+25 more)

### Community 12 - "finance/settings/page.tsx"
Cohesion: 0.17
Nodes (13): dynamic, FinanceSettingsPage(), revalidate, dynamic, GET(), PUT(), runtime, FinanceSettingsForm() (+5 more)

### Community 13 - "integrations/page.tsx"
Cohesion: 0.40
Nodes (3): IntegrationsClient(), STATIC_INTEGRATIONS, VkStatus

### Community 14 - "CategoryPage.tsx"
Cohesion: 0.07
Nodes (15): metadata, metadata, metadata, metadata, metadata, metadata, metadata, metadata (+7 more)

### Community 15 - "Footer.tsx"
Cohesion: 0.09
Nodes (22): jsonLd, metadata, metadata, metadata, FAQS, metadata, STEPS, generateMetadata() (+14 more)

### Community 16 - "LeadDetail.tsx"
Cohesion: 0.14
Nodes (17): ALL_STATUSES, COLUMNS, LeadCard(), msAgo(), timeLabel(), ALL_PRIORITIES, ALL_STATUSES, MainTab (+9 more)

### Community 17 - "rate-engine/db.ts"
Cohesion: 0.09
Nodes (26): DELETE(), runtime, DELETE(), runtime, POST(), runtime, DELETE(), runtime (+18 more)

### Community 18 - "crm/client.ts"
Cohesion: 0.13
Nodes (23): DELETE(), dynamic, GET(), PATCH(), runtime, escapeNonAscii(), POST(), runtime (+15 more)

### Community 19 - "ceo/report/route.ts"
Cohesion: 0.11
Nodes (25): calcHealth(), GET(), maxDuration, runtime, toSummary(), generateDecisions(), toPriority(), buildFallback() (+17 more)

### Community 20 - "import-leads/types.ts"
Cohesion: 0.10
Nodes (34): POST(), runtime, GET(), maxDuration, POST(), QUICK_OVERRIDES, runtime, analyzeWebsite() (+26 more)

### Community 21 - "sales/data.ts"
Cohesion: 0.07
Nodes (40): dynamic, loadReport(), metadata, SalesPage(), PRIO, Priority, SalesDashboard(), Tab (+32 more)

### Community 22 - "ai-cto/index.ts"
Cohesion: 0.21
Nodes (12): maxDuration, POST(), runtime, GET(), maxDuration, runtime, buildRecommendations(), buildSection() (+4 more)

### Community 23 - "CeoDashboard.tsx"
Cohesion: 0.10
Nodes (21): buildInbox(), CeoAiTab(), CeoDashboard(), DecisionsTab(), DEPT_LINKS, DeptsTab(), fmtDate(), fmtTime() (+13 more)

### Community 24 - "app/services/page.tsx"
Cohesion: 0.10
Nodes (17): CITIES, metadata, FAQ, metadata, schema, FAQ, metadata, schema (+9 more)

### Community 25 - "OnboardingWizard.tsx"
Cohesion: 0.07
Nodes (17): ACTIONS, ActionState, Company, CONFETTI_COLORS, CONFETTI_ITEMS, CREATING_ITEMS, DAILY_TASKS, DEPARTMENTS (+9 more)

### Community 26 - "api/leads/route.ts"
Cohesion: 0.18
Nodes (16): dynamic, notifyManagerTelegram(), POST(), REQUIRED, REQUIRES_PHONE, runtime, validate(), Lead (+8 more)

### Community 27 - "store.ts"
Cohesion: 0.08
Nodes (40): BillingPage(), dynamic, dynamic, TenantPage(), AI_LINKS, TenantDetail(), DELETE(), GET() (+32 more)

### Community 28 - "trackGAEvent"
Cohesion: 0.12
Nodes (17): GAInner(), DirectionsSplit(), checks, Hero(), HowItWorks(), STEPS, ImportEcosystemBlock(), partnerCards (+9 more)

### Community 29 - "app/page.tsx"
Cohesion: 0.12
Nodes (13): metadata, schemaOrg, Advantages, Directions, FAQ(), faqs, CARDS, ForWhom() (+5 more)

### Community 30 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 31 - "client-portal/api.ts"
Cohesion: 0.15
Nodes (20): dynamic, GET(), POST(), runtime, GET(), POST(), runtime, GET() (+12 more)

### Community 32 - "document.tsx"
Cohesion: 0.10
Nodes (10): DARK, GREY, LIGHT_GREY, RED, styles, WHITE, CONTACTS, COOPERATION_STEPS (+2 more)

### Community 33 - "AiOsDashboard.tsx"
Cohesion: 0.13
Nodes (16): PRIORITY_CONFIG, Props, STATUS_CONFIG, CeoAnalysis, CeoTask, AgentInfo, CeoRecommendation, CeoReport (+8 more)

### Community 34 - "rate-engine/types.ts"
Cohesion: 0.09
Nodes (23): BLANK, CARGO_TYPES, CURRENCIES, RATE_TYPES, SOURCE_BADGE, TRANSPORT_TYPES, BLANK, TRANSPORT_TYPES (+15 more)

### Community 35 - "check/route.ts"
Cohesion: 0.27
Nodes (13): GET(), maxDuration, runtime, ensureLinksTable(), POST(), runtime, sql, ensurePaymentsTable() (+5 more)

### Community 36 - "client-portal/types.ts"
Cohesion: 0.13
Nodes (9): ClientAccount, ClientDocument, ClientMessage, ClientRole, DOC_TYPE_LABELS, DocumentType, OrderStatus, OrderTracking (+1 more)

### Community 37 - "agents/index.ts"
Cohesion: 0.27
Nodes (16): runConsultant(), runAgent(), runLogistic(), runOperator(), runQualification(), runSales(), callLLM(), getLLMHistory() (+8 more)

### Community 38 - "market-intelligence/types.ts"
Cohesion: 0.12
Nodes (15): PIPE_COLORS, SOURCE_ICON, Tab, TEMP_COLORS, DEMO_SIGNALS, Tab, TAB_DEFS, TYPE_COLOR (+7 more)

### Community 39 - "documents/types.ts"
Cohesion: 0.06
Nodes (45): CompanySettingsPage(), dynamic, dynamic, PATCH(), runtime, dynamic, fetchRows(), GET() (+37 more)

### Community 40 - "ai-cto/types.ts"
Cohesion: 0.23
Nodes (10): checkPage(), checkPerformance(), PAGES, SectionDef, checkScore(), scoreSection(), WEIGHTS, CheckResult (+2 more)

### Community 41 - "calculator/types.ts"
Cohesion: 0.11
Nodes (21): ADVANTAGES, AI_STEPS, CalculatorForm(), CITY_CHIPS, initialFormData, inp(), CHAIN, CalculatorFormData (+13 more)

### Community 42 - "blog/[slug]/page.tsx"
Cohesion: 0.17
Nodes (14): BlogPage(), metadata, ArticlePage(), generateMetadata(), Props, renderContent(), sitemap(), ArticleCard() (+6 more)

### Community 43 - "import-leads/crm.ts"
Cohesion: 0.10
Nodes (32): dynamic, GET(), maxDuration, GET(), isAuthorized(), POST(), runtime, DELETE() (+24 more)

### Community 44 - "pricing/page.tsx"
Cohesion: 0.13
Nodes (23): BLANK, CUSTOMER_COLORS, CUSTOMER_LABELS, FilterKey, PricingPage(), RULE_LABELS, TRANSPORT_OPTIONS, calculateCostBreakdown() (+15 more)

### Community 45 - "devDependencies"
Cohesion: 0.09
Nodes (23): dotenv-cli, drizzle-kit, eslint, eslint-config-next, devDependencies, dotenv-cli, drizzle-kit, eslint (+15 more)

### Community 46 - "MarketingPageClient.tsx"
Cohesion: 0.11
Nodes (15): metadata, Analytics, Channel, fmtNum(), fmtPct(), fmtRub(), FunnelStep, KPI (+7 more)

### Community 47 - "rates/route.ts"
Cohesion: 0.50
Nodes (3): POST(), runtime, validateShippingRate()

### Community 48 - "AIEconomicsFunnel.tsx"
Cohesion: 0.13
Nodes (17): AIEconomicsFunnel(), ANALYZE_STAGES, CITY_CHIPS, CorrectionData, EMPTY_CORRECTION, EMPTY_PRODUCT, estimateSalePrice(), ExtractedProduct (+9 more)

### Community 49 - "analytics/index.ts"
Cohesion: 0.24
Nodes (9): YandexMetrika(), Cases, Services, analytics, fire(), METRIKA_ID, reachGoal(), trackMetrikaPageView() (+1 more)

### Community 50 - "getLLMConfig"
Cohesion: 0.12
Nodes (22): ensureTable(), GET(), POST(), POST(), auth(), GET(), getDynamicKeywords(), POST() (+14 more)

### Community 51 - "Breadcrumbs.tsx"
Cohesion: 0.11
Nodes (9): metadata, FAQ, metadata, schema, metadata, metadata, Breadcrumbs(), BreadcrumbsProps (+1 more)

### Community 52 - "dependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, clsx, framer-motion, @hookform/resolvers, next, dependencies, autoprefixer, clsx (+13 more)

### Community 53 - "ImportLead"
Cohesion: 0.12
Nodes (12): IMPORTS_LABELS, Props, SCORE_COLORS, STATUS_LABELS, STATUS_STYLES, ACTION_ICON, AiSalesAgentClient(), Recommendation (+4 more)

### Community 54 - "tenants/route.ts"
Cohesion: 0.24
Nodes (10): GET(), maxDuration, runtime, GET(), isSuperAdmin(), maxDuration, POST(), runtime (+2 more)

### Community 55 - "market-intelligence/db.ts"
Cohesion: 0.22
Nodes (19): dynamic, MarketIntelligencePage(), GET(), dynamic, GET(), getTenantId(), POST(), runtime (+11 more)

### Community 56 - "crm/auth.ts"
Cohesion: 0.24
Nodes (12): POST(), runtime, POST(), runtime, createSessionToken(), createTenantSessionToken(), getKey(), hashPin() (+4 more)

### Community 57 - "getLeads"
Cohesion: 0.47
Nodes (8): DashboardPage(), auth(), ensureTable(), GET(), POST(), GET(), getDashboardStats(), getLeads()

### Community 58 - "deal-intelligence/index.ts"
Cohesion: 0.12
Nodes (15): ALERT_COLORS, RISK_COLORS, dynamic, GET(), getTenantId(), runtime, analyzeDealIntelligence(), calcForecast() (+7 more)

### Community 59 - "ai/types.ts"
Cohesion: 0.16
Nodes (16): AgentBadge(), CONFIG, ChatInput(), Props, ChatMessage(), Props, Message, Props (+8 more)

### Community 60 - "CreateWizard.tsx"
Cohesion: 0.08
Nodes (22): BillingClient(), Plan, PLAN_BTN, PLAN_COLOR, AI_MODULES, COUNTRIES, CreateWizard(), CURRENCIES (+14 more)

### Community 61 - "memory.ts"
Cohesion: 0.27
Nodes (11): dynamic, POST(), runtime, AGENT_LABELS, addMessage(), doHandoff(), getOrCreate(), markLeadSent() (+3 more)

### Community 62 - "client-portal/auth.ts"
Cohesion: 0.25
Nodes (13): GET(), runtime, setSessionCookie(), POST(), runtime, POST(), runtime, createClient() (+5 more)

### Community 63 - "market-radar/index.ts"
Cohesion: 0.22
Nodes (17): dynamic, GET(), getTenantId(), maxDuration, POST(), runtime, saveRadarSignal(), aiAnalyze() (+9 more)

### Community 64 - "rate-calculator.ts"
Cohesion: 0.16
Nodes (19): POST(), runtime, POST(), runtime, applyRules(), calcBaseCost(), calcServiceCost(), calculateDeliveryCost() (+11 more)

### Community 65 - "FAQSection.tsx"
Cohesion: 0.12
Nodes (12): FAQ, metadata, schema, FAQ, metadata, schema, FAQ, metadata (+4 more)

### Community 66 - "seed-runner.ts"
Cohesion: 0.23
Nodes (14): getSeedRates(), SeedRate, SEED_ROUTES, SeedRoute, err(), loadEnv(), log(), main() (+6 more)

### Community 67 - "ai-funnel/submit/route.ts"
Cohesion: 0.18
Nodes (15): checkRateLimit(), getIp(), maxDuration, POST(), runtime, getAiAnalysis(), maxDuration, POST() (+7 more)

### Community 68 - "client/dashboard/page.tsx"
Cohesion: 0.10
Nodes (23): GET(), runtime, DashboardPage(), OrdersPage(), CURRENCY_SYMBOLS, formatAmount(), PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES (+15 more)

### Community 69 - "partners/db.ts"
Cohesion: 0.27
Nodes (12): GET(), runtime, GET(), runtime, bootstrap(), getOrCreateLink(), getSql(), getStats() (+4 more)

### Community 70 - "client/calculator/page.tsx"
Cohesion: 0.12
Nodes (15): AI_STEPS, CalculatorPage(), CalcVariant, CATEGORIES, CITIES_FROM, CITY_COUNTRIES, fmtDays(), FormData (+7 more)

### Community 71 - "UnifiedLeadsDashboard.tsx"
Cohesion: 0.14
Nodes (15): ACTION_BUTTONS, LeadSystem, MI_TO_UNIFIED, normalizeImport(), normalizeMI(), SOURCE_ICON, STATUS_COLORS, STATUS_LABELS (+7 more)

### Community 72 - "payments/create/route.ts"
Cohesion: 0.23
Nodes (14): maxDuration, POST(), runtime, ensureLinksTable(), GET(), getSql(), maxDuration, POST() (+6 more)

### Community 73 - "KnowledgeUI.tsx"
Cohesion: 0.13
Nodes (10): metadata, ArticleFull, ArticleSummary, Category, CATEGORY_COLORS, ChatMessage, FAQ_ITEMS, KnowledgeUI() (+2 more)

### Community 74 - "lead-finder/index.ts"
Cohesion: 0.24
Nodes (17): saveMILead(), aiScore(), Contacts, dedup(), extractContacts(), firecrawlSearch(), GOOGLE_QUERIES, heuristic() (+9 more)

### Community 75 - "SeoClustersClient.tsx"
Cohesion: 0.13
Nodes (12): dynamic, Brief, ClusterGroup, COMP_COLOR, COMP_LABEL, GROUP_LABELS, SeoClustersClient(), Stats (+4 more)

### Community 76 - "free-guide.tsx"
Cohesion: 0.20
Nodes (6): dynamic, GET(), runtime, routes, styles, tips

### Community 77 - "url-parser.ts"
Cohesion: 0.21
Nodes (14): checkRateLimit(), getIp(), maxDuration, POST(), runtime, ALLOWED, detectPlatform(), FieldConfidence (+6 more)

### Community 78 - "ai-cto/db.ts"
Cohesion: 0.31
Nodes (12): CtoPage(), dynamic, metadata, GET(), runtime, ensureCtoTable(), getCtoReportById(), getCtoReportHistory() (+4 more)

### Community 79 - "setup/route.ts"
Cohesion: 0.23
Nodes (12): dynamic, POST(), runtime, dynamic, maxDuration, POST(), runtime, DEMO_LEADS (+4 more)

### Community 80 - "proposals/create/route.ts"
Cohesion: 0.20
Nodes (11): POST(), runtime, dynamic, GET(), runtime, dynamic, GET(), runtime (+3 more)

### Community 81 - "AnalyticsProvider.tsx"
Cohesion: 0.28
Nodes (5): inter, metadata, AnalyticsProvider(), GoogleAnalytics(), MicrosoftClarity()

### Community 82 - "departments.ts"
Cohesion: 0.46
Nodes (14): agent(), buildAllDepartments(), buildAnalyticsDept(), buildClientSuccessDept(), buildContentDept(), buildFinanceDept(), buildMarketingDept(), buildOperationsDept() (+6 more)

### Community 83 - "reports/page.tsx"
Cohesion: 0.13
Nodes (17): dynamic, EMPTY_REPORT, FinanceReportsPage(), revalidate, dynamic, GET(), POST(), runtime (+9 more)

### Community 84 - "proposals/page.tsx"
Cohesion: 0.25
Nodes (8): dynamic, MODE_COLORS, ProposalsPage(), revalidate, STATUS_COLORS, STATUS_LABELS, getProposals(), ProposalStatus

### Community 85 - "VkAdsDashboard.tsx"
Cohesion: 0.29
Nodes (5): AccountData, Campaign, LeadData, LeadForm, VkAdsDashboard()

### Community 86 - "proposals/types.ts"
Cohesion: 0.19
Nodes (11): MODES, ProposalButton(), loadTemplate(), parseFrontmatter(), TEMPLATES_DIR, CreateProposalRequest, LeadSnapshot, ProposalContext (+3 more)

### Community 87 - "calculator.ts"
Cohesion: 0.25
Nodes (13): FunnelState, EconomicsResult, EconomicsScenario, buildScenario(), calculateUnitEconomics(), CNY_RATE(), computeProductScore(), computeSupplierRisk() (+5 more)

### Community 88 - "ai-company/page.tsx"
Cohesion: 0.23
Nodes (11): AiOsDashboard(), AiCompanyPage(), dynamic, loadInitialReport(), metadata, GET(), maxDuration, runtime (+3 more)

### Community 89 - "ai-sales-agent/route.ts"
Cohesion: 0.36
Nodes (7): analyzeLeadsWithAI(), GET(), isAuthorized(), LeadRecommendation, maxDuration, POST(), runtime

### Community 90 - "sync/route.ts"
Cohesion: 0.24
Nodes (11): GET(), getToken(), leadToContact(), maxDuration, mtGet(), POST(), runSync(), runtime (+3 more)

### Community 91 - "LeadMagnetForm.tsx"
Cohesion: 0.18
Nodes (9): benefits, faqs, jsonLd, metadata, COUNTRIES, FormState, LeadMagnetForm(), VOLUMES (+1 more)

### Community 92 - "WbSellersClient.tsx"
Cohesion: 0.20
Nodes (8): dynamic, metadata, BADGE, parseExtra(), WbSellersClient(), КАТ_LABEL, Приоритет, РасширенныеДанные

### Community 93 - "calculator/route.ts"
Cohesion: 0.43
Nodes (6): CITY_COUNTRIES, fmtDays(), getAIRec(), POST(), runtime, saveClientCalculation()

### Community 94 - "market-intelligence/leads/route.ts"
Cohesion: 0.32
Nodes (7): buildMIComment(), dynamic, getTenantId(), maxDuration, PATCH(), POST(), runtime

### Community 95 - "SupplierFinderUI.tsx"
Cohesion: 0.20
Nodes (10): EXAMPLES, PRICE_LABELS, QUALITY_LABELS, ScoreBreakdown, SearchQueries, SearchResult, Supplier, SupplierFinderUI() (+2 more)

### Community 96 - "HhLeadsClient.tsx"
Cohesion: 0.22
Nodes (7): Filter, HhExtra, HhLeadsClient(), parseExtra(), КАТ_COLOR, КАТ_LABEL, dynamic

### Community 97 - "placements/page.tsx"
Cohesion: 0.25
Nodes (10): ChannelType, DURATION_PRESETS, formatDate(), isExpired(), Placement, PlacementCard(), PlacementsPage(), POST_TYPE_COLORS (+2 more)

### Community 98 - "PlatformDashboard.tsx"
Cohesion: 0.22
Nodes (7): dynamic, COUNTRY_FLAG, fmtMoney(), PLAN_BADGE, PlatformDashboard(), STATUS_DOT, PlatformMetrics

### Community 99 - "generator.ts"
Cohesion: 0.46
Nodes (6): generateProposal(), generateProposalNumber(), ProposalDocument(), registerFonts(), getMissingFields(), detectServiceKey()

### Community 100 - "fix/route.ts"
Cohesion: 0.29
Nodes (10): checkExposedRoutes(), checkSecurityHeaders(), dynamic, fixCrmTestTenant(), fixOrphanTestLeads(), FixResult, maxDuration, POST() (+2 more)

### Community 101 - "AuditClient.tsx"
Cohesion: 0.20
Nodes (6): AuditClient(), AuditResult, Insight, MARKETPLACE_LABEL, STEPS, metadata

### Community 102 - "import-audit/page.tsx"
Cohesion: 0.22
Nodes (8): AUDIT_POINTS, jsonLd, metadata, cls(), ImportAuditForm(), PROBLEMS, Step, VOLUMES

### Community 103 - "telegram.ts"
Cohesion: 0.36
Nodes (8): checkBotApi(), checkBotCredentials(), checkTelegramBot(), sendTelegramMessage(), buildTelegramReport(), sectionLine(), sendCtoReport(), statusEmoji()

### Community 104 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, seed:rates, start (+2 more)

### Community 105 - "CtoDashboard.tsx"
Cohesion: 0.40
Nodes (9): CheckRow(), CtoDashboard(), FixResult, fmtDate(), scoreBg(), scoreColor(), SectionCard(), statusBadge() (+1 more)

### Community 106 - "admin/dashboard/page.tsx"
Cohesion: 0.12
Nodes (11): Alert, ALERT_STYLE, CeoReport, CeoReportWidget(), Insight, Priority, Stats, TREND_COLOR (+3 more)

### Community 107 - "finance/api.ts"
Cohesion: 0.06
Nodes (52): FinanceDashboardPage(), dynamic, GET(), POST(), runtime, dynamic, PATCH(), runtime (+44 more)

### Community 108 - "articles/route.ts"
Cohesion: 0.27
Nodes (5): runtime, runtime, Article, ARTICLE_CATEGORIES, ARTICLES

### Community 109 - "isAdminOnly"
Cohesion: 0.40
Nodes (5): dynamic, POST(), runtime, WORKFLOWS, isAdminOnly()

### Community 110 - "presentation/page.tsx"
Cohesion: 0.22
Nodes (7): AUDIENCE, FEATURES, FORMATS, metadata, PROBLEMS, WHY, PrintButton()

### Community 111 - "tenant-auth.ts"
Cohesion: 0.22
Nodes (5): ROLE_PERMISSIONS, SUPER_ADMIN_COOKIE, TENANT_ADMIN_COOKIE, TenantSession, TenantRole

### Community 112 - "campaigns/page.tsx"
Cohesion: 0.28
Nodes (8): buildUtm(), Campaign, CampaignsPage(), CHANNEL_ICONS, CHANNELS, slugify(), STATUS_COLORS, STATUS_LABELS

### Community 113 - "faq/page.tsx"
Cohesion: 0.29
Nodes (5): FAQ_CUSTOMS, FAQ_DELIVERY, FAQ_MARKETPLACE, FAQ_SUPPLIERS, metadata

### Community 114 - "ChatWidget.tsx"
Cohesion: 0.40
Nodes (3): ChatWidget, ChatWidgetLoader(), ChatWindow()

### Community 115 - "leads/[id]/page.tsx"
Cohesion: 0.40
Nodes (4): dynamic, LeadPage(), revalidate, LeadDetail()

### Community 116 - "AdminNav.tsx"
Cohesion: 0.08
Nodes (16): Question, GROUP_COLOR, KwRow, TRAFFIC_COLOR, DealIntelligenceClient(), dynamic, dynamic, RadarClient() (+8 more)

### Community 117 - "client/calculations/page.tsx"
Cohesion: 0.31
Nodes (7): GET(), runtime, CalculationsPage(), dynamic, fmtDate(), TRANSPORT_LABELS, getClientCalculations()

### Community 118 - "signup/route.ts"
Cohesion: 0.22
Nodes (11): maxDuration, POST(), runtime, makeId(), maxDuration, now(), POST(), runtime (+3 more)

### Community 119 - "fulfilment/page.tsx"
Cohesion: 0.25
Nodes (6): FulfilmentClient(), MARKETS, SERVICES, STEPS, WAREHOUSES, metadata

### Community 120 - "app/platform/page.tsx"
Cohesion: 0.25
Nodes (6): AUDIENCE, FAQ, FEATURES, FORMATS, PROBLEMS, SAAS_PLANS

### Community 121 - "settings/marketing/page.tsx"
Cohesion: 0.22
Nodes (4): Message, QUICK_ACTIONS, SETTINGS_NAV, WELCOME

### Community 122 - "Marketplace.tsx"
Cohesion: 0.25
Nodes (6): CATEGORIES, Marketplace(), Module, MODULES, ModuleStatus, metadata

### Community 123 - "tenant-storage.ts"
Cohesion: 0.39
Nodes (7): CEO_DECISIONS_KEY(), CEO_HISTORY_KEY(), CEO_INBOX_KEY(), CEO_TASKS_KEY(), readTenantStorage(), tenantKey(), writeTenantStorage()

### Community 124 - "seed-db.ts"
Cohesion: 0.36
Nodes (8): n8nBase(), n8nFetch(), n8nKey(), normalize(), seedCreateRow(), seedListRows(), SeedTableKey, TABLE_IDS

### Community 125 - "billing/route.ts"
Cohesion: 0.40
Nodes (4): GET(), maxDuration, POST(), runtime

### Community 126 - "getSession"
Cohesion: 0.31
Nodes (12): GET(), runtime, GET(), runtime, DocumentsPage(), OrderDetailPage(), dtQuery(), getClientDocuments() (+4 more)

### Community 127 - "vk-ads/campaigns/route.ts"
Cohesion: 0.43
Nodes (7): GET(), getToken(), maxDuration, mtGet(), mtPost(), POST(), runtime

### Community 128 - "client/layout.tsx"
Cohesion: 0.29
Nodes (6): ClientLayout(), metadata, AI_NAV, ClientNav(), NAV, SessionPayload

### Community 129 - "PartnersDashboard.tsx"
Cohesion: 0.29
Nodes (3): metadata, PartnersDashboard(), Stats

### Community 130 - "SignupForm.tsx"
Cohesion: 0.29
Nodes (4): metadata, COUNTRIES, EMPLOYEES, SignupForm()

### Community 131 - "crm-debug/route.ts"
Cohesion: 0.50
Nodes (3): dynamic, GET(), runtime

### Community 132 - "admin/calculations/page.tsx"
Cohesion: 0.38
Nodes (6): AdminCalculationsPage(), dynamic, fmtDate(), revalidate, TRANSPORT_LABELS, getAllCalculations()

### Community 133 - "audit/route.ts"
Cohesion: 0.47
Nodes (5): callAuditLLM(), fetchSiteText(), maxDuration, POST(), runtime

### Community 134 - "notifications/route.ts"
Cohesion: 0.50
Nodes (4): GET(), maxDuration, runtime, generateNotifications()

### Community 135 - "content-publish/route.ts"
Cohesion: 0.48
Nodes (6): ensureTable(), GET(), maxDuration, publishToTelegram(), runtime, sql

### Community 136 - "free/route.ts"
Cohesion: 0.38
Nodes (6): dynamic, escapeNonAscii(), FreeLeadInput, POST(), runtime, validate()

### Community 137 - "economics/route.ts"
Cohesion: 0.32
Nodes (7): checkAndIncrement(), CNY_RATE, getIp(), maxDuration, POST(), runtime, USD_RATE

### Community 139 - "demo/documents/page.tsx"
Cohesion: 0.29
Nodes (5): DOC_TYPES, DOCS, STATUS_LABEL, STATUS_STYLE, TYPE_COLORS

### Community 140 - "knowledge/chat/route.ts"
Cohesion: 0.40
Nodes (5): maxDuration, POST(), runtime, saveQuestion(), ALL_KNOWLEDGE

### Community 142 - "AiSettings.tsx"
Cohesion: 0.33
Nodes (4): AiConfig, AiSettings(), PROVIDERS, metadata

### Community 143 - "BillingCenter.tsx"
Cohesion: 0.33
Nodes (4): BillingCenter(), INVOICES, PLANS, metadata

### Community 144 - "TochkaLinksSection.tsx"
Cohesion: 0.38
Nodes (6): fmtAmount(), fmtDate(), PaymentLink, STATUS_LABEL, STATUS_STYLE, TochkaLinksSection()

### Community 145 - "database.ts"
Cohesion: 0.57
Nodes (6): checkConnection(), checkDatabase(), checkQueryPerf(), CntRow, countTable(), sql

### Community 146 - "payments.ts"
Cohesion: 0.48
Nodes (6): AUTH, checkCheckEndpoint(), checkCreateEndpoint(), checkPayments(), checkPaymentsTable(), checkTochkaEnv()

### Community 147 - "security.ts"
Cohesion: 0.48
Nodes (6): checkCronSecretSet(), checkJwtEnvSet(), checkProtected(), checkSecurity(), checkSecurityHeaders(), PROTECTED

### Community 148 - "middleware.ts"
Cohesion: 0.48
Nodes (6): config, middleware(), verifyAdminToken(), verifyClientToken(), verifyPartnerToken(), verifyTenantSession()

### Community 149 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, crons, devCommand, framework, installCommand, outputDirectory

### Community 152 - "product-finder/route.ts"
Cohesion: 0.47
Nodes (5): checkLimit(), getIp(), maxDuration, POST(), runtime

### Community 153 - "supplier-finder/route.ts"
Cohesion: 0.47
Nodes (5): checkLimit(), getIp(), maxDuration, POST(), runtime

### Community 154 - "client/page.tsx"
Cohesion: 0.33
Nodes (4): DOCS, MSGS, ORDER, STATUSES

### Community 155 - "crm/page.tsx"
Cohesion: 0.33
Nodes (4): LEADS, PIPELINE, STATUS_LABELS, STATUS_STYLES

### Community 156 - "outreach-leads/page.tsx"
Cohesion: 0.29
Nodes (7): DORK_TEMPLATES, EMPTY, Lead, OutreachLeadsPage(), useWorkflowRunner(), WfKey, WfStatus

### Community 157 - "product-finder/page.tsx"
Cohesion: 0.28
Nodes (6): metadata, EXAMPLES, fmt(), Product, ProductFinderUI(), SearchResult

### Community 158 - "ai-providers.ts"
Cohesion: 0.47
Nodes (5): checkAiProviders(), checkOpenRouterKey(), MODELS, ModelSpec, testModel()

### Community 159 - "checks/api.ts"
Cohesion: 0.40
Nodes (5): AUTH, checkApi(), fetchRoute(), ROUTES, RouteSpec

### Community 160 - "checks/crm.ts"
Cohesion: 0.73
Nodes (5): checkCrm(), checkLeadCrud(), checkLeadsExist(), checkTenantsTable(), sql

### Community 161 - "seo.ts"
Cohesion: 0.60
Nodes (5): check404(), checkHomepageMeta(), checkRobots(), checkSeo(), checkSitemap()

### Community 162 - "china-kazakhstan/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 163 - "inspection/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 164 - "migrate/route.ts"
Cohesion: 0.40
Nodes (3): maxDuration, MIGRATION_STATEMENTS, runtime

### Community 167 - "marketing-ai/route.ts"
Cohesion: 0.50
Nodes (4): buildSystemPrompt(), maxDuration, POST(), runtime

### Community 170 - "demo/finance/page.tsx"
Cohesion: 0.40
Nodes (3): CATEGORIES, MONTHS, TRANSACTIONS

### Community 171 - "china-delivery/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 174 - "fonts.ts"
Cohesion: 0.70
Nodes (3): ROBOTO_BOLD_B64, ROBOTO_LIGHT_B64, ROBOTO_REGULAR_B64

### Community 175 - "query-approved.mjs"
Cohesion: 0.40
Nodes (4): client, env, envFile, miLeads

### Community 182 - "demo-request/route.ts"
Cohesion: 0.67
Nodes (3): escapeNonAscii(), POST(), runtime

## Knowledge Gaps
- **1002 isolated node(s):** `runtime`, `dynamic`, `WORKFLOWS`, `ExtractedPost`, `AnalyticsRow` (+997 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminNav()` connect `AdminNav.tsx` to `FinanceDashboard.tsx`, `content/data.ts`, `analytics/data.ts`, `OperationsDashboard.tsx`, `strategy/data.ts`, `MarketingDashboard.tsx`, `admin/calculations/page.tsx`, `ContentPageClient.tsx`, `lib/finance/types.ts`, `finance/settings/page.tsx`, `integrations/page.tsx`, `LeadDetail.tsx`, `sales/data.ts`, `CeoDashboard.tsx`, `store.ts`, `outreach-leads/page.tsx`, `rate-engine/types.ts`, `pricing/page.tsx`, `MarketingPageClient.tsx`, `ImportLead`, `market-intelligence/db.ts`, `CreateWizard.tsx`, `SeoClustersClient.tsx`, `ai-cto/db.ts`, `reports/page.tsx`, `proposals/page.tsx`, `VkAdsDashboard.tsx`, `ai-company/page.tsx`, `WbSellersClient.tsx`, `HhLeadsClient.tsx`, `PlatformDashboard.tsx`, `admin/dashboard/page.tsx`, `campaigns/page.tsx`, `leads/[id]/page.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `isAuthorized()` connect `isAuthorized` to `crm-debug/route.ts`, `content/data.ts`, `analytics/data.ts`, `notifications/route.ts`, `FinanceDashboard.tsx`, `MarketingDashboard.tsx`, `OperationsDashboard.tsx`, `strategy/data.ts`, `ceo/report/route.ts`, `sales/data.ts`, `product-finder/route.ts`, `supplier-finder/route.ts`, `client-portal/api.ts`, `check/route.ts`, `import-leads/crm.ts`, `getLeads`, `partners/db.ts`, `payments/create/route.ts`, `setup/route.ts`, `reports/page.tsx`, `ai-company/page.tsx`, `sync/route.ts`, `billing/route.ts`, `vk-ads/campaigns/route.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `createLead()` connect `crm/client.ts` to `partner-portal/api.ts`, `ai-funnel/submit/route.ts`, `sync/route.ts`, `economics/route.ts`, `isAuthorized`, `import-leads/crm.ts`, `finance/api.ts`, `api/leads/route.ts`, `market-intelligence/leads/route.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `runtime`, `dynamic`, `WORKFLOWS` to the rest of the system?**
  _1002 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content/db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055964653902798235 - nodes in this community are weakly interconnected._
- **Should `marketing/db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05833905284831846 - nodes in this community are weakly interconnected._
- **Should `partner-portal/api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05368289637952559 - nodes in this community are weakly interconnected._