# Smart Logistics Proposal Engine

## Architecture Overview

PDF proposal generator for logistics quotes, integrated into the ChinaBridge CRM admin panel.

Three modes:
- **EXPRESS** — 1 page (Cover + combined content page). Fast client response.
- **BUSINESS** — 3-5 pages (Cover + Client/Cargo + Benefits/Assessment + Contacts). Default.
- **ENTERPRISE** — Extended (Cover + Client/Cargo + Benefits/Process + WhyCB/Assessment + Contacts). For large clients.

## File Structure

```
lib/proposals/
  types.ts          — TypeScript types (ProposalMode, ProposalStatus, ServiceKey, etc.)
  templates.ts      — Loads .md files, parses YAML frontmatter, returns ServiceTemplate
  numbering.ts      — Generates proposal numbers (CB-YYYY-NNNN)
  sections.ts       — Static content: WHY_CHINABRIDGE, COOPERATION_STEPS, CONTACTS, FIELD_LABELS
  generator.ts      — Main generator: takes CRMLead + mode → ProposalContext + PDF buffer
  crm.ts            — n8n DataTable webhook client: saveProposal, getProposals, getProposal
  pdf/
    fonts.ts        — Registers Roboto (Latin + Cyrillic woff2) with @react-pdf/renderer
    styles.ts       — StyleSheet constants for the PDF
    document.tsx    — React component tree rendered by @react-pdf/renderer

proposal-templates/
  consolidation.md  — LCL / Сборный груз
  container.md      — FCL / Контейнер
  supplier-search.md — Поиск поставщика
  inspection.md     — Инспекция
  cargo.md          — Карго
  1688-buyout.md    — Выкуп с 1688
  general.md        — Комплексная логистика (fallback)

public/fonts/
  Roboto-Regular-Latin.woff2
  Roboto-Regular-Cyrillic.woff2
  Roboto-Bold-Latin.woff2
  Roboto-Bold-Cyrillic.woff2
  Roboto-Light-Latin.woff2
  Roboto-Light-Cyrillic.woff2

app/api/proposals/
  create/route.ts           — POST: generates PDF from leadId + mode, saves to n8n
  [id]/route.ts             — GET: returns proposal metadata
  download/[id]/route.ts    — GET: regenerates and streams PDF for download

app/admin/proposals/
  page.tsx          — Lists all proposals from n8n DataTable

components/admin/
  ProposalButton.tsx — Client component with modal (mode selector + create + download)
```

## Templates System

Templates are `.md` files with YAML frontmatter:

```yaml
---
title: Service name
deliveryTime: 25–45 days
benefits:
  - Benefit 1
  - Benefit 2
processSteps:
  - Step 1
  - Step 2
---

Body text in Russian.
```

### Adding a new template

1. Create `proposal-templates/your-key.md` with the YAML frontmatter above.
2. Add `'your-key'` to the `ServiceKey` union type in `lib/proposals/types.ts`.
3. Add detection keywords to `detectServiceKey()` in `lib/proposals/templates.ts`.

## API Reference

### POST /api/proposals/create
```json
{ "leadId": 123, "mode": "BUSINESS", "createdBy": "manager" }
```
Response:
```json
{ "ok": true, "proposalId": "uuid", "proposalNumber": "CB-2026-1234", "downloadUrl": "/api/proposals/download/uuid" }
```

### GET /api/proposals/[id]
Returns `ProposalRecord` JSON object.

### GET /api/proposals/download/[id]
Streams a PDF file (`Content-Type: application/pdf`).

## PDF Modes

| Mode       | Pages | Use case                |
|------------|-------|-------------------------|
| EXPRESS    | 2     | Quick client reply      |
| BUSINESS   | 4     | Standard proposal       |
| ENTERPRISE | 5     | Key account proposal    |

## n8n Integration

Three webhook endpoints (configured in `N8N_BASE_URL`):

| Webhook                    | Method | Purpose                        |
|----------------------------|--------|--------------------------------|
| `/webhook/crm-save-proposal` | POST | Save proposal record to table |
| `/webhook/crm-proposals`   | POST   | List/get proposals             |

Payload for `crm-save-proposal`:
```json
{
  "proposal_id": "uuid",
  "proposal_number": "CB-2026-1234",
  "lead_id": "123",
  "lead_name": "Client Name",
  "proposal_type": "BUSINESS",
  "service_type": "consolidation",
  "lead_data": "{...JSON snapshot...}",
  "created_at": "2026-01-01T00:00:00Z",
  "created_by": "manager",
  "status": "ready"
}
```

## Environment Variables

```env
N8N_BASE_URL=https://n8n.arendadom24.ru   # n8n instance base URL
```

## Testing

1. Start dev server: `npm run dev`
2. Open any lead in admin: `/admin/leads/[id]`
3. Click "Подготовить расчет" button in the lead header
4. Select mode (EXPRESS / BUSINESS / ENTERPRISE) and click "Создать PDF"
5. Download the PDF using the "Скачать PDF" button
6. View all proposals at `/admin/proposals`

To test the API directly:
```bash
curl -X POST http://localhost:3000/api/proposals/create \
  -H "Content-Type: application/json" \
  -d '{"leadId": 1, "mode": "BUSINESS"}'
```

## Adding New Proposal Types

1. Create `.md` template file in `proposal-templates/`
2. Add key to `ServiceKey` type in `types.ts`
3. Add detection logic in `templates.ts` → `detectServiceKey()`
4. Optionally add specific sections to `document.tsx` for the new service type
