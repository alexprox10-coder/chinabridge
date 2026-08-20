# Intelligence Agent — Context

Responsible for collecting, validating, and persisting market data into `intel_facts`.

## Purpose
Ensure all calculators and AI agents work with current, sourced, verified data.
The moment a rate is stale, every proposal and analysis becomes wrong.

## Data it owns

| Data type | intel_facts key | Source | Frequency |
|---|---|---|---|
| CNY/RUB rate | `CNY_RATE` | cbr.ru XML API | Daily |
| USD/RUB rate | `USD_RATE` | cbr.ru XML API | Daily |
| WB commission | `WB_COMMISSION_STANDARD` | seller.wildberries.ru | Weekly |
| Ozon commission | `OZON_COMMISSION_STANDARD` | seller.ozon.ru | Weekly |
| Kaspi commission | `KASPI_COMMISSION_STANDARD` | kaspi.kz | Monthly |
| Yandex commission | `YANDEX_COMMISSION_STANDARD` | yandex.ru/support | Monthly |
| Customs duty rate | `CUSTOMS_DUTY_RATE` | ФТС / ЕЭК | As changed |

## Collection Pipeline
```
Source URL → HTTP fetch → Parse → Normalize → Validate → intel_facts UPSERT → Version log
```

If `requires_approval = true` on the fact: write to `pending` state, notify operator, await approval before consumers read it.

## Rules for Writing to intel_facts
Every INSERT or UPDATE MUST include:
- `fact_key` — from the table above
- `current_value` — the actual value (string, normalized)
- `source` — human-readable source name (e.g. "ЦБ РФ")
- `source_url` — direct URL to the data
- `valid_from` — ISO date when this value became effective
- `confidence` — 0–1 float (1.0 = official source, 0.7 = scraped, 0.5 = estimated)

**Missing any of these fields = invalid write. Reject and alert.**

## API Endpoints
- Read all facts: `GET /api/intelligence/facts`
- Read one fact: `GET /api/intelligence/facts?key=CNY_RATE`
- Write fact: `POST /api/intelligence/facts` (admin only, requires cb_admin cookie)
- Trigger collection: `POST /api/intelligence/collect/cbr` (cron-triggered)

## Current Status (as of 2026-08-20)
- ✅ intel_facts table exists with correct schema
- ✅ CNY_RATE and USD_RATE seeded manually
- 🔴 WB/Ozon/Kaspi/Yandex commissions NOT in intel_facts (hardcoded fallback active)
- 🔴 No automated collector running (CBR collector not built yet)
- 🔴 No approval workflow UI

## P0 Tasks
1. Seed WB/Ozon/Kaspi/Yandex commissions into intel_facts
2. Build `/api/intelligence/collect/cbr` (CBR daily rate fetch)
3. Schedule CBR collector as Vercel cron or n8n workflow
