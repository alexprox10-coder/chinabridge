import { NextRequest, NextResponse } from "next/server";
import type { DocRenderData, DocumentType } from "@/lib/documents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY  ?? "";
const FIN_TBL  = process.env.N8N_FINANCE_ORDERS_TABLE_ID ?? "7GcFnGcjaEm0lKWI";

async function fetchRows<T>(tableId: string): Promise<T[]> {
  if (!tableId) return [];
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return (data?.data?.rows ?? data?.data ?? data?.rows ?? []) as T[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type   = searchParams.get("type") as DocumentType | null;
    const leadId = searchParams.get("lead_id");
    const num    = searchParams.get("num") ?? "DOC-001";

    if (!type || !leadId) {
      return NextResponse.json({ error: "type and lead_id required" }, { status: 400 });
    }

    // Dynamic imports — errors are caught by outer try-catch
    const [
      { renderToBuffer },
      { getCompanySettings },
      { InvoicePDF },
      { ContractPDF },
      { ActPDF },
      { InvoiceImportPDF },
      { PackingListPDF },
      { PowerAttorneyPDF },
      finRows,
    ] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/documents/api"),
      import("@/lib/documents/pdf/invoice"),
      import("@/lib/documents/pdf/contract"),
      import("@/lib/documents/pdf/act"),
      import("@/lib/documents/pdf/invoice-import"),
      import("@/lib/documents/pdf/packing-list"),
      import("@/lib/documents/pdf/power-attorney"),
      fetchRows<Record<string, unknown>>(FIN_TBL),
    ]);

    const company = await getCompanySettings();
    const fin = finRows.find((r) => r.lead_id === leadId) ?? {};
    const docDate = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

    const data: DocRenderData = {
      company,
      document_number: num,
      document_date:   docDate,
      client_name:    (fin.client_name  as string) || `Клиент #${leadId}`,
      client_inn:     (fin.client_inn   as string) || undefined,
      client_phone:   (fin.client_phone as string) || undefined,
      client_email:   (fin.client_email as string) || undefined,
      client_address: (fin.client_address as string) || undefined,
      client_company: (fin.client_company as string) || undefined,
      product:       (fin.product as string)  || "Товары из Китая",
      quantity:      (fin.quantity as string) || undefined,
      weight:        Number(fin.weight)       || undefined,
      volume:        Number(fin.volume)       || undefined,
      route:         (fin.route as string)    || undefined,
      goods_cost:    Number(fin.goods_cost)    || 0,
      delivery_cost: Number(fin.delivery_cost) || 0,
      services_cost: Number(fin.services_cost) || 0,
      bank_fee:      Number(fin.bank_fee)      || 0,
      customs_cost:  Number(fin.customs_cost)  || 0,
      client_price:  Number(fin.client_price)  || 0,
      currency:      (fin.currency as string)  || "USD",
      lead_id:       leadId,
      manager:       (fin.manager as string)   || undefined,
    };

    const generators: Record<DocumentType, (d: DocRenderData) => unknown> = {
      invoice:        InvoicePDF,
      contract:       ContractPDF,
      act:            ActPDF,
      invoice_import: InvoiceImportPDF,
      packing_list:   PackingListPDF,
      power_attorney: PowerAttorneyPDF,
    };

    const gen = generators[type];
    if (!gen) return NextResponse.json({ error: "Unknown document type" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(gen(data) as any);

    const filename = `chinabridge_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message + "\n" + e.stack : String(e);
    return NextResponse.json({ error: "pdf_failed", detail: msg }, { status: 500 });
  }
}
