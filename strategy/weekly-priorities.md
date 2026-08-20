# Weekly Priorities
Week 34 — August 18–24, 2026
Updated: 2026-08-20

## This Week's Focus
**Theme: Close the data gap + activate the AI funnel**

---

## P0 — Must ship this week

### 1. Intel_facts: seed WB/Ozon/Kaspi commissions
- Insert `WB_COMMISSION_STANDARD = 0.23` (source: seller.wildberries.ru, 2026-07-07)
- Insert `OZON_COMMISSION_STANDARD = 0.18` (source: seller.ozon.ru, 2026-07-01)
- Insert `KASPI_COMMISSION_STANDARD = 0.126` (source: kaspi.kz, 2026-01-01)
- All with required metadata: source, source_url, valid_from, confidence=0.9
- Verify rates.ts INTEL_MP_KEYS lookup returns values (not fallbacks)

### 2. AI Product Analyzer → Lead capture
- Current: analysis completes, user leaves, no CRM record
- Fix: after analysis, show "Хотите расчёт с учётом вашей маржи?" → email/phone input → save to CRM
- One field capture is enough. Don't gate the tool behind a form.

### 3. CLAUDE.md structure (this task) ✅ In progress
- Compress root CLAUDE.md — done
- Create knowledge/ files — done
- Create strategy/ files — done
- Create agents/ files — next

### 4. VK Pixel
- Add VK Pixel snippet to layout.tsx (head section)
- Pixel ID: ask owner or check VK Ads dashboard

---

## P1 — Start this week if P0 done

### 5. AI Sales Agent v1 — Architecture
- Read agents/sales/system-prompt.md
- Plan: Lead source (KZ leads) → Company Research (Firecrawl) → Score → Personalize → Telegram/email draft
- Don't build full automation yet. Manual review step is fine for v1.

### 6. Intel_facts: CNY/USD auto-collector
- ЦБ РФ daily rate API: `https://www.cbr.ru/scripts/XML_daily.asp`
- Create `/api/intelligence/collect/cbr` that fetches and upserts CNY_RATE + USD_RATE
- Add daily cron via Vercel cron or n8n

---

## P2 — Backlog

- Tochka Bank acquiring integration
- WB/Ozon commission automated monitor (n8n workflow)
- SaaS pricing decision
- SEO cluster pages for "импорт из Китая Алматы" family of keywords

---

## Done This Week
- ✅ Chat session persistence (Neon DB, no more cold-start memory loss)
- ✅ Operations CEO AI using real CRM data (not fake 8 deals)
- ✅ Finance module: isDemo warning banner
- ✅ Telegram subscriber counts: real API (not Math.random)
- ✅ CLAUDE.md operating system structure created
