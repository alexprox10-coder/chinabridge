import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/crm/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, phone, product, market } = body as {
    name: string; phone: string; product?: string; market?: string;
  };

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "name and phone required" }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();
    await createLead({
      lead_id:            crypto.randomUUID(),
      created_at:         now,
      updated_at:         now,
      name,
      phone,
      telegram:           "",
      email:              "",
      company:            "",
      product:            product ? `Фулфилмент: ${product}` : "Фулфилмент для маркетплейсов",
      product_link:       "",
      category:           market || "fulfilment",
      quantity:           "",
      weight:             "",
      volume:             "",
      country_destination: "RU",
      city_destination:   "",
      delivery_type:      "fulfilment",
      service_type:       "fulfilment",
      status:             "NEW",
      priority:           "WARM",
      estimated_value:    0,
      manager:            "",
      comment:            `Маркетплейс: ${market || "—"}. Товар: ${product || "—"}`,
      source:             "FULFILMENT_PAGE",
      utm_source:         "organic",
      utm_campaign:       "fulfilment",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("fulfilment-lead:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
