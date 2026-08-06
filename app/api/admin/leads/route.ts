import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { getLeads, getDashboardStats } from "@/lib/crm/client";
import { isAuthorized } from "@/lib/api-auth";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";
const TABLE_ID = process.env.N8N_IMPORT_LEADS_TABLE_ID ?? "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const stats = searchParams.get("stats") === "1";

  if (stats) {
    const data = await getDashboardStats();
    return NextResponse.json(data);
  }

  const leads = await getLeads({ status, priority });
  return NextResponse.json(leads);
}

export async function DELETE(req: NextRequest) {
  const store   = await cookies();
  const isAdmin = store.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const system = searchParams.get("system");
  const db     = neon(process.env.DATABASE_URL!);

  if (system === "mi") {
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    await db`DELETE FROM mi_leads WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  }

  if (system === "import") {
    const leadId = searchParams.get("lead_id");
    const n8nId  = searchParams.get("n8n_id");

    if (leadId) {
      await db`DELETE FROM import_lead_statuses WHERE lead_id = ${leadId}`.catch(() => {});
    }

    if (n8nId && TABLE_ID && N8N_KEY) {
      await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/${n8nId}`, {
        method:  "DELETE",
        headers: { "X-N8N-API-KEY": N8N_KEY },
        signal:  AbortSignal.timeout(5000),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "invalid system" }, { status: 400 });
}
