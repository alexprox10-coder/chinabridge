import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ORCHESTRATOR_SYSTEM_PROMPT } from "@/lib/ai/prompts/orchestrator_system";
import { procurementToolDefinition, runProcurementAnalysis } from "@/lib/ai/tools/procurement_tool";
import { logisticsToolDefinition, runLogisticsCalculation } from "@/lib/ai/tools/logistics_tool";
import { customsToolDefinition, runCustomsAnalysis } from "@/lib/ai/tools/customs_tool";
import { financeToolDefinition, runFinanceCalculation } from "@/lib/ai/tools/finance_tool";
import { profileToolDefinition, runProfileAction } from "@/lib/ai/tools/profile_tool";

export const runtime = "nodejs";
export const maxDuration = 120;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const MODEL = process.env.AI_ORCHESTRATOR_MODEL ?? "anthropic/claude-sonnet-4-5";
const FREE_LIMIT = 3;
const PAY_PER_USE_RUB = 490;

const db = () => neon(process.env.DATABASE_URL!);

// Самосоздание таблиц через process.env.DATABASE_URL — то же соединение, что
// использует всё приложение. Не полагаемся на внешние credentials (n8n и т.п.),
// которые могут указывать на другую БД несмотря на похожий хост.
let tablesEnsured = false;
async function ensureTables(sql: ReturnType<typeof neon>) {
  if (tablesEnsured) return;
  await sql`CREATE TABLE IF NOT EXISTS ai_client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_telegram TEXT UNIQUE NOT NULL,
    typical_categories TEXT[],
    typical_route_from TEXT,
    typical_route_to TEXT,
    typical_destination_country TEXT,
    target_margin_percent NUMERIC,
    max_delivery_days INTEGER,
    typical_batch_size TEXT,
    preferred_marketplace TEXT,
    total_analyses INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    known_suppliers JSONB DEFAULT '[]',
    notes TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_telegram TEXT,
    status TEXT DEFAULT 'active',
    intent TEXT,
    title TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT,
    tool_calls JSONB,
    attachments JSONB
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID REFERENCES ai_sessions(id),
    user_telegram TEXT,
    product_description TEXT,
    variants JSONB,
    recommended_variant TEXT,
    reasoning TEXT,
    status TEXT DEFAULT 'draft'
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_telegram TEXT NOT NULL,
    analysis_id UUID REFERENCES ai_analyses(id),
    usage_type TEXT,
    amount_charged INTEGER,
    payment_id TEXT
  )`;
  tablesEnsured = true;
}

const ALL_TOOLS = [
  procurementToolDefinition,
  logisticsToolDefinition,
  customsToolDefinition,
  financeToolDefinition,
  profileToolDefinition,
];

type ToolCall = { id: string; type: string; function: { name: string; arguments: string } };

async function checkUsageLimit(userTelegram: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!userTelegram) return { allowed: true }; // анонимный — считаем бесплатным (ограничим на фронте по браузеру позже)
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int as cnt FROM ai_usage WHERE user_telegram = ${userTelegram} AND usage_type = 'free'
  `) as Array<{ cnt: number }>;
  const freeUsed = rows[0]?.cnt ?? 0;
  if (freeUsed < FREE_LIMIT) return { allowed: true };

  const business = (await sql`
    SELECT id FROM ai_usage WHERE user_telegram = ${userTelegram} AND usage_type = 'business_plan'
      AND created_at > NOW() - INTERVAL '30 days' LIMIT 1
  `) as Array<{ id: string }>;
  if (business.length) return { allowed: true };

  return {
    allowed: false,
    reason: `Бесплатные анализы закончились (${FREE_LIMIT} использовано). Полный анализ поставки — ${PAY_PER_USE_RUB}₽. Напишите менеджеру @ChinaBridgeLID_bot для оплаты.`,
  };
}

async function recordUsage(userTelegram: string, usageType: "free" | "pay_per_use") {
  if (!userTelegram) return;
  const sql = db();
  await sql`INSERT INTO ai_usage (user_telegram, usage_type, amount_charged) VALUES (${userTelegram}, ${usageType}, ${usageType === "pay_per_use" ? PAY_PER_USE_RUB : 0})`;
}

async function ensureSession(sessionId: string | null | undefined, userTelegram: string): Promise<string> {
  const sql = db();
  if (sessionId) {
    const rows = (await sql`SELECT id FROM ai_sessions WHERE id = ${sessionId}`) as Array<{ id: string }>;
    if (rows.length) return sessionId;
  }
  const created = (await sql`
    INSERT INTO ai_sessions (user_telegram) VALUES (${userTelegram || null}) RETURNING id
  `) as Array<{ id: string }>;
  return created[0].id;
}

export async function POST(req: NextRequest) {
  try {
    if (!OR_KEY()) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен на сервере" }, { status: 500 });
    }

    const body = await req.json();
    const message: string = body.message ?? "";
    const userTelegram: string = body.user_telegram ?? "";
    const attachments: Array<{ type: string; mime_type?: string; base64?: string }> = body.attachments ?? [];

    if (!message.trim() && attachments.length === 0) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const sql = db();
    await ensureTables(sql);
    const sessionId = await ensureSession(body.session_id, userTelegram);

    // История диалога (последние 20 сообщений)
    const history = (await sql`
      SELECT role, content FROM ai_messages
      WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT 20
    `) as Array<{ role: string; content: string }>;

    // Сохраняем сообщение пользователя
    await sql`INSERT INTO ai_messages (session_id, role, content, attachments) VALUES (${sessionId}, 'user', ${message}, ${JSON.stringify(attachments)})`;

    // Флаг: разрешён ли полный платный анализ в этом запросе
    const usage = await checkUsageLimit(userTelegram);
    let usageBlocked = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TOOL_RUNNERS: Record<string, (input: any) => Promise<unknown>> = {
      analyze_product_or_supplier: runProcurementAnalysis,
      calculate_logistics_options: runLogisticsCalculation,
      calculate_customs: runCustomsAnalysis,
      get_or_update_client_profile: (input) => runProfileAction({ ...input, user_telegram: input.user_telegram || userTelegram }),
      calculate_finance_scenarios: async (input) => {
        if (!usage.allowed) {
          usageBlocked = true;
          return { error: usage.reason, paywall: true };
        }
        return runFinanceCalculation(input);
      },
    };

    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: message || "Посмотри документ" }];
    for (const att of attachments) {
      if (att.type === "image" && att.base64) {
        userContent.push({ type: "image_url", image_url: { url: `data:${att.mime_type || "image/jpeg"};base64,${att.base64}` } });
      }
    }

    const apiMsgs: Array<Record<string, unknown>> = [
      { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: attachments.length ? userContent : message },
    ];

    let finalText = "";
    const toolCallsLog: Array<{ tool: string; input: unknown }> = [];

    for (let round = 0; round < 6; round++) {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OR_KEY()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chinabridge.pro",
          "X-Title": "ChinaBridge AI Import Manager",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: apiMsgs,
          tools: ALL_TOOLS,
          tool_choice: "auto",
          max_tokens: 2000,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return NextResponse.json({ error: `OpenRouter error ${resp.status}: ${errText}` }, { status: 502 });
      }

      const data = (await resp.json()) as {
        choices: Array<{ finish_reason: string; message: { role: string; content: string | null; tool_calls?: ToolCall[] } }>;
      };
      const choice = data.choices?.[0];
      if (!choice) {
        return NextResponse.json({ error: "Пустой ответ от AI" }, { status: 502 });
      }

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
        apiMsgs.push(choice.message as unknown as Record<string, unknown>);

        for (const tc of choice.message.tool_calls) {
          const fn = tc.function.name;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            // невалидный JSON от модели — оставляем пустые аргументы
          }

          const runner = TOOL_RUNNERS[fn];
          let result: unknown;
          try {
            result = runner ? await runner(args) : { error: `Unknown tool: ${fn}` };
          } catch (e) {
            result = { error: String(e) };
          }

          toolCallsLog.push({ tool: fn, input: args });
          apiMsgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        }
      } else {
        finalText = choice.message.content ?? "";
        break;
      }
    }

    if (!finalText) finalText = "Не удалось получить ответ. Попробуйте переформулировать запрос.";

    await sql`INSERT INTO ai_messages (session_id, role, content, tool_calls) VALUES (${sessionId}, 'assistant', ${finalText}, ${JSON.stringify(toolCallsLog)})`;

    const didFullAnalysis = toolCallsLog.some((t) => t.tool === "calculate_finance_scenarios") && !usageBlocked;
    if (didFullAnalysis) {
      const usageType = (await checkUsageLimitWasFree(userTelegram)) ? "free" : "pay_per_use";
      await recordUsage(userTelegram, usageType);
    }

    return NextResponse.json({
      session_id: sessionId,
      response: finalText,
      tool_calls: toolCallsLog,
      paywall: usageBlocked ? { message: usage.reason, price_rub: PAY_PER_USE_RUB } : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Хелпер: узнать, был ли этот анализ засчитан в бесплатный лимит (для корректной записи usage_type)
async function checkUsageLimitWasFree(userTelegram: string): Promise<boolean> {
  if (!userTelegram) return true;
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int as cnt FROM ai_usage WHERE user_telegram = ${userTelegram} AND usage_type = 'free'
  `) as Array<{ cnt: number }>;
  return (rows[0]?.cnt ?? 0) < FREE_LIMIT;
}
