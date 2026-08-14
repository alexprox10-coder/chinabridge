import { NextRequest, NextResponse } from "next/server";
import { isAdminOnly } from "@/lib/api-auth";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOWS: Record<string, { webhook: string; name: string }> = {
  "wb-email-discovery": { webhook: `${N8N_BASE}/webhook/wb-email-discovery`, name: "WB → Email Discovery" },
  "wb-vk-phones":       { webhook: `${N8N_BASE}/webhook/wb-vk-phones`,       name: "WB → VK Phone Audience" },
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

  try {
    const res = await fetch(wf.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true, workflow: wf.name, executionId: null });
    }
    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, error: `n8n_error_${res.status}`, detail: text }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: "n8n_unreachable", detail: String(e) }, { status: 502 });
  }
}
