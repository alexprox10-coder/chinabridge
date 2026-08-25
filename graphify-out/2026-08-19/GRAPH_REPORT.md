# Graph Report - chinabridge  (2026-08-19)

## Corpus Check
- 635 files · ~934,351 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3630 nodes · 7079 edges · 229 communities (190 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a74c62d`
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
- AdminNav.tsx
- SalesDashboard.tsx
- labels.ts
- Footer.tsx
- CategoryPage.tsx
- import-leads/types.ts
- rate-engine/db.ts
- ceo/report/route.ts
- AiOsDashboard.tsx
- getAllLeads
- LeadDetail.tsx
- multitenant/types.ts
- isAuthorized
- lib/finance/types.ts
- store.ts
- CeoDashboard.tsx
- signup/route.ts
- generator.ts
- OnboardingWizard.tsx
- intelligence/page.tsx
- seed-runner.ts
- getLLMConfig
- document.tsx
- compilerOptions
- rate-engine/types.ts
- client-portal/api.ts
- rate-calculator.ts
- ai/client.ts
- client-portal/types.ts
- app/services/page.tsx
- trackGAEvent
- documents/types.ts
- ai-cto/index.ts
- blog/[slug]/page.tsx
- market-intelligence/db.ts
- crm/client.ts
- devDependencies
- deal-intelligence/index.ts
- finance/api.ts
- MarketingPageClient.tsx
- app/page.tsx
- AIEconomicsFunnel.tsx
- reports/page.tsx
- Breadcrumbs.tsx
- FAQSection.tsx
- dependencies
- api/leads/route.ts
- lead-finder/index.ts
- ChatWindow.tsx
- ContentPageClient.tsx
- enrich.ts
- client-portal/auth.ts
- market-radar/index.ts
- partners/db.ts
- pricing-engine.ts
- intelligence/types.ts
- market-intelligence/types.ts
- pricing/page.tsx
- ai-company/page.tsx
- [id]/offer/route.ts
- getSession
- client/calculator/page.tsx
- knowledge/index.ts
- import-leads/leads/route.ts
- UnifiedLeadsDashboard.tsx
- payments/create/route.ts
- calculator/route.ts
- KnowledgeUI.tsx
- SeoClustersClient.tsx
- market-intelligence/leads/route.ts
- faq/page.tsx
- free-guide.tsx
- url-parser.ts
- calculator.ts
- ai-cto/db.ts
- integrations/page.tsx
- SalesDashboardClient.tsx
- sales/data.ts
- intelligence/client.ts
- collect/route.ts
- init/route.ts
- setup/route.ts
- hh-leads/route.ts
- departments.ts
- china-kazakhstan/page.tsx
- inspection/page.tsx
- orchestrator.ts
- download/[id]/route.ts
- vk-ads/sync/route.ts
- LeadMagnetForm.tsx
- calculator/types.ts
- WbSellersClient.tsx
- outreach-leads/page.tsx
- SalesCompaniesClient.tsx
- telegram/webhook/route.ts
- fonts.ts
- SupplierFinderUI.tsx
- ImportLead
- HhLeadsClient.tsx
- placements/page.tsx
- fix/route.ts
- pdftest/route.ts
- getFactByKey
- AuditClient.tsx
- import-audit/page.tsx
- AnalyticsProvider.tsx
- PersonalOfferWidget.tsx
- scripts
- CtoDashboard.tsx
- CeoReportWidget.tsx
- drizzle-orm
- marketplace-rates/route.ts
- articles/route.ts
- presentation/page.tsx
- telegram.ts
- tenant-auth.ts
- campaigns/page.tsx
- proposals/types.ts
- client/calculations/page.tsx
- market-watch/route.ts
- fulfilment/page.tsx
- settings/marketing/page.tsx
- Marketplace.tsx
- tenant-storage.ts
- VkAdsDashboard.tsx
- admin/messages/page.tsx
- chat/page.tsx
- ai-sales-agent/route.ts
- dtQuery
- vk-ads/campaigns/route.ts
- client/layout.tsx
- app/platform/page.tsx
- PartnersDashboard.tsx
- SignupForm.tsx
- admin/calculations/page.tsx
- finance/orders/[id]/route.ts
- rates/sync/route.ts
- notifications/route.ts
- marketplaces.ts
- ai-funnel/submit/route.ts
- content-publish/route.ts
- free/route.ts
- upsertFact
- demo/documents/page.tsx
- requisites/page.tsx
- AiSettings.tsx
- BillingCenter.tsx
- TochkaLinksSection.tsx
- database.ts
- payments.ts
- security.ts
- import-leads/crm.ts
- middleware.ts
- vercel.json
- sales/offer/route.ts
- product-finder/route.ts
- supplier-finder/route.ts
- client/page.tsx
- crm/page.tsx
- ProductFinderUI.tsx
- ai-providers.ts
- checks/api.ts
- checks/crm.ts
- seo.ts
- expenses/[id]/route.ts
- payments/[id]/route.ts
- sales/chat/route.ts
- wb-sellers/route.ts
- migrate/route.ts
- ai/route.ts
- marketing-ai/route.ts
- client/login/page.tsx
- demo/finance/page.tsx
- china-delivery/page.tsx
- backup/page.tsx
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
- lucide-react
- @neondatabase/serverless
- next.config.ts
- postgres
- react-hook-form
- @supabase/supabase-js
- tailwind-merge
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `isAuthorized()` - 85 edges
2. `AdminNav()` - 55 edges
3. `getDb()` - 38 edges
4. `getSession()` - 32 edges
5. `createLead()` - 31 edges
6. `getLLMConfig()` - 28 edges
7. `getLeads()` - 23 edges
8. `bootstrap()` - 21 edges
9. `getSql()` - 21 edges
10. `bootstrap()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `isAuthorized()`  [EXTRACTED]
  app/api/ai-company/sales/platform-leads/route.ts → lib/api-auth.ts
- `POST()` --calls--> `isAuthorized()`  [EXTRACTED]
  app/api/ai-company/sales/platform-leads/route.ts → lib/api-auth.ts
- `ClientLayout()` --calls--> `getSession()`  [EXTRACTED]
  app/client/layout.tsx → lib/client-portal/auth.ts
- `TenantPage()` --calls--> `getTenantById()`  [EXTRACTED]
  app/admin/tenants/[id]/page.tsx → lib/multitenant/store.ts
- `DELETE()` --calls--> `markLeadDeleted()`  [EXTRACTED]
  app/api/admin/leads/route.ts → lib/import-leads/status-store.ts

## Import Cycles
- None detected.

## Communities (229 total, 39 thin omitted)

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

### Community 9 - "AdminNav.tsx"
Cohesion: 0.07
Nodes (19): Question, GROUP_COLOR, KwRow, TRAFFIC_COLOR, DealIntelligenceClient(), dynamic, dynamic, RadarClient() (+11 more)

### Community 10 - "SalesDashboard.tsx"
Cohesion: 0.10
Nodes (19): PRIO, Priority, Tab, TEMP_CFG, GET(), POST(), runtime, DirectorAnalysis (+11 more)

### Community 11 - "labels.ts"
Cohesion: 0.14
Nodes (26): CHIP_COLORS, ContentCalendarPage(), dayKey(), parseTimes(), Post, postDate(), Schedule, WEEKDAYS (+18 more)

### Community 12 - "Footer.tsx"
Cohesion: 0.09
Nodes (22): jsonLd, metadata, metadata, metadata, FAQS, metadata, STEPS, metadata (+14 more)

### Community 13 - "CategoryPage.tsx"
Cohesion: 0.07
Nodes (15): metadata, metadata, metadata, metadata, metadata, metadata, metadata, metadata (+7 more)

### Community 14 - "import-leads/types.ts"
Cohesion: 0.12
Nodes (29): GET(), maxDuration, POST(), QUICK_OVERRIDES, runtime, analyzeWebsite(), orAnalyze(), scrapeWebsite() (+21 more)

### Community 15 - "rate-engine/db.ts"
Cohesion: 0.08
Nodes (29): DELETE(), runtime, DELETE(), runtime, POST(), runtime, DELETE(), runtime (+21 more)

### Community 16 - "ceo/report/route.ts"
Cohesion: 0.11
Nodes (25): calcHealth(), GET(), maxDuration, runtime, toSummary(), generateDecisions(), toPriority(), buildFallback() (+17 more)

### Community 17 - "AiOsDashboard.tsx"
Cohesion: 0.13
Nodes (16): PRIORITY_CONFIG, Props, STATUS_CONFIG, CeoAnalysis, CeoTask, AgentInfo, CeoRecommendation, CeoReport (+8 more)

### Community 18 - "getAllLeads"
Cohesion: 0.15
Nodes (17): GET(), isAuthorized(), maxDuration, OfferResult, runtime, selectOffer(), fallbackTasks(), GET() (+9 more)

### Community 19 - "LeadDetail.tsx"
Cohesion: 0.10
Nodes (20): DashboardPage(), dynamic, revalidate, ALL_STATUSES, COLUMNS, LeadCard(), msAgo(), timeLabel() (+12 more)

### Community 20 - "multitenant/types.ts"
Cohesion: 0.05
Nodes (44): COUNTRY_FLAG, fmtMoney(), PLAN_BADGE, PlatformDashboard(), STATUS_DOT, BillingClient(), Plan, PLAN_BTN (+36 more)

### Community 21 - "isAuthorized"
Cohesion: 0.05
Nodes (43): dynamic, GET(), runtime, dynamic, GET(), runtime, dynamic, GET() (+35 more)

### Community 22 - "lib/finance/types.ts"
Cohesion: 0.08
Nodes (37): dynamic, FinanceExpensesPage(), fmtDate(), revalidate, dynamic, FinanceOrdersPage(), fmtDate(), revalidate (+29 more)

### Community 23 - "store.ts"
Cohesion: 0.10
Nodes (31): GET(), maxDuration, runtime, DELETE(), GET(), isSuperAdmin(), maxDuration, PATCH() (+23 more)

### Community 24 - "CeoDashboard.tsx"
Cohesion: 0.10
Nodes (21): buildInbox(), CeoAiTab(), CeoDashboard(), DecisionsTab(), DEPT_LINKS, DeptsTab(), fmtDate(), fmtTime() (+13 more)

### Community 25 - "signup/route.ts"
Cohesion: 0.18
Nodes (16): POST(), runtime, POST(), runtime, maxDuration, POST(), runtime, createSessionToken() (+8 more)

### Community 26 - "generator.ts"
Cohesion: 0.25
Nodes (11): generateProposal(), generateProposalNumber(), ProposalDocument(), registerFonts(), getMissingFields(), detectServiceKey(), loadTemplate(), parseFrontmatter() (+3 more)

### Community 27 - "OnboardingWizard.tsx"
Cohesion: 0.07
Nodes (17): ACTIONS, ActionState, Company, CONFETTI_COLORS, CONFETTI_ITEMS, CREATING_ITEMS, DAILY_TASKS, DEPARTMENTS (+9 more)

### Community 28 - "intelligence/page.tsx"
Cohesion: 0.07
Nodes (17): ChangeStatus, Confidence, CONFIDENCE_COLORS, DEPT_COLORS, DEPT_LABELS, IMPACT_LABELS, IMPACT_STYLES, ImpactLevel (+9 more)

### Community 29 - "seed-runner.ts"
Cohesion: 0.14
Nodes (23): getSeedRates(), SeedRate, SEED_ROUTES, SeedRoute, n8nBase(), n8nFetch(), n8nKey(), normalize() (+15 more)

### Community 30 - "getLLMConfig"
Cohesion: 0.10
Nodes (25): ensureTable(), GET(), POST(), auth(), GET(), getDynamicKeywords(), POST(), ensureTable() (+17 more)

### Community 31 - "document.tsx"
Cohesion: 0.09
Nodes (11): DARK, GREY, LIGHT_GREY, RED, styles, WHITE, CONTACTS, COOPERATION_STEPS (+3 more)

### Community 32 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 33 - "rate-engine/types.ts"
Cohesion: 0.09
Nodes (22): BLANK, CARGO_TYPES, CURRENCIES, RATE_TYPES, SOURCE_BADGE, TRANSPORT_TYPES, BLANK, TRANSPORT_TYPES (+14 more)

### Community 34 - "client-portal/api.ts"
Cohesion: 0.14
Nodes (21): dynamic, GET(), POST(), runtime, GET(), POST(), runtime, GET() (+13 more)

### Community 35 - "rate-calculator.ts"
Cohesion: 0.14
Nodes (22): POST(), runtime, POST(), runtime, applyRules(), calcBaseCost(), calcServiceCost(), calculateDeliveryCost() (+14 more)

### Community 36 - "ai/client.ts"
Cohesion: 0.25
Nodes (18): runConsultant(), runAgent(), runLogistic(), runOperator(), runQualification(), runSales(), callLLM(), LLMMessage (+10 more)

### Community 37 - "client-portal/types.ts"
Cohesion: 0.13
Nodes (14): DocumentsPage(), CITIES, CreateOrderForm(), ClientDocument, ClientOrder, ClientRole, DOC_TYPE_LABELS, DocumentType (+6 more)

### Community 38 - "app/services/page.tsx"
Cohesion: 0.10
Nodes (17): CITIES, metadata, FAQ, metadata, schema, FAQ, metadata, schema (+9 more)

### Community 39 - "trackGAEvent"
Cohesion: 0.12
Nodes (17): GAInner(), DirectionsSplit(), checks, Hero(), HowItWorks(), STEPS, ImportEcosystemBlock(), partnerCards (+9 more)

### Community 40 - "documents/types.ts"
Cohesion: 0.06
Nodes (45): CompanySettingsPage(), dynamic, dynamic, PATCH(), runtime, dynamic, fetchRows(), GET() (+37 more)

### Community 41 - "ai-cto/index.ts"
Cohesion: 0.16
Nodes (19): GET(), maxDuration, runtime, checkPage(), checkPerformance(), PAGES, buildRecommendations(), buildSection() (+11 more)

### Community 42 - "blog/[slug]/page.tsx"
Cohesion: 0.17
Nodes (14): BlogPage(), metadata, ArticlePage(), generateMetadata(), Props, renderContent(), sitemap(), ArticleCard() (+6 more)

### Community 43 - "market-intelligence/db.ts"
Cohesion: 0.20
Nodes (20): dynamic, GET(), maxDuration, dynamic, GET(), getTenantId(), POST(), runtime (+12 more)

### Community 44 - "crm/client.ts"
Cohesion: 0.07
Nodes (44): dynamic, LeadPage(), revalidate, dynamic, isAuthorized(), POST(), runtime, scoreFromReviews() (+36 more)

### Community 45 - "devDependencies"
Cohesion: 0.09
Nodes (23): dotenv-cli, drizzle-kit, eslint, eslint-config-next, devDependencies, dotenv-cli, drizzle-kit, eslint (+15 more)

### Community 46 - "deal-intelligence/index.ts"
Cohesion: 0.12
Nodes (16): ALERT_COLORS, RISK_COLORS, dynamic, MarketIntelligencePage(), dynamic, GET(), getTenantId(), runtime (+8 more)

### Community 47 - "finance/api.ts"
Cohesion: 0.06
Nodes (52): FinanceDashboardPage(), FinanceSettingsPage(), dynamic, GET(), POST(), runtime, dynamic, GET() (+44 more)

### Community 48 - "MarketingPageClient.tsx"
Cohesion: 0.11
Nodes (15): metadata, Analytics, Channel, fmtNum(), fmtPct(), fmtRub(), FunnelStep, KPI (+7 more)

### Community 49 - "app/page.tsx"
Cohesion: 0.10
Nodes (18): metadata, schemaOrg, Advantages, Cases, Directions, FAQ(), faqs, CARDS (+10 more)

### Community 50 - "AIEconomicsFunnel.tsx"
Cohesion: 0.13
Nodes (17): AIEconomicsFunnel(), ANALYZE_STAGES, CITY_CHIPS, CorrectionData, EMPTY_CORRECTION, EMPTY_PRODUCT, estimateSalePrice(), ExtractedProduct (+9 more)

### Community 51 - "reports/page.tsx"
Cohesion: 0.13
Nodes (17): dynamic, EMPTY_REPORT, FinanceReportsPage(), revalidate, dynamic, GET(), POST(), runtime (+9 more)

### Community 52 - "Breadcrumbs.tsx"
Cohesion: 0.11
Nodes (9): metadata, FAQ, metadata, schema, metadata, metadata, Breadcrumbs(), BreadcrumbsProps (+1 more)

### Community 53 - "FAQSection.tsx"
Cohesion: 0.12
Nodes (12): FAQ, metadata, schema, FAQ, metadata, schema, FAQ, metadata (+4 more)

### Community 54 - "dependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, clsx, framer-motion, @hookform/resolvers, next, dependencies, autoprefixer, clsx (+13 more)

### Community 55 - "api/leads/route.ts"
Cohesion: 0.18
Nodes (16): dynamic, notifyManagerTelegram(), POST(), REQUIRED, REQUIRES_PHONE, runtime, validate(), Lead (+8 more)

### Community 56 - "lead-finder/index.ts"
Cohesion: 0.21
Nodes (16): aiScore(), Contacts, dedup(), extractContacts(), firecrawlSearch(), GOOGLE_QUERIES, heuristic(), RawScore (+8 more)

### Community 57 - "ChatWindow.tsx"
Cohesion: 0.24
Nodes (10): AgentBadge(), CONFIG, ChatInput(), Props, ChatMessage(), Props, Message, Props (+2 more)

### Community 58 - "ContentPageClient.tsx"
Cohesion: 0.13
Nodes (9): metadata, Analytics, FILTERS, Message, Post, PostFilter, QUICK_ACTIONS, TodayStats (+1 more)

### Community 59 - "enrich.ts"
Cohesion: 0.22
Nodes (12): dynamic, maxDuration, POST(), runtime, enrichLead(), EnrichResult, ensureAiColumns(), extractContacts() (+4 more)

### Community 60 - "client-portal/auth.ts"
Cohesion: 0.28
Nodes (12): GET(), runtime, setSessionCookie(), POST(), runtime, POST(), runtime, createClient() (+4 more)

### Community 61 - "market-radar/index.ts"
Cohesion: 0.22
Nodes (17): dynamic, GET(), getTenantId(), maxDuration, POST(), runtime, saveRadarSignal(), aiAnalyze() (+9 more)

### Community 62 - "partners/db.ts"
Cohesion: 0.22
Nodes (14): GET(), runtime, GET(), runtime, GET(), runtime, bootstrap(), getOrCreateLink() (+6 more)

### Community 63 - "pricing-engine.ts"
Cohesion: 0.18
Nodes (18): checkAndIncrement(), getIp(), maxDuration, POST(), runtime, escapeNonAscii(), POST(), runtime (+10 more)

### Community 64 - "intelligence/types.ts"
Cohesion: 0.11
Nodes (17): SEED_FACTS, SEED_SOURCES, ChangeStatus, ChangeType, Confidence, CrawlFrequency, CreateChangeInput, CreateFactInput (+9 more)

### Community 65 - "market-intelligence/types.ts"
Cohesion: 0.12
Nodes (15): PIPE_COLORS, SOURCE_ICON, Tab, TEMP_COLORS, DEMO_SIGNALS, Tab, TAB_DEFS, TYPE_COLOR (+7 more)

### Community 66 - "pricing/page.tsx"
Cohesion: 0.12
Nodes (12): BLANK, CUSTOMER_COLORS, CUSTOMER_LABELS, FilterKey, FxRate, MpRate, PricingPage(), RULE_LABELS (+4 more)

### Community 67 - "ai-company/page.tsx"
Cohesion: 0.23
Nodes (11): AiOsDashboard(), AiCompanyPage(), dynamic, loadInitialReport(), metadata, GET(), maxDuration, runtime (+3 more)

### Community 68 - "[id]/offer/route.ts"
Cohesion: 0.29
Nodes (10): dynamic, ensureAiColumns(), extractContacts(), fetchPage(), GET(), htmlToText(), POST(), runtime (+2 more)

### Community 69 - "getSession"
Cohesion: 0.13
Nodes (19): GET(), runtime, DashboardPage(), OrdersPage(), CURRENCY_SYMBOLS, formatAmount(), PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES (+11 more)

### Community 70 - "client/calculator/page.tsx"
Cohesion: 0.12
Nodes (15): AI_STEPS, CalculatorPage(), CalcVariant, CATEGORIES, CITIES_FROM, CITY_COUNTRIES, fmtDays(), FormData (+7 more)

### Community 71 - "knowledge/index.ts"
Cohesion: 0.20
Nodes (10): maxDuration, POST(), runtime, saveQuestion(), ALL_KNOWLEDGE, COMPANY, DELIVERY, FAQ (+2 more)

### Community 72 - "import-leads/leads/route.ts"
Cohesion: 0.48
Nodes (6): buildImportComment(), GET(), isAuthorized(), PATCH(), runtime, updateLeadStatus()

### Community 73 - "UnifiedLeadsDashboard.tsx"
Cohesion: 0.14
Nodes (15): ACTION_BUTTONS, LeadSystem, MI_TO_UNIFIED, normalizeImport(), normalizeMI(), SOURCE_ICON, STATUS_COLORS, STATUS_LABELS (+7 more)

### Community 74 - "payments/create/route.ts"
Cohesion: 0.13
Nodes (28): GET(), maxDuration, runtime, maxDuration, POST(), runtime, ensureLinksTable(), GET() (+20 more)

### Community 75 - "calculator/route.ts"
Cohesion: 0.43
Nodes (6): CITY_COUNTRIES, fmtDays(), getAIRec(), POST(), runtime, saveClientCalculation()

### Community 76 - "KnowledgeUI.tsx"
Cohesion: 0.13
Nodes (10): metadata, ArticleFull, ArticleSummary, Category, CATEGORY_COLORS, ChatMessage, FAQ_ITEMS, KnowledgeUI() (+2 more)

### Community 77 - "SeoClustersClient.tsx"
Cohesion: 0.13
Nodes (12): dynamic, Brief, ClusterGroup, COMP_COLOR, COMP_LABEL, GROUP_LABELS, SeoClustersClient(), Stats (+4 more)

### Community 78 - "market-intelligence/leads/route.ts"
Cohesion: 0.29
Nodes (9): buildMIComment(), dynamic, GET(), getTenantId(), maxDuration, PATCH(), POST(), runtime (+1 more)

### Community 79 - "faq/page.tsx"
Cohesion: 0.29
Nodes (5): FAQ_CUSTOMS, FAQ_DELIVERY, FAQ_MARKETPLACE, FAQ_SUPPLIERS, metadata

### Community 80 - "free-guide.tsx"
Cohesion: 0.20
Nodes (6): dynamic, GET(), runtime, routes, styles, tips

### Community 81 - "url-parser.ts"
Cohesion: 0.21
Nodes (14): checkRateLimit(), getIp(), maxDuration, POST(), runtime, ALLOWED, detectPlatform(), FieldConfidence (+6 more)

### Community 82 - "calculator.ts"
Cohesion: 0.19
Nodes (13): FunnelState, EconomicsResult, buildScenario(), calculateUnitEconomics(), computeProductScore(), computeSupplierRisk(), computeTargetPrice(), EconomicsInput (+5 more)

### Community 83 - "ai-cto/db.ts"
Cohesion: 0.31
Nodes (12): CtoPage(), dynamic, metadata, GET(), runtime, ensureCtoTable(), getCtoReportById(), getCtoReportHistory() (+4 more)

### Community 84 - "integrations/page.tsx"
Cohesion: 0.40
Nodes (3): IntegrationsClient(), STATIC_INTEGRATIONS, VkStatus

### Community 85 - "SalesDashboardClient.tsx"
Cohesion: 0.14
Nodes (12): dynamic, revalidate, CrmStats, HotCompany, NAV_TABS, OfferResult, PRIORITY_BADGE, PRIORITY_STYLE (+4 more)

### Community 86 - "sales/data.ts"
Cohesion: 0.13
Nodes (24): dynamic, loadReport(), metadata, SalesPage(), SalesDashboard(), maxDuration, POST(), runtime (+16 more)

### Community 87 - "intelligence/client.ts"
Cohesion: 0.23
Nodes (13): dynamic, PATCH(), runtime, applyChange(), CreateMarketWatchInput, FactSnapshot, getFactsSnapshot(), getSql() (+5 more)

### Community 88 - "collect/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), POST(), runtime, CollectSource, dynamic, extractCommissionWithAI(), maxDuration (+5 more)

### Community 89 - "init/route.ts"
Cohesion: 0.24
Nodes (13): dynamic, GET(), maxDuration, POST(), runtime, dynamic, GET(), POST() (+5 more)

### Community 90 - "setup/route.ts"
Cohesion: 0.23
Nodes (12): dynamic, POST(), runtime, dynamic, maxDuration, POST(), runtime, DEMO_LEADS (+4 more)

### Community 91 - "hh-leads/route.ts"
Cohesion: 0.60
Nodes (4): GET(), isAuthorized(), POST(), runtime

### Community 92 - "departments.ts"
Cohesion: 0.46
Nodes (14): agent(), buildAllDepartments(), buildAnalyticsDept(), buildClientSuccessDept(), buildContentDept(), buildFinanceDept(), buildMarketingDept(), buildOperationsDept() (+6 more)

### Community 93 - "china-kazakhstan/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 94 - "inspection/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 95 - "orchestrator.ts"
Cohesion: 0.24
Nodes (11): dynamic, POST(), runtime, AGENT_LABELS, addMessage(), doHandoff(), getOrCreate(), markLeadSent() (+3 more)

### Community 96 - "download/[id]/route.ts"
Cohesion: 0.28
Nodes (7): dynamic, GET(), runtime, dynamic, GET(), runtime, getProposal()

### Community 97 - "vk-ads/sync/route.ts"
Cohesion: 0.24
Nodes (11): GET(), getToken(), leadToContact(), maxDuration, mtGet(), POST(), runSync(), runtime (+3 more)

### Community 98 - "LeadMagnetForm.tsx"
Cohesion: 0.18
Nodes (9): benefits, faqs, jsonLd, metadata, COUNTRIES, FormState, LeadMagnetForm(), VOLUMES (+1 more)

### Community 99 - "calculator/types.ts"
Cohesion: 0.12
Nodes (20): AI_STEPS, CalculatorForm(), CITY_CHIPS, initialFormData, inp(), CalculatorFormData, CalculatorResult, CARGO_TYPE_ICONS (+12 more)

### Community 100 - "WbSellersClient.tsx"
Cohesion: 0.20
Nodes (8): dynamic, metadata, BADGE, parseExtra(), WbSellersClient(), КАТ_LABEL, Приоритет, РасширенныеДанные

### Community 101 - "outreach-leads/page.tsx"
Cohesion: 0.18
Nodes (11): APIFY_PRESETS, ApifyLead, DORK_TEMPLATES, EMPTY_LEAD, EMPTY_WB, Lead, OutreachLeadsPage(), useWorkflowRunner() (+3 more)

### Community 102 - "SalesCompaniesClient.tsx"
Cohesion: 0.18
Nodes (9): dynamic, revalidate, Company, FILTER_OPTIONS, FilterKey, OfferResult, SalesCompaniesClient(), SCORE_COLOR (+1 more)

### Community 103 - "telegram/webhook/route.ts"
Cohesion: 0.27
Nodes (11): ALLOWED, callAI(), dynamic, extractUrls(), POST(), runtime, scrapeUrl(), send() (+3 more)

### Community 104 - "fonts.ts"
Cohesion: 0.70
Nodes (3): ROBOTO_BOLD_B64, ROBOTO_LIGHT_B64, ROBOTO_REGULAR_B64

### Community 105 - "SupplierFinderUI.tsx"
Cohesion: 0.20
Nodes (10): EXAMPLES, PRICE_LABELS, QUALITY_LABELS, ScoreBreakdown, SearchQueries, SearchResult, Supplier, SupplierFinderUI() (+2 more)

### Community 106 - "ImportLead"
Cohesion: 0.12
Nodes (13): IMPORTS_LABELS, Props, SCORE_COLORS, STATUS_LABELS, STATUS_STYLES, ACTION_ICON, AiSalesAgentClient(), Recommendation (+5 more)

### Community 107 - "HhLeadsClient.tsx"
Cohesion: 0.22
Nodes (7): Filter, HhExtra, HhLeadsClient(), parseExtra(), КАТ_COLOR, КАТ_LABEL, dynamic

### Community 108 - "placements/page.tsx"
Cohesion: 0.25
Nodes (10): ChannelType, DURATION_PRESETS, formatDate(), isExpired(), Placement, PlacementCard(), PlacementsPage(), POST_TYPE_COLORS (+2 more)

### Community 109 - "fix/route.ts"
Cohesion: 0.29
Nodes (10): checkExposedRoutes(), checkSecurityHeaders(), dynamic, fixCrmTestTenant(), fixOrphanTestLeads(), FixResult, maxDuration, POST() (+2 more)

### Community 111 - "getFactByKey"
Cohesion: 0.25
Nodes (9): dynamic, GET(), PATCH(), runtime, dynamic, GET(), runtime, getFactByKey() (+1 more)

### Community 112 - "AuditClient.tsx"
Cohesion: 0.20
Nodes (6): AuditClient(), AuditResult, Insight, MARKETPLACE_LABEL, STEPS, metadata

### Community 113 - "import-audit/page.tsx"
Cohesion: 0.22
Nodes (8): AUDIT_POINTS, jsonLd, metadata, cls(), ImportAuditForm(), PROBLEMS, Step, VOLUMES

### Community 114 - "AnalyticsProvider.tsx"
Cohesion: 0.13
Nodes (12): inter, metadata, AnalyticsProvider(), GoogleAnalytics(), MicrosoftClarity(), YandexMetrika(), ChatWidget, ChatWidgetLoader() (+4 more)

### Community 115 - "PersonalOfferWidget.tsx"
Cohesion: 0.18
Nodes (8): AnalysisSummary, AttackPlan, CockpitResult, ContactsFound, LOADING_STEPS, OfferOption, PersonalOfferWidget(), ScoreFactor

### Community 116 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, seed:rates, start (+2 more)

### Community 117 - "CtoDashboard.tsx"
Cohesion: 0.40
Nodes (9): CheckRow(), CtoDashboard(), FixResult, fmtDate(), scoreBg(), scoreColor(), SectionCard(), statusBadge() (+1 more)

### Community 118 - "CeoReportWidget.tsx"
Cohesion: 0.20
Nodes (9): Alert, ALERT_STYLE, CeoReport, CeoReportWidget(), Insight, Priority, Stats, TREND_COLOR (+1 more)

### Community 120 - "marketplace-rates/route.ts"
Cohesion: 0.33
Nodes (5): dynamic, PATCH(), runtime, upsertMpRate(), MARKETPLACES

### Community 121 - "articles/route.ts"
Cohesion: 0.27
Nodes (5): runtime, runtime, Article, ARTICLE_CATEGORIES, ARTICLES

### Community 123 - "presentation/page.tsx"
Cohesion: 0.22
Nodes (7): AUDIENCE, FEATURES, FORMATS, metadata, PROBLEMS, WHY, PrintButton()

### Community 124 - "telegram.ts"
Cohesion: 0.36
Nodes (8): checkBotApi(), checkBotCredentials(), checkTelegramBot(), sendTelegramMessage(), buildTelegramReport(), sectionLine(), sendCtoReport(), statusEmoji()

### Community 125 - "tenant-auth.ts"
Cohesion: 0.22
Nodes (5): ROLE_PERMISSIONS, SUPER_ADMIN_COOKIE, TENANT_ADMIN_COOKIE, TenantSession, TenantRole

### Community 126 - "campaigns/page.tsx"
Cohesion: 0.28
Nodes (8): buildUtm(), Campaign, CampaignsPage(), CHANNEL_ICONS, CHANNELS, slugify(), STATUS_COLORS, STATUS_LABELS

### Community 127 - "proposals/types.ts"
Cohesion: 0.14
Nodes (17): dynamic, MODE_COLORS, ProposalsPage(), revalidate, STATUS_COLORS, STATUS_LABELS, POST(), runtime (+9 more)

### Community 128 - "client/calculations/page.tsx"
Cohesion: 0.31
Nodes (7): GET(), runtime, CalculationsPage(), dynamic, fmtDate(), TRANSPORT_LABELS, getClientCalculations()

### Community 129 - "market-watch/route.ts"
Cohesion: 0.36
Nodes (8): dynamic, GET(), POST(), runtime, createMarketWatchItem(), ensureMarketWatchTable(), getMarketWatchItems(), updateMarketWatchPrice()

### Community 130 - "fulfilment/page.tsx"
Cohesion: 0.25
Nodes (6): FulfilmentClient(), MARKETS, SERVICES, STEPS, WAREHOUSES, metadata

### Community 131 - "settings/marketing/page.tsx"
Cohesion: 0.22
Nodes (4): Message, QUICK_ACTIONS, SETTINGS_NAV, WELCOME

### Community 132 - "Marketplace.tsx"
Cohesion: 0.25
Nodes (6): CATEGORIES, Marketplace(), Module, MODULES, ModuleStatus, metadata

### Community 133 - "tenant-storage.ts"
Cohesion: 0.39
Nodes (7): CEO_DECISIONS_KEY(), CEO_HISTORY_KEY(), CEO_INBOX_KEY(), CEO_TASKS_KEY(), readTenantStorage(), tenantKey(), writeTenantStorage()

### Community 134 - "VkAdsDashboard.tsx"
Cohesion: 0.29
Nodes (5): AccountData, Campaign, LeadData, LeadForm, VkAdsDashboard()

### Community 136 - "chat/page.tsx"
Cohesion: 0.29
Nodes (5): dynamic, revalidate, Message, PROMPTS, SalesChatClient()

### Community 137 - "ai-sales-agent/route.ts"
Cohesion: 0.36
Nodes (7): analyzeLeadsWithAI(), GET(), isAuthorized(), LeadRecommendation, maxDuration, POST(), runtime

### Community 139 - "dtQuery"
Cohesion: 0.32
Nodes (10): GET(), runtime, GET(), runtime, OrderDetailPage(), dtQuery(), getClientDocuments(), getOrderById() (+2 more)

### Community 141 - "vk-ads/campaigns/route.ts"
Cohesion: 0.43
Nodes (7): GET(), getToken(), maxDuration, POST(), runtime, vkGet(), vkPost()

### Community 142 - "client/layout.tsx"
Cohesion: 0.29
Nodes (6): ClientLayout(), metadata, AI_NAV, ClientNav(), NAV, SessionPayload

### Community 143 - "app/platform/page.tsx"
Cohesion: 0.17
Nodes (9): AUDIENCE, FAQ, FEATURES, FORMATS, PROBLEMS, SAAS_PLANS, ADVANTAGES, Calculator() (+1 more)

### Community 144 - "PartnersDashboard.tsx"
Cohesion: 0.29
Nodes (3): metadata, PartnersDashboard(), Stats

### Community 145 - "SignupForm.tsx"
Cohesion: 0.29
Nodes (4): metadata, COUNTRIES, EMPLOYEES, SignupForm()

### Community 146 - "admin/calculations/page.tsx"
Cohesion: 0.38
Nodes (6): AdminCalculationsPage(), dynamic, fmtDate(), revalidate, TRANSPORT_LABELS, getAllCalculations()

### Community 148 - "finance/orders/[id]/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), PATCH(), runtime, getFinanceOrderById(), updateFinanceOrder()

### Community 149 - "rates/sync/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, fetchCBRRates(), GET(), POST(), runtime, upsertRate()

### Community 150 - "notifications/route.ts"
Cohesion: 0.50
Nodes (4): GET(), maxDuration, runtime, generateNotifications()

### Community 151 - "marketplaces.ts"
Cohesion: 0.31
Nodes (8): checkRateLimit(), getIp(), maxDuration, POST(), runtime, getCommission(), getMarketplace(), MarketplaceConfig

### Community 152 - "ai-funnel/submit/route.ts"
Cohesion: 0.43
Nodes (6): getAiAnalysis(), maxDuration, POST(), runtime, saveProductAnalysis(), sendTelegramAlert()

### Community 153 - "content-publish/route.ts"
Cohesion: 0.48
Nodes (6): ensureTable(), GET(), maxDuration, publishToTelegram(), runtime, sql

### Community 154 - "free/route.ts"
Cohesion: 0.38
Nodes (6): dynamic, escapeNonAscii(), FreeLeadInput, POST(), runtime, validate()

### Community 155 - "upsertFact"
Cohesion: 0.38
Nodes (6): dynamic, GET(), POST(), runtime, getFacts(), upsertFact()

### Community 156 - "demo/documents/page.tsx"
Cohesion: 0.29
Nodes (5): DOC_TYPES, DOCS, STATUS_LABEL, STATUS_STYLE, TYPE_COLORS

### Community 158 - "AiSettings.tsx"
Cohesion: 0.33
Nodes (4): AiConfig, AiSettings(), PROVIDERS, metadata

### Community 159 - "BillingCenter.tsx"
Cohesion: 0.33
Nodes (4): BillingCenter(), INVOICES, PLANS, metadata

### Community 160 - "TochkaLinksSection.tsx"
Cohesion: 0.38
Nodes (6): fmtAmount(), fmtDate(), PaymentLink, STATUS_LABEL, STATUS_STYLE, TochkaLinksSection()

### Community 161 - "database.ts"
Cohesion: 0.57
Nodes (6): checkConnection(), checkDatabase(), checkQueryPerf(), CntRow, countTable(), sql

### Community 162 - "payments.ts"
Cohesion: 0.48
Nodes (6): AUTH, checkCheckEndpoint(), checkCreateEndpoint(), checkPayments(), checkPaymentsTable(), checkTochkaEnv()

### Community 163 - "security.ts"
Cohesion: 0.48
Nodes (6): checkCronSecretSet(), checkJwtEnvSet(), checkProtected(), checkSecurity(), checkSecurityHeaders(), PROTECTED

### Community 164 - "import-leads/crm.ts"
Cohesion: 0.24
Nodes (14): POST(), runtime, deleteLeadPermanently(), dtInsert(), dtQuery(), getLeadsByScore(), isDuplicateWebsite(), saveLead() (+6 more)

### Community 165 - "middleware.ts"
Cohesion: 0.48
Nodes (6): config, middleware(), verifyAdminToken(), verifyClientToken(), verifyPartnerToken(), verifyTenantSession()

### Community 166 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, crons, devCommand, framework, installCommand, outputDirectory

### Community 167 - "sales/offer/route.ts"
Cohesion: 0.47
Nodes (5): fallbackOffer(), isAuthorized(), maxDuration, POST(), runtime

### Community 170 - "product-finder/route.ts"
Cohesion: 0.47
Nodes (5): checkLimit(), getIp(), maxDuration, POST(), runtime

### Community 171 - "supplier-finder/route.ts"
Cohesion: 0.47
Nodes (5): checkLimit(), getIp(), maxDuration, POST(), runtime

### Community 172 - "client/page.tsx"
Cohesion: 0.33
Nodes (4): DOCS, MSGS, ORDER, STATUSES

### Community 173 - "crm/page.tsx"
Cohesion: 0.33
Nodes (4): LEADS, PIPELINE, STATUS_LABELS, STATUS_STYLES

### Community 174 - "ProductFinderUI.tsx"
Cohesion: 0.40
Nodes (5): EXAMPLES, fmt(), Product, ProductFinderUI(), SearchResult

### Community 175 - "ai-providers.ts"
Cohesion: 0.47
Nodes (5): checkAiProviders(), checkOpenRouterKey(), MODELS, ModelSpec, testModel()

### Community 176 - "checks/api.ts"
Cohesion: 0.40
Nodes (5): AUTH, checkApi(), fetchRoute(), ROUTES, RouteSpec

### Community 177 - "checks/crm.ts"
Cohesion: 0.73
Nodes (5): checkCrm(), checkLeadCrud(), checkLeadsExist(), checkTenantsTable(), sql

### Community 178 - "seo.ts"
Cohesion: 0.60
Nodes (5): check404(), checkHomepageMeta(), checkRobots(), checkSeo(), checkSitemap()

### Community 179 - "expenses/[id]/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, PATCH(), runtime, updateExpense()

### Community 180 - "payments/[id]/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, PATCH(), runtime, updatePayment()

### Community 182 - "sales/chat/route.ts"
Cohesion: 0.50
Nodes (4): isAuthorized(), maxDuration, POST(), runtime

### Community 183 - "wb-sellers/route.ts"
Cohesion: 0.60
Nodes (4): GET(), isAuthorized(), POST(), runtime

### Community 184 - "migrate/route.ts"
Cohesion: 0.40
Nodes (3): maxDuration, MIGRATION_STATEMENTS, runtime

### Community 189 - "marketing-ai/route.ts"
Cohesion: 0.50
Nodes (4): buildSystemPrompt(), maxDuration, POST(), runtime

### Community 193 - "demo/finance/page.tsx"
Cohesion: 0.40
Nodes (3): CATEGORIES, MONTHS, TRANSACTIONS

### Community 194 - "china-delivery/page.tsx"
Cohesion: 0.40
Nodes (3): FAQ, metadata, schema

### Community 197 - "query-approved.mjs"
Cohesion: 0.40
Nodes (4): client, env, envFile, miLeads

### Community 206 - "demo-request/route.ts"
Cohesion: 0.67
Nodes (3): escapeNonAscii(), POST(), runtime

## Knowledge Gaps
- **1120 isolated node(s):** `runtime`, `dynamic`, `maxDuration`, `runtime`, `dynamic` (+1115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminNav()` connect `AdminNav.tsx` to `FinanceDashboard.tsx`, `content/data.ts`, `analytics/data.ts`, `OperationsDashboard.tsx`, `strategy/data.ts`, `MarketingDashboard.tsx`, `VkAdsDashboard.tsx`, `admin/messages/page.tsx`, `labels.ts`, `chat/page.tsx`, `admin/calculations/page.tsx`, `LeadDetail.tsx`, `multitenant/types.ts`, `lib/finance/types.ts`, `CeoDashboard.tsx`, `intelligence/page.tsx`, `rate-engine/types.ts`, `crm/client.ts`, `deal-intelligence/index.ts`, `MarketingPageClient.tsx`, `reports/page.tsx`, `ContentPageClient.tsx`, `pricing/page.tsx`, `ai-company/page.tsx`, `SeoClustersClient.tsx`, `ai-cto/db.ts`, `integrations/page.tsx`, `SalesDashboardClient.tsx`, `sales/data.ts`, `WbSellersClient.tsx`, `outreach-leads/page.tsx`, `SalesCompaniesClient.tsx`, `ImportLead`, `HhLeadsClient.tsx`, `campaigns/page.tsx`, `proposals/types.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `isAuthorized()` connect `isAuthorized` to `FinanceDashboard.tsx`, `content/data.ts`, `analytics/data.ts`, `OperationsDashboard.tsx`, `strategy/data.ts`, `MarketingDashboard.tsx`, `SalesDashboard.tsx`, `vk-ads/campaigns/route.ts`, `ceo/report/route.ts`, `notifications/route.ts`, `client-portal/api.ts`, `product-finder/route.ts`, `supplier-finder/route.ts`, `crm/client.ts`, `reports/page.tsx`, `partners/db.ts`, `ai-company/page.tsx`, `payments/create/route.ts`, `sales/data.ts`, `setup/route.ts`, `vk-ads/sync/route.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `createLead()` connect `crm/client.ts` to `vk-ads/sync/route.ts`, `partner-portal/api.ts`, `import-leads/leads/route.ts`, `market-intelligence/leads/route.ts`, `api/leads/route.ts`, `ai-funnel/submit/route.ts`, `pricing-engine.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `runtime`, `dynamic`, `maxDuration` to the rest of the system?**
  _1120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content/db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055964653902798235 - nodes in this community are weakly interconnected._
- **Should `marketing/db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05833905284831846 - nodes in this community are weakly interconnected._
- **Should `partner-portal/api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05368289637952559 - nodes in this community are weakly interconnected._