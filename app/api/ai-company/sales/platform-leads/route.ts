import { NextRequest, NextResponse } from "next/server";
import type { PlatformLead } from "@/lib/ai-company/sales/types";
import { isAuthorized } from "@/lib/api-auth";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";
const TABLE_ID = process.env.N8N_PLATFORM_LEADS_TABLE_ID ?? "qIt6WfrUTVWsi1pV";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: "fetch failed" }, { status: 500 });
  const json = await res.json().catch(() => ({}));
  const rows = Array.isArray(json) ? json : (json.data ?? []);
  return NextResponse.json({ ok: true, leads: rows });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Partial<PlatformLead>;
  const now = new Date().toISOString();

  const fields: Omit<PlatformLead, "id"> = {
    lead_id: crypto.randomUUID(),
    company: body.company ?? "",
    website: body.website ?? "",
    city: body.city ?? "",
    country: body.country ?? "Россия",
    business_type: body.business_type ?? "Карго",
    contact_name: body.contact_name ?? "",
    email: body.email ?? "",
    telegram: body.telegram ?? "",
    phone: body.phone ?? "",
    lead_score: Number(body.lead_score ?? 50),
    opportunity: body.opportunity ?? "MEDIUM",
    status: "new",
    ai_comment: body.ai_comment ?? "",
    ai_offer: body.ai_offer ?? "ChinaBridge Platform Demo",
    source: body.source ?? "manual",
    created_at: now,
    updated_at: now,
  };

  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [fields] }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: "save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, lead: fields });
}
