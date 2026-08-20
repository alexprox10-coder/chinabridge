# Russia Import Rules

## Primary Route: Heihe (CN) → Blagoveshchensk (RU)

- River crossing: Heihe–Blagoveshchensk ferry/bridge, year-round operation
- Distance advantage: saves 1,500–2,000 km vs. rail through Manchuria
- Transit time: same-day crossing, customs 1–3 days
- Our office is in Blagoveshchensk — direct oversight of this route

## Customs Regime (White Scheme / Белая схема)

For Russia, we use the **white scheme via Suifenhe** (Суньфэньхэ) for formal import.
This means: full customs declaration, HS code, duties, VAT = "таможня под ключ" — OK to say this to RU clients.

### Key thresholds (verify in intel_facts before quoting)
- **Import duty**: varies by HS code, typically 5–20%
- **VAT**: 20% on most goods
- **Customs value**: declared CIF (cost + insurance + freight to customs point)
- **Personal import threshold**: 1,000 EUR / 31 kg per shipment (for B2C — not our main use case)

**intel_facts key for customs rate**: `CUSTOMS_DUTY_RATE` (default 20% in code — but real rate varies by HS code)

### Common HS codes for our clients
| Category | HS chapter | Typical duty |
|---|---|---|
| Electronics | 85 | 0–15% |
| Textiles/clothing | 61–62 | 12–17% |
| Furniture | 94 | 20% |
| Auto parts | 87 | 0–20% |
| Solar panels | 8541.40 | 0% (check current) |
| Sports goods | 95 | 10–15% |

## Delivery Options

### Consolidated cargo (сборный груз)
- Min: 50 kg
- Frequency: weekly departures from Yiwu, Guangzhou, Shenzhen
- Transit: 10–21 days to Blagoveshchensk
- Rate: from $3.3–5.5/kg (varies by route, density, category)
- **Rates in DB**: `rate_engine` seeds — fetch via `/api/rates`

### FCL container
- 20ft: ~$4,250 door-to-Blagoveshchensk (reference, fetch from rate_engine)
- 40ft: ~$6,500 (reference)
- Transit: 25–35 days

### Air cargo
- Rate: $6–8/kg (reference, fetch from rate_engine)
- Transit: 7–14 days
- Use case: urgent, high-value, low-weight goods

## Key Marketplaces (RU)
- Wildberries, Ozon, Yandex Market — see marketplace-rules.md for commissions
- FBW/FBO (fulfilled by marketplace) is preferred by most of our clients
- We can deliver directly to marketplace fulfillment centers in Moscow/Novosibirsk

## Compliance Notes
- Certificates required for: electronics, children's goods, food-contact goods, cosmetics
- EAC/GOST/TR CU certification — we can connect clients to certification agents
- Phytosanitary certificate needed for: wood products, some packaging
