# Smart Delivery Calculator

## Purpose

A public-facing 5-step form that collects cargo parameters and contact details, then posts
the lead to n8n for AI-powered cargo-type classification and CRM routing.

---

## Architecture

```
/delivery-calculator          ← Next.js page (Server Component)
  └── <CalculatorForm />      ← Client Component (5-step wizard)
        └── POST /api/calculator/submit   ← API route → n8n webhook
```

---

## File Structure

| File | Role |
|------|------|
| `lib/calculator/types.ts` | Shared TypeScript types, label maps, constants |
| `app/api/calculator/submit/route.ts` | POST handler → n8n → fallback |
| `components/calculator/CalculatorForm.tsx` | 5-step form (named export) |
| `app/delivery-calculator/page.tsx` | Page with metadata, Header, Footer |

---

## API Endpoint

### `POST /api/calculator/submit`

**Request body:**

```json
{
  "name": "Иван",
  "phone": "+7 777 000 00 00",
  "telegram": "@ivan",
  "email": "ivan@example.com",
  "product_name": "Велосипеды горные",
  "category": "Оборудование",
  "product_link": "https://1688.com/...",
  "quantity": "50 шт.",
  "weight_kg": "300",
  "volume_m3": "2.5",
  "packages_count": "10",
  "country_from": "China",
  "city_from": "Guangzhou",
  "country_to": "Russia",
  "city_to": "Москва",
  "service_type": "delivery_only"
}
```

**Response (success):**

```json
{
  "ok": true,
  "cargo_type": "consolidation",
  "priority": "WARM",
  "reason": "Объём груза подходит для сборной доставки (LCL).",
  "lead_id": "uuid-v4"
}
```

**cargo_type values:** `consolidation` | `container` | `air` | `special`

**Fallback (n8n unavailable):** Returns `cargo_type: "consolidation"` with a generic reason.
HTTP 200 is always returned for valid submissions.

---

## Data Types

### `DeliveryCalculation`

Represents the full lead object sent to n8n and stored in CRM:

```typescript
{
  id: string;          // UUID v4, generated server-side
  created_at: string;  // ISO 8601
  client: { name, phone, telegram, email };
  cargo: { product_name, category, product_link, quantity, weight_kg, volume_m3, packages_count };
  route: { country_from, city_from, country_to, city_to };
  service_type: ServiceType;
  source: 'delivery_calculator';
}
```

---

## n8n Integration

### Webhook

- **URL:** `${N8N_BASE_URL}/webhook/chinabridge-calculator`
- **Method:** POST
- **Content-Type:** `application/json`
- **Timeout:** 28 seconds (AbortSignal)

### Recommended n8n Workflow Logic

1. Receive webhook payload
2. Classify `cargo_type` using AI node:
   - `air` if `weight_kg < 50` AND urgent
   - `container` if `volume_m3 > 20` OR `weight_kg > 5000`
   - `special` if category is heavy equipment/oversized
   - `consolidation` otherwise (default)
3. Set `priority`: HOT / WARM / COLD based on weight, service_type, quantity
4. Generate `lead_id` (or echo the received `id`)
5. Save to CRM (Supabase or internal DB)
6. Return JSON: `{ cargo_type, priority, reason, lead_id }`

### n8n Response Schema

```json
{
  "cargo_type": "consolidation | container | air | special",
  "priority": "HOT | WARM | COLD",
  "reason": "Human-readable explanation (Russian)",
  "lead_id": "uuid"
}
```

---

## CRM Integration

Calculator leads arrive in the CRM with `source: "delivery_calculator"`.

They can be differentiated from regular leads (source: `"website"` or `"chat"`) in the admin
dashboard at `/admin/leads`. The `service_type` field indicates which service the client needs.

---

## Proposal Engine Integration

To generate a PDF proposal from a calculator lead:

1. Locate the lead in CRM by `lead_id`
2. Use `POST /api/proposals/create` with the lead data
3. Download via `GET /api/proposals/download/[id]`

The calculator lead's `cargo_type` and `service_type` fields map to proposal templates in
`lib/proposals/templates.ts`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_BASE_URL` | `https://n8n.arendadom24.ru` | Base URL for n8n instance |

Set in `.env.local`:

```
N8N_BASE_URL=https://n8n.arendadom24.ru
```

---

## How to Test

1. **Run dev server:**
   ```
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/delivery-calculator`

3. **Complete the 5-step form:**
   - Step 1: Enter product name (required), select category
   - Step 2: Enter weight/volume/packages (all optional)
   - Step 3: Select departure city, destination country, enter city
   - Step 4: Choose service type card
   - Step 5: Enter name + phone (required), submit

4. **Expected result:** Result card appears with `cargo_type` icon, label, and reason.

5. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/calculator/submit \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","phone":"+7999","product_name":"Bikes","city_to":"Moscow"}'
   ```

6. **Validate n8n webhook:** Check n8n execution logs at your n8n instance.

---

## Form Steps Summary

| Step | Title | Required Fields | Optional Fields |
|------|-------|----------------|-----------------|
| 1 | Товар | product_name | category, product_link, quantity |
| 2 | Груз | — | weight_kg, volume_m3, packages_count |
| 3 | Маршрут | city_to | city_from, country_to |
| 4 | Услуга | — (default: delivery_only) | service_type |
| 5 | Контакты | name, phone | telegram, email |
