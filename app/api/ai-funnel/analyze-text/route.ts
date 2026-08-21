import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/ai/client";

export const runtime     = "nodejs";
export const maxDuration = 20;

const SYSTEM = `You are a China sourcing expert. Given a product description in Russian or English, estimate typical values for that product on 1688.com.

Return ONLY valid JSON, no markdown, no explanation:
{
  "product_name": "short clean product name in Russian",
  "product_name_cn": "Chinese (Simplified) product name for 1688.com search — 2-4 characters, exact category keyword used on 1688",
  "product_name_en": "short English product name for Alibaba search",
  "unit_price_cny": <number, typical factory price in CNY on 1688 for 1 unit>,
  "weight_kg": <number, typical weight per unit in kg>,
  "moq": <number, typical minimum order quantity>,
  "confidence": { "overall": "medium" }
}

Rules:
- product_name_cn: use the most common 1688 search keyword in Chinese. E.g. наушники TWS → 蓝牙耳机, кроссовки → 运动鞋, органайзер кухонный → 厨房收纳
- unit_price_cny: factory wholesale price on 1688, NOT retail. Be realistic.
- weight_kg: per single unit (not per box)
- moq: typical MOQ for this product category on 1688
- Always return numbers, never null`;

export async function POST(req: NextRequest) {
  const { description } = await req.json().catch(() => ({}) as { description?: string });

  if (!description || typeof description !== "string" || description.trim().length < 2) {
    return NextResponse.json({ ok: false, error: "description_required" }, { status: 400 });
  }

  try {
    const raw = await callLLM(SYSTEM, [
      { role: "user", content: `Product: ${description.trim().slice(0, 200)}` },
    ]);

    const data = JSON.parse(raw);

    if (!data.product_name || data.unit_price_cny == null) {
      throw new Error("incomplete_response");
    }

    return NextResponse.json({
      ok: true,
      data: {
        product_name:    String(data.product_name),
        product_name_cn: String(data.product_name_cn ?? ""),
        product_name_en: String(data.product_name_en ?? data.product_name),
        unit_price_cny:  Number(data.unit_price_cny),
        weight_kg:       Number(data.weight_kg)  || 0.5,
        moq:             Number(data.moq)        || 1,
        price_currency:  "CNY",
        source_platform: "description",
        confidence:      { overall: "medium" },
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "analysis_failed" }, { status: 500 });
  }
}
