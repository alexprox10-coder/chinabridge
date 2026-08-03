import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

function escapeNonAscii(json: string): string {
  return json.replace(/[^\x00-\x7F]/g, (c) =>
    "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

interface FreeLeadInput {
  name: string;
  telegram: string;
  product: string;
  country?: string;
  volume?: string;
}

function validate(body: unknown): { input: FreeLeadInput; errors: Record<string, string> } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!b.name || typeof b.name !== "string" || !b.name.trim()) {
    errors.name = "name is required";
  }
  if (!b.telegram || typeof b.telegram !== "string" || !b.telegram.trim()) {
    errors.telegram = "telegram is required";
  }
  if (!b.product || typeof b.product !== "string" || !b.product.trim()) {
    errors.product = "product is required";
  }

  if (Object.keys(errors).length > 0) return { input: {} as FreeLeadInput, errors };

  return {
    input: {
      name:     (b.name     as string).trim(),
      telegram: (b.telegram as string).trim(),
      product:  (b.product  as string).trim(),
      country:  typeof b.country === "string" ? b.country.trim() || undefined : undefined,
      volume:   typeof b.volume  === "string" ? b.volume.trim()  || undefined : undefined,
    },
    errors: {},
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = validate(body);
  if (!result) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (Object.keys(result.errors).length > 0) {
    return NextResponse.json({ ok: false, error: "validation_failed", details: result.errors }, { status: 400 });
  }

  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }

  const lead = {
    id:              crypto.randomUUID(),
    created_at:      new Date().toISOString(),
    source:          "LEAD_MAGNET_FREE",
    phone:           "",
    payment_status:  "UNPAID",
    payment_currency: "",
    payment_amount:  "",
    supplier_name:   "",
    exchange_rate:   "",
    payment_date:    "",
    ...result.input,
  };

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_WEBHOOK_SECRET ? { "x-webhook-secret": N8N_WEBHOOK_SECRET } : {}),
      },
      body: escapeNonAscii(JSON.stringify({ event: "lead.created", lead })),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[POST /api/free] n8n webhook failed:", res.status, text);
      return NextResponse.json({ ok: false, error: "webhook_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[POST /api/free] webhook error:", err);
    return NextResponse.json({ ok: false, error: "webhook_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
