import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
const FREE_LIMIT = 3;

const CREATE_USES_TABLE = `
  CREATE TABLE IF NOT EXISTS invoice_anon_uses (
    ip TEXT PRIMARY KEY,
    use_count INT NOT NULL DEFAULT 0,
    first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const EXTRACT_PROMPT = `You are a Chinese commercial invoice parser. Analyze this invoice image and extract all data.

Return ONLY valid JSON (no markdown, no explanation):
{
  "supplier_name": "company name in original language",
  "supplier_name_ru": "company name translated to Russian if needed",
  "invoice_number": "invoice/contract number",
  "invoice_date": "YYYY-MM-DD or null",
  "currency": "USD/CNY/EUR/RMB",
  "total_value": 0.0,
  "total_weight_kg": 0.0,
  "total_pieces": 0,
  "incoterms": "FOB/EXW/CIF or null",
  "origin_city": "city in China where goods are from",
  "items": [
    {
      "description_zh": "original Chinese description",
      "description_ru": "Russian translation",
      "hs_code_hint": "HS code if shown or null",
      "quantity": 0,
      "unit": "pcs/kg/box",
      "unit_price": 0.0,
      "total_price": 0.0,
      "weight_kg": 0.0
    }
  ],
  "notes": "any important notes or discrepancies found"
}

If a field is not visible in the document, use null. Translate all Chinese text to Russian in the _ru fields.`;

interface InvoiceItem {
  description_zh: string;
  description_ru: string;
  hs_code_hint: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  weight_kg: number;
}

interface ExtractedInvoice {
  supplier_name: string;
  supplier_name_ru: string;
  invoice_number: string;
  invoice_date: string | null;
  currency: string;
  total_value: number;
  total_weight_kg: number;
  total_pieces: number;
  incoterms: string | null;
  origin_city: string;
  items: InvoiceItem[];
  notes: string;
}

const USD_RUB = 90;
const CNY_USD = 7.2;
const EUR_USD = 1.08;

function toUsd(value: number, currency: string): number {
  const c = (currency ?? "").toUpperCase().replace(/[¥₽]/g, "");
  if (c === "CNY" || c === "RMB") return value / CNY_USD;
  if (c === "EUR") return value * EUR_USD;
  return value; // USD or unknown
}

interface CustomsBreakdown {
  duty: number; vat: number; broker: number; fees: number; total: number;
}

function estimateCustoms(goodsUsd: number, shippingUsd: number, dest: "ru" | "kz", routeId?: string): CustomsBreakdown {
  const cif = goodsUsd + shippingUsd;
  const duty = Math.round(cif * 0.10);
  // РФ: НДС 20%, КЗ: НДС 12%
  const vat  = Math.round((cif + duty) * (dest === "ru" ? 0.20 : 0.12));
  // Хэйхэ: упрощённая таможня, без стандартного брокера
  const isHeihe = routeId === "heihe_ru";
  const broker = isHeihe ? 0 : (dest === "ru" ? 220 : 160);
  // Таможенный сбор РФ: ~3000₽ для товаров до $200K + доп. сборы ≈ $75
  const fees   = dest === "ru" ? 75 : 50;
  return { duty, vat, broker, fees, total: duty + vat + broker + fees };
}

// ChinaBridge freight routes (updated Sep 2026)
const ROUTES = [
  {
    id: "heihe_ru",
    label: "Хэйхэ → Россия",
    flag: "🇷🇺",
    rate_usd_per_kg: 2.2,
    days_min: 7,
    days_max: 8,
    min_kg: 50,
    note: "Гуанчжоу→Хэйхэ 4-5 дн. + Хэйхэ→Благовещенск 3 дн. Малые партии от 50 кг",
    highlight: true,
    destination: "ru",
  },
  {
    id: "auto_ru",
    label: "Авто → Россия",
    flag: "🇷🇺",
    rate_usd_per_kg: 3.0,
    days_min: 18,
    days_max: 28,
    min_kg: 100,
    note: "Москва, СПб, регионы. Благовещенск→Москва 18-28 дн.",
    highlight: false,
    destination: "ru",
  },
  {
    id: "auto_kz",
    label: "Авто → Казахстан",
    flag: "🇰🇿",
    rate_usd_per_kg: 2.5,
    days_min: 5,
    days_max: 8,
    min_kg: 100,
    note: "Алматы, Астана, Шымкент",
    highlight: false,
    destination: "kz",
  },
  {
    id: "air_ru",
    label: "Авиа → Россия/КЗ",
    flag: "✈️",
    rate_usd_per_kg: 23.0,
    days_min: 3,
    days_max: 7,
    min_kg: 1,
    note: "Срочная доставка, любой вес",
    highlight: false,
    destination: "ru",
  },
];

export async function POST(req: NextRequest) {
  try {
    // ── PRO check (server-side, httpOnly cookie) ──────────────────────────────
    const paidUntil = req.cookies.get("cb_anon_paid_until")?.value;
    const isPro = !!(paidUntil && new Date(paidUntil) > new Date());

    if (!isPro && process.env.DATABASE_URL) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql.unsafe(CREATE_USES_TABLE);

        const rows = await sql`
          SELECT use_count FROM invoice_anon_uses WHERE ip = ${ip}
        ` as Array<{ use_count: number }>;

        const count = rows[0]?.use_count ?? 0;
        if (count >= FREE_LIMIT) {
          return NextResponse.json(
            { error: "limit", message: "Использованы все 3 бесплатных распознавания. Оформите PRO для безлимитного доступа." },
            { status: 402 }
          );
        }

        // Increment before processing (prevents race-condition double-use)
        await sql`
          INSERT INTO invoice_anon_uses (ip, use_count, last_used_at)
          VALUES (${ip}, 1, NOW())
          ON CONFLICT (ip) DO UPDATE
            SET use_count   = invoice_anon_uses.use_count + 1,
                last_used_at = NOW()
        `;
      } catch (dbErr) {
        console.error("[invoice] usage-check DB error:", dbErr);
        // Don't block on DB error — fail open (allow request through)
      }
    }

    // ── Parse request ─────────────────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      return NextResponse.json(
        { error: "Поддерживаются JPG, PNG, WEBP, HEIC. PDF — в разработке." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл слишком большой (макс 10MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Invoice OCR",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              { type: "text", text: EXTRACT_PROMPT },
            ],
          },
        ],
        max_tokens: 3000,
      }),
    });

    if (!orResp.ok) {
      const errText = await orResp.text();
      console.error("OpenRouter error:", orResp.status, errText);
      const msg = orResp.status === 429
        ? "Слишком много запросов. Попробуй через минуту."
        : "Ошибка распознавания. Попробуй ещё раз.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const orData = await orResp.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const rawContent = orData.choices?.[0]?.message?.content ?? "";

    let invoice: ExtractedInvoice;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      invoice = JSON.parse(jsonMatch[0]) as ExtractedInvoice;
    } catch {
      return NextResponse.json(
        { error: "Не удалось распознать структуру документа. Попробуйте более чёткое фото." },
        { status: 422 }
      );
    }

    const weightKg = invoice.total_weight_kg ?? 0;

    const quotes = ROUTES.map((route) => {
      const billableKg = Math.max(weightKg, route.min_kg);
      const cost = billableKg * route.rate_usd_per_kg;
      const belowMin = weightKg > 0 && weightKg < route.min_kg;
      return {
        ...route,
        cost_usd: Math.round(cost),
        billable_kg: billableKg,
        below_min: belowMin,
      };
    });

    // ── Landed cost calculation ───────────────────────────────────────────────
    const goodsUsd = toUsd(invoice.total_value ?? 0, invoice.currency ?? "USD");
    const pieces   = invoice.total_pieces || 1;

    const landed_costs = quotes.map((q) => {
      const dest    = (q.destination ?? "ru") as "ru" | "kz";
      const customs = estimateCustoms(goodsUsd, q.cost_usd, dest, q.id);
      const totalUsd = goodsUsd + q.cost_usd + customs.total;
      const perUnitUsd = totalUsd / pieces;
      return {
        route_id:         q.id,
        goods_usd:        Math.round(goodsUsd),
        shipping_usd:     q.cost_usd,
        customs_usd:      customs.total,
        customs_breakdown: customs,
        total_usd:        Math.round(totalUsd),
        per_unit_usd:     Math.round(perUnitUsd * 100) / 100,
        per_unit_rub:     Math.round(perUnitUsd * USD_RUB),
        pieces,
      };
    });

    return NextResponse.json({ invoice, quotes, weight_kg: weightKg, landed_costs, usd_rub: USD_RUB });
  } catch (err) {
    console.error("Invoice OCR error:", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
