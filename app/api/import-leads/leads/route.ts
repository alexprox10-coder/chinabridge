import { NextRequest, NextResponse } from "next/server";
import { getAllLeads, updateLeadStatus } from "@/lib/import-leads/crm";
import { createLead } from "@/lib/crm/client";
import type { LeadStatus, ImportLead } from "@/lib/import-leads/types";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  return !!(
    req.cookies.get("cb_admin")?.value ||
    req.cookies.get("cb_tenant_session")?.value
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") ?? "chinabridge";
  const leads = await getAllLeads(companyId);
  return NextResponse.json({ ok: true, leads });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: { id: number; status: LeadStatus; lead?: ImportLead };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }

  const updateResult = await updateLeadStatus(body.id, body.status);
  if (!updateResult.ok) return NextResponse.json({ ok: false, error: updateResult.error ?? "update_failed" }, { status: 500 });

  // When approved → push to main CRM
  let crmLeadId: string | null = null;
  if (body.status === "approved" && body.lead) {
    try {
      const il = body.lead;
      const now = new Date().toISOString();
      const newLead = await createLead({
        lead_id:             `imp-${il.lead_id}`,
        created_at:          now,
        updated_at:          now,
        name:                il.company,
        company:             il.company,
        phone:               il.phone ?? "",
        email:               il.email ?? "",
        telegram:            il.telegram ?? "",
        product:             il.category ?? "",
        product_link:        il.website ?? "",
        category:            il.category ?? "",
        quantity:            "",
        weight:              "",
        volume:              "",
        country_destination: "RU",
        city_destination:    il.city ?? "",
        delivery_type:       "",
        service_type:        "",
        status:              "NEW",
        priority:            "WARM",
        estimated_value:     0,
        manager:             "",
        comment:             `Импорт-лид: ${il.why ?? ""}`,
        source:              `import:${il.source ?? "search"}`,
        utm_source:          "import-leads",
        utm_campaign:        "",
      });
      crmLeadId = newLead.lead_id;
    } catch { /* crm push best-effort */ }
  }

  return NextResponse.json({ ok: true, crmLeadId });
}
