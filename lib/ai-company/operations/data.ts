import type {
  Deal, Partner, CargoItem, DocumentRecord, ClientRecord,
  OperationsKPIs, OperationsDirectorReport,
} from "./types";
import { detectRisks, calculateHealth } from "./risk";

// ── CRM → Operations mappers ───────────────────────────────────────────────

function crmStatusToDealStatus(crmStatus: string): Deal["status"] {
  const map: Record<string, Deal["status"]> = {
    NEW:           "NEW",
    CONTACTED:     "PURCHASE",
    QUALIFICATION: "PURCHASE",
    CALCULATION:   "PURCHASE",
    OFFER_SENT:    "CHINA_WAREHOUSE",
    NEGOTIATION:   "SHIPPING",
    PAYMENT:       "SHIPPING",
    DELIVERY:      "CUSTOMS",
    SUCCESS:       "DELIVERED",
  };
  return map[crmStatus] ?? "NEW";
}

function crmPriorityToRisk(priority: string): Deal["riskLevel"] {
  if (priority === "HOT")  return "HIGH";
  if (priority === "WARM") return "MEDIUM";
  return "LOW";
}

// ── Live data from CRM ──────────────────────────────────────────────────────

async function fetchFromCRM(): Promise<{
  deals: Deal[];
  clients: ClientRecord[];
  connected: boolean;
}> {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    const rows: Array<Record<string, unknown>> = await sql`
      SELECT
        lead_id, name, company, product, status, priority,
        estimated_value, country_destination, city_destination,
        service_type, created_at, updated_at, comment, source
      FROM crm_leads
      WHERE tenant_id = 'tenant-chinabridge'
        AND status NOT IN ('LOST')
      ORDER BY created_at DESC
      LIMIT 50
    `;

    if (rows.length === 0) return { deals: [], clients: [], connected: true };

    const deals: Deal[] = rows.map((r, i) => {
      const dest = [r.city_destination, r.country_destination]
        .filter(Boolean).join(", ") || "Россия";
      return {
        id:           String(r.lead_id ?? `D-${i + 1}`),
        clientName:   String(r.name ?? r.company ?? "—"),
        supplierName: "Китай",
        product:      String(r.product ?? r.service_type ?? "—"),
        status:       crmStatusToDealStatus(String(r.status ?? "NEW")),
        weight:       0,
        route:        `Китай → ${dest}`,
        eta:          r.status === "DELIVERY" ? 7 : r.status === "SHIPPING" ? 14 : 21,
        value:        Number(r.estimated_value ?? 0),
        startDate:    String(r.created_at ?? "").slice(0, 10),
        riskLevel:    crmPriorityToRisk(String(r.priority ?? "COLD")),
        notes:        String(r.comment ?? ""),
      };
    });

    // Unique clients
    const seen = new Set<string>();
    const clients: ClientRecord[] = [];
    for (const r of rows) {
      const name = String(r.name ?? r.company ?? "—");
      if (seen.has(name)) continue;
      seen.add(name);
      const updatedAt = new Date(String(r.updated_at ?? r.created_at ?? 0)).getTime();
      const daysSince  = Math.floor((Date.now() - updatedAt) / 86400000);
      clients.push({
        id:            String(r.lead_id ?? `CL-${clients.length + 1}`),
        name,
        status:        daysSince > 14 ? "AT_RISK" : "ACTIVE",
        lastContactDays: daysSince,
        satisfaction:  80,
        repeatOrders:  1,
        activeDeals:   rows.filter(x => x.name === r.name && x.status !== "SUCCESS").length,
        recommendation: daysSince > 7
          ? `Связаться — нет активности ${daysSince} дней`
          : "Клиент в работе",
        riskLevel:     daysSince > 14 ? "HIGH" : "LOW",
      });
    }

    return { deals, clients, connected: true };
  } catch {
    return { deals: [], clients: [], connected: false };
  }
}

// ── KPIs from real or empty data ───────────────────────────────────────────

function buildKPIs(deals: Deal[], cargos: CargoItem[]): OperationsKPIs {
  return {
    activeDeals:     deals.filter(d => d.status !== "DELIVERED").length,
    activeCargo:     cargos.filter(c => c.status !== "DELIVERED").length,
    inPurchase:      deals.filter(d => d.status === "PURCHASE").length,
    inLogistics:     deals.filter(d => d.status === "SHIPPING").length,
    inCustoms:       deals.filter(d => d.status === "CUSTOMS").length,
    delivered:       deals.filter(d => d.status === "DELIVERED").length,
    problems:        deals.filter(d => d.riskLevel === "HIGH").length,
    avgDeliveryDays: deals.length > 0 ? 14 : 0,
  };
}

// ── Export ─────────────────────────────────────────────────────────────────

export interface OperationsData {
  deals: Deal[];
  partners: Partner[];
  cargos: CargoItem[];
  documents: DocumentRecord[];
  clients: ClientRecord[];
  kpis: OperationsKPIs;
  health: ReturnType<typeof calculateHealth>;
  risks: ReturnType<typeof detectRisks>;
  connected: boolean;
}

export async function fetchOperationsData(): Promise<OperationsData> {
  const { deals, clients, connected } = await fetchFromCRM();

  // No partner/cargo/document data from CRM yet — return empty
  const partners:  Partner[]        = [];
  const cargos:    CargoItem[]      = [];
  const documents: DocumentRecord[] = [];

  const risks  = detectRisks(deals, cargos, documents, clients);
  const health = calculateHealth(deals, cargos, documents, clients, risks);
  const kpis   = buildKPIs(deals, cargos);

  return {
    deals, partners, cargos, documents, clients,
    kpis, health, risks, connected,
  };
}

export type { OperationsDirectorReport };
