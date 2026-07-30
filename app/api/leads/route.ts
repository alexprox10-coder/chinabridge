import { NextRequest, NextResponse } from "next/server";
import { Lead, LeadInput, LeadApiResponse, LeadApiError } from "@/lib/types/lead";
import { sendLead } from "@/lib/webhook/n8n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Required fields — everything else is optional
const REQUIRED: (keyof LeadInput)[] = ["name", "phone", "product", "source"];

function validate(body: unknown): { input: LeadInput; errors: Record<string, string> } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // Required
  for (const field of REQUIRED) {
    if (!b[field] || typeof b[field] !== "string" || !(b[field] as string).trim()) {
      errors[field] = `${field} is required`;
    }
  }

  // Phone basic check
  if (!errors.phone && typeof b.phone === "string") {
    const digits = b.phone.replace(/\D/g, "");
    if (digits.length < 10) errors.phone = "phone must have at least 10 digits";
  }

  // Source whitelist
  const allowedSources = ["website_form", "website_chat", "api"];
  if (!errors.source && !allowedSources.includes(b.source as string)) {
    errors.source = `source must be one of: ${allowedSources.join(", ")}`;
  }

  if (Object.keys(errors).length > 0) return { input: {} as LeadInput, errors };

  const input: LeadInput = {
    name:      (b.name      as string).trim(),
    phone:     (b.phone     as string).trim(),
    product:   (b.product   as string).trim(),
    source:    b.source     as LeadInput["source"],
    telegram:  typeof b.telegram  === "string" ? b.telegram.trim()  || undefined : undefined,
    link:      typeof b.link      === "string" ? b.link.trim()      || undefined : undefined,
    weight:    typeof b.weight    === "string" ? b.weight.trim()    || undefined : undefined,
    volume:    typeof b.volume    === "string" ? b.volume.trim()    || undefined : undefined,
    from_city: typeof b.from_city === "string" ? b.from_city.trim() || undefined : undefined,
    to_city:   typeof b.to_city   === "string" ? b.to_city.trim()   || undefined : undefined,
    service:   typeof b.service   === "string" ? b.service.trim()   || undefined : undefined,
  };

  return { input, errors: {} };
}

export async function POST(req: NextRequest) {
  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<LeadApiError>(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  // Validate
  const result = validate(body);
  if (!result) {
    return NextResponse.json<LeadApiError>(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }
  if (Object.keys(result.errors).length > 0) {
    return NextResponse.json<LeadApiError>(
      { ok: false, error: "validation_failed", details: result.errors },
      { status: 400 },
    );
  }

  // Build lead
  const lead: Lead = {
    ...result.input,
    id:         crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  // Send to n8n
  try {
    await sendLead(lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : "webhook_error";
    console.error("[POST /api/leads] n8n webhook failed:", message);
    return NextResponse.json<LeadApiError>(
      { ok: false, error: "webhook_failed", details: { reason: message } },
      { status: 502 },
    );
  }

  return NextResponse.json<LeadApiResponse>({ ok: true, id: lead.id }, { status: 201 });
}
