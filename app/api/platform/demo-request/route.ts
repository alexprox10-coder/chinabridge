import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function escapeNonAscii(s: string): string {
  return s.replace(/[^\x00-\x7F]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const N8N_URL = process.env.N8N_WEBHOOK_URL ?? "";
  const payload = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    source: "PLATFORM_DEMO_REQUEST",
    name: body.name ?? "",
    company: body.company ?? "",
    contact: body.contact ?? "",
    clients_per_month: body.clients ?? "",
    phone: body.contact ?? "",
    telegram: body.contact ?? "",
    product: "ChinaBridge Platform Demo",
    priority: "HOT",
  };

  if (N8N_URL) {
    try {
      await fetch(N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: escapeNonAscii(JSON.stringify({ event: "platform.demo_request", lead: payload })),
        signal: AbortSignal.timeout(6000),
      });
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ ok: true });
}
