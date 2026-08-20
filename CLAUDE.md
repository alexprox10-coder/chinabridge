## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

# CHINABRIDGE — AI OPERATING SYSTEM

## PRIMARY OBJECTIVE
Revenue growth. Every task must connect to one link in the chain:
**TRAFFIC → LEAD → SALE → IMPORT → PROFIT → REPEAT**

## MINDSET
1. Before any change: "Which KPI does this improve?" If no answer — it's P2 or lower.
2. Priority: P0 = revenue/leads/conversion/critical ops. P1 = strong growth effect. P2 = optimization. P3 = nice-to-have.
3. Find existing code before building new. No duplication, no abstractions beyond the task.

## DATA RULES
- NEVER hardcode market data (exchange rates, tariffs, commissions) in components or static files.
- Currency rates → `intel_facts` (Neon DB). Marketplace commissions → `intel_facts`.
- Every financial fact written to intel_facts requires: `fact_key + current_value + source + source_url + valid_from + confidence`.
- `lib/knowledge/index.ts` = ChinaBridge's OWN service prices only. Not market data. OK to edit directly.
- RU context ≠ KZ context. Never mix currencies, customs rules, or commissions in one calculation.
- Live market data path: `intel_facts` → `/api/intelligence/facts` → calculators/agents.

## CODE RULES
- Before touching rate calculations: read `lib/economics/rates.ts` (reads intel_facts as primary).
- Before touching marketplace fees: read `lib/economics/marketplaces.ts` + `INTEL_MP_KEYS` mapping in rates.ts.
- After changing calculators/AI prompts/rates: test AI Product Analyzer full funnel (URL → analysis → lead).
- No `void asyncFn()` on Vercel serverless. Always `await`. Save session once at end of handler.
- `runtime = "nodejs"` on all routes touching DB or external APIs.

## INTELLIGENCE PIPELINE
```
External source → Collector → intel_facts (Neon) → /api/intelligence/facts → Consumers
```
Files in `/intelligence/` = schemas, seeds, and docs. Live tariffs live in DB, never in .ts files.

## AI AGENT RULES
- Sales agent: Company Research first → identify opportunity → personalized offer. No generic "Здравствуйте, мы ChinaBridge".
- Lead score 0–100: ICP fit + purchase intent + potential revenue.
- Chat sessions persist in Neon (`chat_sessions` table). In-memory fallback only.
- Read `agents/` CLAUDE.md before editing any agent's system prompt.

## COMPLIANCE (IMMUTABLE)
- KZ logistics: СЕРАЯ схема. ЗАПРЕЩЕНО писать "таможня под ключ", "белая схема", "официальное оформление".
- RU logistics: белая схема через Суньфэньхэ — можно "таможня под ключ".
- ЗАПРЕЩЕНО генерировать: инструкции по обходу таможни, занижению стоимости, фиктивному декларированию.
- Production domain: `chinabridge.pro` (not chinabridge.ru).

## MARKETING RULES
- No unverified metrics in public copy (conversion rates, client counts, guaranteed savings).
- Behavioral triggers yes. Fake scarcity or manufactured social proof — no.
- Every CTA must enter the funnel: SEO landing → AI tool → lead capture → sale.

## REFERENCES
| Topic | Location |
|---|---|
| Business model, ICP, competitors | `knowledge/` |
| Q3 2026 goals + KPIs | `strategy/current-quarter.md` |
| This week's P0 tasks | `strategy/weekly-priorities.md` |
| Architecture decisions | `strategy/decisions.md` |
| Agent system prompts | `agents/{name}/system-prompt.md` |
| Live tariffs | `intel_facts` table in Neon |
| ChinaBridge service prices | `lib/knowledge/index.ts` |
