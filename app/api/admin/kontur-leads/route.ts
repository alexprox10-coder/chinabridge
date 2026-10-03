import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const PIPELINE_STATUSES = ["new","analyzing","sourced","kp_ready","contacted","negotiating","deal","rejected"];

interface AnalysisResult {
  product_category: string;
  what_they_sell: string;
  sales_channel: string;
  who_are_clients: string;
  geography: string;
  china_fit: string;
  pain_points: string;
  ved_status: string;
  ved_details: string;
  specific_skus: string;
  price_range: string;
  suggested_goods: string;
  supplier_search_queries: string;
  estimated_order_volume: string;
  stop_factors: string;
  deal_score: "A" | "B" | "C" | "D";
  deal_score_reason: string;
  kp_message: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  priority_reason: string;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT id, company_name, inn, okvad, okvad_name, region,
           lead_score, is_internet_seller, status, created_at
    FROM outreach_contacts
    WHERE source = 'kontur_compass'
    ORDER BY lead_score DESC NULLS LAST, created_at DESC
    LIMIT 200
  `;

  const leads = rows.map(r => {
    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(r.okvad_name as string ?? "{}"); } catch {}
    return {
      id: r.id,
      company_name: r.company_name,
      inn: r.inn,
      region: r.region,
      lead_score: Number(r.lead_score) || 0,
      status: r.status || "new",
      created_at: r.created_at,
      phone: extra.phone as string | null,
      email: extra.email as string | null,
      site_url: extra.site_url as string | null,
      director: extra.director as string | null,
      position: extra.position as string | null,
      revenue: extra.revenue as number | null,
      employees: extra.employees as number | null,
      okvad_full: extra.okvad_full as string | null,
      product_category: extra.product_category as string | null,
      supplier_found: extra.supplier_found as string | null,
      msp_category: extra.msp_category as string | null,
      what_they_sell: extra.what_they_sell as string | null,
      sales_channel: extra.sales_channel as string | null,
      who_are_clients: extra.who_are_clients as string | null,
      china_fit: extra.china_fit as string | null,
      pain_points: extra.pain_points as string | null,
      ved_status: extra.ved_status as string | null,
      ved_details: extra.ved_details as string | null,
      specific_skus: extra.specific_skus as string | null,
      price_range: extra.price_range as string | null,
      suggested_goods: extra.suggested_goods as string | null,
      supplier_search_queries: extra.supplier_search_queries as string | null,
      estimated_order_volume: extra.estimated_order_volume as string | null,
      stop_factors: extra.stop_factors as string | null,
      deal_score: extra.deal_score as string | null,
      deal_score_reason: extra.deal_score_reason as string | null,
      kp_message: extra.kp_message as string | null,
      ai_priority: extra.ai_priority as string | null,
      priority_reason: extra.priority_reason as string | null,
    };
  });

  const byStage = Object.fromEntries(PIPELINE_STATUSES.map(s => [s, leads.filter(l => l.status === s)]));
  return NextResponse.json({ ok: true, leads, byStage, total: leads.length });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const body = await req.json();
  const { id, status, note, product_category, supplier_found } = body;

  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  // Get current record
  const rows = await sql`SELECT okvad_name FROM outreach_contacts WHERE id = ${id} AND source = 'kontur_compass'`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  let extra: Record<string, unknown> = {};
  try { extra = JSON.parse(rows[0].okvad_name as string ?? "{}"); } catch {}

  if (product_category !== undefined) extra.product_category = product_category;
  if (supplier_found !== undefined) extra.supplier_found = supplier_found;
  if (note !== undefined) extra.note = note;

  await sql`
    UPDATE outreach_contacts
    SET status     = COALESCE(${status ?? null}, status),
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true });
}

// shared helper — analyzes one company with OpenRouter
async function analyzeCompany(
  companyName: string,
  extra: Record<string, unknown>,
  siteUrl: string | null,
  okvadFull: string | null,
): Promise<{ analysis: AnalysisResult; siteText: string; aiError?: string }> {
  const orBase = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const orModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o";
  const orKey = process.env.OPENROUTER_API_KEY ?? "";

  const defaultAnalysis: AnalysisResult = {
    product_category: okvadFull
      ? okvadFull.replace(/^\d+\.?\d*\s*/, "").split(" ").slice(0, 4).join(" ").toLowerCase()
      : "неизвестно",
    what_they_sell: "",
    sales_channel: "",
    who_are_clients: "",
    geography: extra.region as string || "",
    china_fit: "",
    pain_points: "",
    ved_status: "",
    ved_details: "",
    specific_skus: "",
    price_range: "",
    suggested_goods: "",
    supplier_search_queries: "",
    estimated_order_volume: "",
    stop_factors: "",
    deal_score: "B",
    deal_score_reason: "",
    kp_message: "",
    priority: "MEDIUM",
    priority_reason: "",
  };

  // Scrape site
  let siteText = "";
  if (siteUrl) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url: siteUrl, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(10000),
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        siteText = (fcData.data?.markdown ?? fcData.markdown ?? "").slice(0, 3000);
      }
    } catch { /* site unavailable */ }
  }

  const revenueNum = extra.revenue ? Number(extra.revenue) : 0;
  const revenue = revenueNum ? `${Math.round(revenueNum / 1_000_000)} млн ₽` : "неизвестна";
  const revenueScale = revenueNum > 500_000_000 ? "крупный бизнес (>500 млн)" : revenueNum > 100_000_000 ? "средний бизнес (100-500 млн)" : revenueNum > 20_000_000 ? "малый бизнес (20-100 млн)" : "микробизнес (<20 млн)";
  const employees = extra.employees ? `${extra.employees} чел` : "неизвестно";
  const okvadSecondary = extra.okvad_secondary as string | null;
  const director = extra.director as string | null;
  const msp = extra.msp_category as string | null;
  const directorFirstName = director ? director.split(" ").slice(1).join(" ") || director : null;

  // Detect possible ВЭД / China connection hints
  const vedHints: string[] = [];
  if (okvadFull) {
    if (/импорт|экспорт|внешнеэкон|вэд/i.test(okvadFull)) vedHints.push("ОКВЭД указывает на ВЭД");
    if (/оптов/i.test(okvadFull)) vedHints.push("оптовая торговля — вероятно закупает товар");
    if (/розни/i.test(okvadFull)) vedHints.push("розничная торговля — нужен постоянный товар");
    if (/маркетплейс|интернет.магазин|торговля.*интернет/i.test(okvadFull)) vedHints.push("продаёт онлайн — высокая потребность в товаре");
    if (/текстил|одежд|обувь|галантер/i.test(okvadFull)) vedHints.push("товары из Китая 60-70% рынка");
    if (/электрон|бытовая техника|оборудован/i.test(okvadFull)) vedHints.push("электроника — основной импорт из Китая");
  }
  if (siteText) {
    if (/китай|1688|alibaba|алибаба|tao ?bao|таобао/i.test(siteText)) vedHints.push("⚠️ УЖЕ РАБОТАЕТ С КИТАЕМ — упомянуто на сайте");
    if (/импорт|import/i.test(siteText)) vedHints.push("упоминается импорт на сайте");
    if (/wildberries|wb|ozon|озон|маркетплейс/i.test(siteText)) vedHints.push("продаёт на маркетплейсах");
  }
  if (okvadSecondary) {
    if (/47\.|46\./i.test(okvadSecondary)) vedHints.push("есть ОКВЭД розничной/оптовой торговли");
  }

  const systemMsg = `Ты — B2B квалификатор лидов компании ChinaBridge (импорт товаров из Китая в РФ напрямую с 1688.com, Alibaba, Taobao).
Цены на 30-50% ниже российских дистрибьюторов, доставка 18-25 дней, работаем с партией от 30 кг.

КЛЮЧЕВОЙ РЫНОЧНЫЙ КОНТЕКСТ (используй в анализе):
- После 2022 года из РФ ушли: Liqui Moly, Castrol, Shell, SKF, Bosch, многие европейские бренды
- Китайские аналоги (Great Wall, Sinopec, ZIC, NTN, FAG China) закрыли 60-80% дефицита, но компании часто покупают через 2-3 посредника
- Прямой импорт через ChinaBridge = минус 2 наценки дистрибьютора
- Маркетплейсы (WB/Ozon) требуют постоянный товар → высокий объём закупок

ПРАВИЛА:
1. Отвечай ТОЛЬКО валидным JSON без markdown-блоков
2. Каждое поле — КОНКРЕТНО про эту компанию, никаких шаблонов
3. Используй рыночный контекст выше для отраслевой точности
4. Стоп-факторы проверяй честно — лучше D-лид с причиной, чем завышенный A
5. КП = WhatsApp-сообщение: имя директора обязательно если есть, конкретный товар, конкретная цифра`;

  const userMsg = `ДАННЫЕ КОМПАНИИ:
Название: ${companyName}
ИНН: ${extra.inn ?? "н/д"} | Регион: ${extra.region || "не указан"}
Директор: ${director ?? "неизвестен"} (${extra.position ?? "должность неизвестна"})
Масштаб: ${revenueScale} | Выручка: ${revenue} | Сотрудников: ${employees}
Категория МСП: ${msp ?? "нет данных"}

ОКВЭД основной: ${okvadFull ?? "не указан"}
${okvadSecondary ? `ОКВЭД дополнительные: ${okvadSecondary.slice(0, 600)}` : ""}

${vedHints.length ? `СИГНАЛЫ ВЭД/КИТАЯ:\n${vedHints.map(h => `• ${h}`).join("\n")}\n` : ""}
${siteUrl ? `Сайт: ${siteUrl}` : "Сайт: не указан"}
${siteText ? `\n=== КОНТЕНТ САЙТА ===\n${siteText}\n=== КОНЕЦ ===` : "(сайт не доступен — анализируй по ОКВЭД, названию, масштабу и рыночному контексту)"}

Верни JSON строго с этими полями (все — конкретно про ${companyName}):
{
  "product_category": "3-5 слов, точная ниша",

  "what_they_sell": "Что конкретно продаёт/производит ${companyName}: ассортимент, бренды, услуги — 2-3 предложения",

  "sales_channel": "Главный канал: опт / розница / дистрибьюторы / производство / маркетплейсы — один главный + пояснение",

  "who_are_clients": "Кто покупает: сегмент (B2B/B2C), отрасли, география клиентов, средний чек если понятен",

  "ved_status": "Работают ли уже с Китаем: ДА (признаки) / ВЕРОЯТНО (логика) / НЕТ (объяснение)",

  "ved_details": "Детали: что именно берут из Китая сейчас (или логично что берут), через кого (дистрибьютор/прямой импорт), где боль",

  "pain_points": "Главная боль одной фразой + доказательство: факт с сайта / уход западных брендов / дефицит / рост цен — конкретно для этой ниши",

  "china_fit": "Почему Китай решает их боль: конкретный товар → конкретная экономия или закрытие дефицита. НЕ 'цены ниже' — а ПОЧЕМУ именно для них",

  "specific_skus": "3-5 КОНКРЕТНЫХ SKU которые эта компания покупает/продаёт. Формат каждой позиции: [Название товара] | РФ розница ~X ₽/шт | РФ опт ~Y ₽/шт | Китай закупка ~Z ¥/шт | Мин. партия N шт. Пример: 'Маска медицинская 3-слойная IIR | РФ розница ~8 ₽/шт | РФ опт ~4 ₽/шт | Китай ~0.8 юань/шт | Мин. 10 000 шт'. Если точные цены неизвестны — оцени по рыночному контексту.",

  "price_range": "Ценовой диапазон по категории: средний чек клиента, маржа дистрибьютора, потенциальная экономия при прямом импорте. Пример: 'Розница 500-2000₽/ед, опт 200-800₽/ед, импорт из Китая 50-150₽/ед — экономия 60-75%'",

  "suggested_goods": "5-7 конкретных позиций для закупки через ChinaBridge с артикулом/категорией 1688. Пример: 'маска медицинская 3-слойная IIR (医用外科口罩), перчатки нитриловые S/M/L (丁腈手套), одноразовые шприцы 5мл (一次性注射器)'",

  "supplier_search_queries": "5 поисковых запросов на английском для 1688/Accio — точные, как вводить в поиск. Пример: 'disposable medical mask IIR wholesale', 'nitrile gloves manufacturer 100pcs box', 'medical syringe 5ml CE ISO bulk'",

  "estimated_order_volume": "Оценка объёма: разовая партия (шт/кг + ₽/$) + частота (раз в мес/кв) + годовой потенциал — на основе выручки компании и ниши",

  "stop_factors": "Стоп-факторы (честно): ГОСТ/сертификация (для каких позиций) / госконтракты (% выручки) / уже прямой импорт / не нужен товар — или 'НЕТ стоп-факторов'",

  "deal_score": "A, B, C или D",

  "deal_score_reason": "Почему этот скор: выручка + категория + контакт ЛПР + стоп-факторы — 2-3 предложения. Скоринг: A=выручка 100М+, категория явно связана с Китаем, контакт ЛПР есть, нет стоп-факторов; B=выручка 30-100М или косвенная связь с Китаем; C=малый бизнес или слабая связь; D=госструктура/ГОСТ-производство/нет смысла",

  "kp_message": "WhatsApp/Telegram директору${directorFirstName ? ` ${directorFirstName}` : ""}. ОБЯЗАТЕЛЬНО: 1) Обращение по имени если известно 2) Конкретный товар из их ниши 3) Конкретная цифра (экономия % или $) 4) Вопрос или призыв. 4-5 предложений. Тон деловой. БЕЗ 'предлагаем сотрудничество'",

  "priority": "HIGH если deal_score A, LOW если D, иначе MEDIUM",

  "priority_reason": "Одна фраза: выручка + ниша + потенциал объёма"
}`;

  if (!orKey) {
    return { analysis: defaultAnalysis, siteText, aiError: "OPENROUTER_API_KEY not set" };
  }

  try {
    const aiRes = await fetch(`${orBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${orKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Lead Analysis",
      },
      body: JSON.stringify({
        model: orModel,
        max_tokens: 2400,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => aiRes.statusText);
      throw new Error(`OpenRouter ${aiRes.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Empty AI response");

    // Extract JSON (strip any accidental fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${raw.slice(0, 100)}`);
    const parsed = JSON.parse(jsonMatch[0]);
    return { analysis: { ...defaultAnalysis, ...parsed }, siteText };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { analysis: defaultAnalysis, siteText, aiError: msg };
  }
}

// POST — AI analyze single company
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await req.json();

  const rows = await sql`SELECT company_name, inn, okvad_name FROM outreach_contacts WHERE id = ${id} AND source = 'kontur_compass'`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const rawOkvad = rows[0].okvad_name;
  let extra: Record<string, unknown> = {};
  try {
    extra = typeof rawOkvad === "object" && rawOkvad !== null
      ? (rawOkvad as Record<string, unknown>)
      : JSON.parse(rawOkvad as string ?? "{}");
  } catch {}

  const siteUrl = extra.site_url as string | null;
  const okvadFull = extra.okvad_full as string | null;
  const companyName = rows[0].company_name as string;

  const { analysis, siteText, aiError } = await analyzeCompany(companyName, extra, siteUrl, okvadFull);

  if (aiError) {
    return NextResponse.json({ ok: false, aiError, error: aiError }, { status: 500 });
  }

  Object.assign(extra, {
    product_category: analysis.product_category,
    what_they_sell: analysis.what_they_sell,
    sales_channel: analysis.sales_channel,
    who_are_clients: analysis.who_are_clients,
    china_fit: analysis.china_fit,
    pain_points: analysis.pain_points,
    ved_status: analysis.ved_status,
    ved_details: analysis.ved_details,
    specific_skus: analysis.specific_skus,
    price_range: analysis.price_range,
    suggested_goods: analysis.suggested_goods,
    supplier_search_queries: analysis.supplier_search_queries,
    estimated_order_volume: analysis.estimated_order_volume,
    stop_factors: analysis.stop_factors,
    deal_score: analysis.deal_score,
    deal_score_reason: analysis.deal_score_reason,
    kp_message: analysis.kp_message,
    ai_priority: analysis.priority,
    priority_reason: analysis.priority_reason,
    site_text_snippet: siteText.slice(0, 400),
  });

  await sql`
    UPDATE outreach_contacts
    SET status     = CASE WHEN status IN ('new', 'analyzing') THEN 'kp_ready' ELSE status END,
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true, analysis, aiError: null });
}

// PUT — batch analyze leads (up to 10 per call)
// ?force=true — reanalyze even leads that already have kp_message (e.g. old gpt-4o-mini results)
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const force = req.nextUrl.searchParams.get("force") === "true";

  const rows = force
    ? await sql`
        SELECT id, company_name, okvad_name FROM outreach_contacts
        WHERE source = 'kontur_compass'
          AND status NOT IN ('rejected', 'deal', 'contacted', 'negotiating')
        ORDER BY lead_score DESC NULLS LAST
        LIMIT 10
      `
    : await sql`
        SELECT id, company_name, okvad_name FROM outreach_contacts
        WHERE source = 'kontur_compass'
          AND status NOT IN ('rejected', 'deal', 'kp_ready', 'contacted', 'negotiating')
          AND (
            okvad_name::text NOT LIKE '%"kp_message":"%'
            OR okvad_name::text LIKE '%"kp_message":""%'
            OR okvad_name::text LIKE '%"kp_message":null%'
            OR okvad_name::text LIKE '%"kp_message":""%'
          )
        ORDER BY lead_score DESC NULLS LAST
        LIMIT 10
      `;

  const results: { id: number; name: string; ok: boolean; error?: string }[] = [];

  for (const row of rows) {
    const rawOkvad = row.okvad_name;
    let extra: Record<string, unknown> = {};
    try {
      extra = typeof rawOkvad === "object" && rawOkvad !== null
        ? (rawOkvad as Record<string, unknown>)
        : JSON.parse(rawOkvad as string ?? "{}");
    } catch {}

    const siteUrl = extra.site_url as string | null;
    const okvadFull = extra.okvad_full as string | null;
    const companyName = row.company_name as string;

    const { analysis, siteText, aiError } = await analyzeCompany(companyName, extra, siteUrl, okvadFull);

    if (aiError) {
      results.push({ id: Number(row.id), name: companyName, ok: false, error: aiError });
      continue;
    }

    Object.assign(extra, {
      product_category: analysis.product_category,
      what_they_sell: analysis.what_they_sell,
      sales_channel: analysis.sales_channel,
      who_are_clients: analysis.who_are_clients,
      china_fit: analysis.china_fit,
      pain_points: analysis.pain_points,
      ved_status: analysis.ved_status,
      ved_details: analysis.ved_details,
      specific_skus: analysis.specific_skus,
      price_range: analysis.price_range,
      suggested_goods: analysis.suggested_goods,
      supplier_search_queries: analysis.supplier_search_queries,
      estimated_order_volume: analysis.estimated_order_volume,
      stop_factors: analysis.stop_factors,
      deal_score: analysis.deal_score,
      deal_score_reason: analysis.deal_score_reason,
      kp_message: analysis.kp_message,
      ai_priority: analysis.priority,
      priority_reason: analysis.priority_reason,
      site_text_snippet: siteText.slice(0, 400),
    });

    try {
      await sql`
        UPDATE outreach_contacts
        SET status = CASE WHEN status IN ('new', 'analyzing') THEN 'kp_ready' ELSE status END,
            okvad_name = ${JSON.stringify(extra)}
        WHERE id = ${row.id} AND source = 'kontur_compass'
      `;
      results.push({ id: Number(row.id), name: companyName, ok: true });
    } catch (e) {
      results.push({ id: Number(row.id), name: companyName, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
