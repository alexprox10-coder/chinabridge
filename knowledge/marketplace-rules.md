# Marketplace Commission Rules

> **IMPORTANT**: Numbers below are reference values from code constants (marketplaces.ts).
> ALWAYS fetch current values from `intel_facts` before any calculation.
> intel_facts keys are listed in each section.

## Wildberries (WB)

**intel_facts key**: `WB_GENERAL_COMMISSION`
**Official source**: https://seller.wildberries.ru/dynamic-product-categories/commissions
**Update frequency**: Weekly (can change without notice)
**Reference value** (2026-07-07): 23%

Additional fees:
- Logistics (FBW): 50–100 ₽/unit depending on category
- Storage: 0.07–0.14 ₽/unit/day
- Return processing: included

**ICP relevance**: WB sellers are primary RU-market ICP. When generating proposals for WB sellers,
calculate: import cost + customs + our commission + WB fee = landed cost vs. competitor retail.

## Ozon

**intel_facts key**: `OZON_GENERAL_COMMISSION`
**Official source**: https://seller.ozon.ru/app/commission
**Update frequency**: Weekly
**Reference value** (2026-07-01): 18%

Additional fees:
- FBO logistics: 35–75 ₽/unit
- Last mile: included in FBO
- Returns: 5% of item price

## Kaspi.kz (Kazakhstan)

**intel_facts key**: `KASPI_COMMISSION`
**Official source**: https://kaspi.kz/merchantcabinet
**Update frequency**: Monthly
**Reference value** (2026-01-01): 12.6%

**Important for KZ proposals**:
- Kaspi dominates KZ e-commerce (~75% of online retail)
- Kaspi payment terms: T+3 business days
- Kaspi requires KZ legal entity or individual entrepreneur
- Our clients often need help with KZ company setup

## Yandex Market

**intel_facts key**: `YANDEX_FBY_COMMISSION`
**Official source**: https://yandex.ru/support/marketplace/ru/introduction/commission.html
**Update frequency**: Monthly (sometimes quarterly)
**Reference value** (2026-02-01): 12%

Additional fees:
- FBY logistics: 40–90 ₽/unit
- Click-out fee for DBS model: varies

## How intel_facts overrides hardcoded values

`lib/economics/rates.ts` reads marketplace commissions via `INTEL_MP_KEYS`:
```ts
WB_GENERAL_COMMISSION   → 'wb'
OZON_GENERAL_COMMISSION → 'ozon'
KASPI_COMMISSION        → 'kaspi'
YANDEX_FBY_COMMISSION   → 'yandex'
```
When intel_facts has a value for a key, it overrides the hardcoded constant.
When intel_facts is empty (new deployment), hardcoded constants serve as fallback.

**To update a commission in production**: INSERT or UPDATE `intel_facts` with the key above.
