import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

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

// Static rates matching chinabridge.pro tariffs
const ROUTES = [
  {
    id: "auto_ru",
    label: "Авто → Россия",
    flag: "🇷🇺",
    rate_usd_per_kg: 3.0,
    days_min: 18,
    days_max: 28,
    min_kg: 100,
    note: "Москва, СПб, регионы",
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
  },
  {
    id: "air_ru",
    label: "Авиа → Россия/КЗ",
    flag: "✈️",
    rate_usd_per_kg: 23.0,
    days_min: 3,
    days_max: 7,
    min_kg: 1,
    note: "Любой вес, срочная доставка",
  },
];

export async function POST(req: NextRequest) {
  try {
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
      const msg = orResp.status === 402
        ? "Недостаточно средств на OpenRouter. Пополни баланс."
        : orResp.status === 429
        ? "Слишком много запросов. Попробуй через минуту."
        : `Ошибка распознавания (${orResp.status})`;
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

    return NextResponse.json({ invoice, quotes, weight_kg: weightKg });
  } catch (err) {
    console.error("Invoice OCR error:", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
