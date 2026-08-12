import { NextRequest, NextResponse } from "next/server";
import { Lead, LeadInput, LeadApiResponse, LeadApiError } from "@/lib/types/lead";
import { sendLead } from "@/lib/webhook/n8n";
import { createLead } from "@/lib/crm/client";

async function notifyManagerTelegram(lead: Lead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const tg = (s: string) => s.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
  const lines = [
    "🔥 *Новый лид на ChinaBridge*",
    "",
    `👤 *Имя:* ${tg(lead.name)}`,
    `📞 *Телефон:* ${tg(lead.phone)}`,
    lead.telegram ? `✈️ *Telegram:* ${tg(lead.telegram)}` : null,
    `📦 *Товар:* ${tg(lead.product)}`,
    lead.link ? `🔗 ${tg(lead.link)}` : null,
    lead.weight ? `⚖️ *Вес:* ${tg(lead.weight)}` : null,
    lead.from_city || lead.to_city
      ? `🗺 *Маршрут:* ${tg(lead.from_city ?? "Китай")} → ${tg(lead.to_city ?? "—")}` : null,
    `📍 *Источник:* ${tg(lead.source)}`,
    "",
    `🆔 \`${lead.id.slice(0, 8)}\``,
  ].filter(Boolean).join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "MarkdownV2" }),
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Required fields — phone is optional for lead-magnet/bot sources
const REQUIRED: (keyof LeadInput)[] = ["name", "product", "source"];
const REQUIRES_PHONE: (keyof LeadInput)[] = ["phone"];

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

  // Phone required unless lead-magnet source
  const noPhoneSource = ["LEAD_MAGNET_FREE", "telegram_bot"].includes(b.source as string);
  if (!noPhoneSource) {
    for (const field of REQUIRES_PHONE) {
      if (!b[field] || typeof b[field] !== "string" || !(b[field] as string).trim()) {
        errors[field] = `${field} is required`;
      }
    }
  }

  // Phone basic check (not required for lead magnet sources)
  const noPhoneRequired = ["LEAD_MAGNET_FREE", "telegram_bot"].includes(b.source as string);
  if (!noPhoneRequired && !errors.phone && typeof b.phone === "string") {
    const digits = b.phone.replace(/\D/g, "");
    if (digits.length < 10) errors.phone = "phone must have at least 10 digits";
  }

  // Source whitelist
  const allowedSources = ["website_form", "website_chat", "api", "LEAD_MAGNET_FREE", "telegram_bot"];
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

  // Save to Neon
  try {
    await createLead({
      lead_id:            lead.id,
      created_at:         lead.created_at,
      updated_at:         lead.created_at,
      name:               lead.name,
      phone:              lead.phone,
      telegram:           lead.telegram ?? "",
      email:              "",
      company:            "",
      product:            lead.product,
      product_link:       lead.link ?? "",
      category:           "",
      quantity:           "",
      weight:             lead.weight ?? "",
      volume:             lead.volume ?? "",
      country_destination: "",
      city_destination:   lead.to_city ?? "",
      delivery_type:      lead.service ?? "",
      service_type:       "",
      status:             "NEW",
      priority:           "WARM",
      estimated_value:    0,
      manager:            "",
      comment:            "",
      source:             lead.source,
      utm_source:         "",
      utm_campaign:       "",
    });
  } catch (err) {
    console.error("[POST /api/leads] Neon save failed:", err);
  }

  // Fire-and-forget: n8n webhook
  sendLead(lead).catch((err) =>
    console.error("[POST /api/leads] n8n webhook failed:", err)
  );

  // Fire-and-forget: Telegram notification to manager
  notifyManagerTelegram(lead).catch(() => {});

  return NextResponse.json<LeadApiResponse>({ ok: true, id: lead.id }, { status: 201 });
}
