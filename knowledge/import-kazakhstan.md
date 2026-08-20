# Kazakhstan Import Rules

## ⚠️ CRITICAL COMPLIANCE RULE
KZ logistics = **СЕРАЯ схема** (grey scheme).

**ЗАПРЕЩЕНО** в любых материалах для KZ клиентов писать:
- "таможня под ключ"
- "белая схема"
- "официальное оформление"
- "официальный ввоз"
- "с растаможкой"

**Разрешено**: "доставка под ключ", "всё включено", "от двери до двери", "организуем доставку".

## Grey Scheme Mechanics (for internal context only — never for client-facing copy)

KZ does not have the same Russia-style formal import infrastructure for small/medium B2B volumes.
Most cargo moves as:
- Personal importation (физлицо)
- EAEU-zone goods reexport
- Informal consolidation through KZ freight operators

**Do not describe this process in detail to clients.** Just: "Мы организуем доставку, вы получаете товар".

## Pricing Context

- Delivery cost KZ: typically $1.5–3/kg (consolidated), higher for remote cities
- KZ buyers often compare to Ali/Pinduoduo direct — our value is speed + verification + no risk
- KZ customs threshold for personal import: 1,000 EUR / 31 kg per shipment (EAEU norms)
- For larger volumes: informal consolidation via cargo agents

## Key Cities and Transit Times

| Destination | Transit time | Notes |
|---|---|---|
| Almaty | 12–18 days | Main hub, most clients |
| Astana | 14–20 days | Via Almaty or direct |
| Shymkent | 15–21 days | Via Almaty |
| Other KZ cities | +3–7 days | Depends on carrier |

## Kaspi.kz — Key Platform

- Dominates KZ online retail (~75% of e-commerce)
- Commission: 12.6% (verify in intel_facts key: `KASPI_COMMISSION_STANDARD`)
- Payment: T+3 business days in KZT
- Our KZ ICP: Kaspi sellers growing from 1M to 10M+ KZT/month

## Proposal Template for KZ Clients

When generating proposals for KZ clients:
1. Quote delivery cost in USD/kg (not RUB)
2. State transit time in days
3. DO NOT mention customs/duty in the offer
4. Emphasize: verified suppliers, quality control, weekly departures, Almaty hub
5. Include Kaspi commission in the margin calculation if client sells on Kaspi

## Lead Source Context

We have 989 Almaty leads in CRM (leads_almaty_2026.csv). These are:
- Businesses sourced from FTS customs data (companies importing from CN)
- Target product categories: consumer goods, electronics, marketplace goods
- Priority score indicates readiness to work with an intermediary
