import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY  ?? "";
const DOCS_TBL = "nygdTON30DvcZv6l";

export async function GET() {
  const row = {
    lead_id: "debug-001",
    document_type: "contract",
    document_number: "CNT-2026-DBG",
    created_at: new Date().toISOString(),
    status: "draft",
    file_url: "/debug",
  };

  // First insert a test row to get its ID
  const insertRes = await fetch(`${N8N_BASE}/api/v1/data-tables/${DOCS_TBL}/rows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
  });
  const insertText = await insertRes.text();
  const insertData = JSON.parse(insertText || "null");
  const insertedId = insertData?.data?.[0]?.id ?? insertData?.[0]?.id ?? insertData?.id;

  const patchFormats = [
    { name: "data_obj", body: { data: { status: "sent" } } },
    { name: "data_arr", body: { data: [{ status: "sent" }] } },
    { name: "fields",   body: { fields: { status: "sent" } } },
    { name: "plain",    body: { status: "sent" } },
  ];

  const results: Record<string, unknown> = {
    insert: { status: insertRes.status, id: insertedId },
  };

  if (insertedId) {
    for (const f of patchFormats) {
      const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${DOCS_TBL}/rows/${insertedId}`, {
        method: "PATCH",
        headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(f.body),
      });
      const text = await res.text();
      results[`patch_${f.name}`] = { status: res.status, body: text.slice(0, 300) };
    }
  }

  return NextResponse.json(results);
}
