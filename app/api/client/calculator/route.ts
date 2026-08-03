import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { calculateDeliveryCost } from "@/lib/rate-engine/rate-calculator";
import { saveClientCalculation } from "@/lib/client-portal/api";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const CITY_COUNTRIES: Record<string, string> = {
  Москва: "Russia",
  "Санкт-Петербург": "Russia",
  Новосибирск: "Russia",
  Екатеринбург: "Russia",
  Благовещенск: "Russia",
  Хабаровск: "Russia",
  Алматы: "Kazakhstan",
  Астана: "Kazakhstan",
};

async function getAIRec(prompt: string): Promise<string> {
  const base = process.env.OPENROUTER_BASE_URL;
  const key = process.env.OPENROUTER_API_KEY;
  if (!base || !key) return "";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

function fmtDays(min?: number, max?: number) {
  if (min && max) return `${min}–${max} дней`;
  if (min) return `от ${min} дней`;
  return "уточняйте";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as {
    city_from: string;
    city_to: string;
    product_name: string;
    product_category: string;
    weight: number;
    volume: number;
    packages: number;
  };

  const { city_from, city_to, product_name, product_category, weight, volume, packages } = body;

  const base = {
    country_from: "China",
    city_from,
    country_to: CITY_COUNTRIES[city_to] ?? "Russia",
    city_to,
    weight: weight || undefined,
    volume: volume || undefined,
    packages: packages || undefined,
  };

  const [truckR, airR, seaR] = await Promise.allSettled([
    calculateDeliveryCost({ ...base, transport_type: "truck" }),
    calculateDeliveryCost({ ...base, transport_type: "air" }),
    calculateDeliveryCost({ ...base, transport_type: "sea" }),
  ]);

  const truck = truckR.status === "fulfilled" ? truckR.value : null;
  const air   = airR.status   === "fulfilled" ? airR.value   : null;
  const sea   = seaR.status   === "fulfilled" ? seaR.value   : null;

  const aiRec = await getAIRec(
    `Ты эксперт по международной логистике из Китая. Дай краткую рекомендацию (2-3 предложения) на русском языке.

Маршрут: ${city_from} (Китай) → ${city_to}
Товар: ${product_name || product_category}, категория: ${product_category}
Вес: ${weight} кг, объём: ${volume} м³

Варианты доставки:
🚛 Авто: ${truck?.total_cost ? `$${truck.total_cost}` : "нет данных"}, ${fmtDays(truck?.delivery_days_min, truck?.delivery_days_max)}
✈️ Авиа: ${air?.total_cost ? `$${air.total_cost}` : "нет данных"}, ${fmtDays(air?.delivery_days_min, air?.delivery_days_max)}
🚢 Море: ${sea?.total_cost ? `$${sea.total_cost}` : "нет данных"}, ${fmtDays(sea?.delivery_days_min, sea?.delivery_days_max)}

Что рекомендуешь и почему? Учти тип товара и соотношение цены и сроков.`
  );

  const best = [truck, air, sea].find((r) => r && r.total_cost > 0);
  const bestType = truck?.total_cost ? "truck" : air?.total_cost ? "air" : "sea";
  const calcId = randomUUID();

  if (best && best.total_cost > 0) {
    await saveClientCalculation({
      calc_id: calcId,
      client_id: session.clientId,
      city_from,
      city_to,
      product_name: product_name || product_category,
      product_category,
      weight: weight ?? 0,
      volume: volume ?? 0,
      transport_type: bestType,
      total_cost: best.total_cost,
      currency: best.currency,
      delivery_days_min: best.delivery_days_min,
      delivery_days_max: best.delivery_days_max,
      status: "calculated",
    });
  }

  return NextResponse.json({ calc_id: calcId, truck, air, sea, ai_recommendation: aiRec });
}
