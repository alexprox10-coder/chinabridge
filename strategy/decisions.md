# Architecture Decision Records (ADR)

Format: Status = [Proposed | Accepted | Deprecated | Superseded]

---

## ADR-001: intel_facts as Single Source of Truth for Market Data
**Date**: 2026-08-01 | **Status**: Accepted

**Context**: Multiple places in the codebase had hardcoded market rates (WB 23%, USD 84.5₽, CNY 12.4₽). When rates changed, code had to be deployed. Several AI agents were using stale data.

**Decision**: All external market data (exchange rates, marketplace commissions, customs duty rates) lives in the `intel_facts` table in Neon DB. Calculators and agents read from `/api/intelligence/facts`. Hardcoded values in `.ts` files serve as fallback only for initial deployment before intel_facts is seeded.

**Consequences**:
- `lib/economics/rates.ts` reads intel_facts as primary source ✅
- `lib/economics/marketplaces.ts` hardcoded constants = fallback only ✅
- New rule: any PR adding a hardcoded market rate (not a fallback) must be rejected
- intel_facts entries MUST have: `source + source_url + valid_from + confidence`

---

## ADR-002: Chat Sessions Persisted in Neon DB
**Date**: 2026-08-18 | **Status**: Accepted

**Context**: Vercel serverless functions are stateless and can cold-start on any request. The original `lib/ai/memory.ts` used an in-memory `Map<string, ConversationState>`. This caused chat sessions to lose context after the first function instance cycled out.

**Decision**: `getOrCreate()` and `saveSession()` in `memory.ts` use Neon DB as primary store. In-memory Map is a fallback only (no DATABASE_URL). A single `saveSession()` call happens at the end of each request handler — not after each mutation — to avoid Vercel killing fire-and-forget Promises.

**Consequences**:
- Chat context survives cold starts ✅
- Slight latency increase per request (~20–50ms for DB read)
- `getOrCreate()` is now async — callers must await it

---

## ADR-003: No void async() on Vercel Serverless
**Date**: 2026-08-18 | **Status**: Accepted

**Context**: Several route handlers were calling async functions without awaiting them (fire-and-forget pattern). On Vercel, the function exits immediately after sending the response, killing any pending Promises.

**Decision**: All async work in API routes must be awaited before `NextResponse.json()` is called. No `void fn()`. If background work is truly needed, use Vercel Background Functions or queue to n8n.

**Consequences**: Slightly longer response times in some cases, but data actually saves. Background work (radar scans, etc.) should use dedicated cron endpoints, not fire-and-forget within request handlers.

---

## ADR-004: RU and KZ Always Separate Calculation Contexts
**Date**: 2026-08-01 | **Status**: Accepted

**Context**: Russia and Kazakhstan have different customs regimes (white vs. grey), different currencies, different marketplace ecosystems, different compliance rules. Mixing them in one calculation produced wrong quotes.

**Decision**: All calculators, proposals, and agent prompts must carry a `market: 'RU' | 'KZ'` parameter. Rate engine fetches RU-specific or KZ-specific rates. Never aggregate or mix in a single output.

**Consequences**:
- More verbose code, but correct
- Compliance: KZ copy never mentions "таможня под ключ"
- Proposals generated per-market, not shared templates

---

## ADR-005: OpenRouter as LLM Provider with Fallback
**Date**: 2026-07-15 | **Status**: Accepted

**Context**: Using multiple LLM providers directly (Anthropic, OpenAI) requires separate API keys, rate limit management, and failover logic.

**Decision**: All LLM calls route through OpenRouter (`openrouter.ai/api/v1/chat/completions`). Model selection per use case:
- CEO AI summaries: `claude-haiku-4.5` (fast, low cost)
- Sales agent research: `google/gemini-flash-1.5` (large context for web content)
- Complex proposals: `gpt-4o-mini` or `claude-haiku-4.5`

**Consequences**: Single `OPENROUTER_API_KEY` in env. Model can be changed without code deploy (env or DB config). Added `HTTP-Referer: https://chinabridge.pro` required by OpenRouter.

---

## ADR-006: lib/knowledge/index.ts for ChinaBridge Service Prices Only
**Date**: 2026-08-19 | **Status**: Accepted

**Context**: During tariff audit, `lib/knowledge/index.ts` was found to contain both ChinaBridge's own service prices (15,000₽, 25,000₽) and market references. Question: should these go to intel_facts?

**Decision**: `lib/knowledge/index.ts` contains ChinaBridge's OWN pricing (our fees, our services, our descriptions). These are product decisions, not market data. They belong in code and can be edited directly without going through intel_facts. Market data (WB/Ozon commissions, CNY rate) stays in intel_facts.

**Rationale**: ChinaBridge service prices change rarely (business decision), while market rates change frequently (external data). Different update cadence = different storage.

---

## ADR-007: Operations CEO AI Uses Real CRM Data
**Date**: 2026-08-18 | **Status**: Accepted

**Context**: `lib/ai-company/operations/data.ts` had 8 hardcoded fake deals. CEO AI was making recommendations based on fabricated pipeline data.

**Decision**: `fetchOperationsData()` queries `crm_leads` table (Drizzle ORM). If DB returns 0 rows (empty pipeline or connection issue), `connected` flag is passed downstream and director generates an appropriate "no data" summary instead of fabricating analysis.

**Consequences**: CEO AI recommendations are now grounded in reality. Empty pipeline is correctly reported as "no active deals" rather than a fictional performance analysis.

---

## ADR-008: Finance Module Shows isDemo Warning When N8N Not Connected
**Date**: 2026-08-18 | **Status**: Accepted

**Context**: Finance module was showing modeled/simulated revenue figures (3.8M₽/month) without any indication they were not real. This created false confidence in financial decisions.

**Decision**: `fetchFinanceData()` returns `isDemo: boolean`. When n8n is not connected (`N8N_API_KEY` not set), all finance figures are synthetic. The Finance page and API both surface `isDemo: true`. An amber warning banner is shown in the UI.

**Consequences**: Clear signal to operators that Finance data is not real. No risk of confusing demo data with real revenue.
