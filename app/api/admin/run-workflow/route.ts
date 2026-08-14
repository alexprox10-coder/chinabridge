import { NextRequest, NextResponse } from "next/server";
import { isAdminOnly } from "@/lib/api-auth";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOWS: Record<string, { id: string; name: string }> = {
  "wb-email-discovery": { id: "D3v9HIBXZZvJm795", name: "WB → Email Discovery" },
  "wb-vk-phones":       { id: "RxSuo9qqpieoI3l4", name: "WB → VK Phone Audience" },
};

export async function POST(req: NextRequest) {
  if (!isAdminOnly(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let key: string;
  try {
    const body = await req.json();
    key = body.workflow;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const wf = WORKFLOWS[key];
  if (!wf) return NextResponse.json({ error: "unknown_workflow" }, { status: 400 });

  if (!N8N_KEY) return NextResponse.json({ error: "n8n_not_configured" }, { status: 500 });

  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows/${wf.id}/execute`, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      workflow: wf.name,
      executionId: data.executionId ?? data.id ?? null,
      status: res.status,
    });
  } catch (e) {
    return NextResponse.json({ error: "n8n_unreachable", detail: String(e) }, { status: 502 });
  }
}
