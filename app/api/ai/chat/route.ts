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
async function ensureTables() {
  if (tablesEnsured) return;
  const sql = neon(process.env.DATABASE_URL!);
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

const TOOL_STATUS_LABELS: Record<string, string> = {
  analyze_product_or_supplier: "🔍 Анализирую товар...",
  calculate_logistics_options: "🚚 Считаю маршруты доставки...",
  calculate_customs: "🛃 Определяю ТН ВЭД и пошлины...",
  calculate_finance_scenarios: "💰 Считаю себестоимость и маржу...",
  get_or_update_client_profile: "📋 Проверяю профиль клиента...",
};

type ToolCall = { id: string; type: string; function: { name: string; arguments: string } };

// "identity" — либо реальный telegram, либо анонимный browser-UUID (пока telegram не
// введён). Обе формы хранятся в той же колонке user_telegram: лимит бесплатных
// анализов считается по identity независимо от того, идентифицировался клиент или
// ещё нет — иначе анонимный доступ был бы безлимитным.
async function checkUsageLimit(identity: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!identity) return { allowed: true };
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int as cnt FROM ai_usage WHERE user_telegram = ${identity} AND usage_type = 'free'
  `) as Array<{ cnt: number }>;
  const freeUsed = rows[0]?.cnt ?? 0;
  if (freeUsed < FREE_LIMIT) return { allowed: true };

  const business = (await sql`
    SELECT id FROM ai_usage WHERE user_telegram = ${identity} AND usage_type = 'business_plan'
      AND created_at > NOW() - INTERVAL '30 days' LIMIT 1
  `) as Array<{ id: string }>;
  if (business.length) return { allowed: true };

  return {
    allowed: false,
    reason: `Бесплатные анализы закончились (${FREE_LIMIT} использовано). Полный анализ поставки — ${PAY_PER_USE_RUB}₽. Напишите менеджеру @ChinaBridgeLID_bot для оплаты.`,
  };
}

async function recordUsage(identity: string, usageType: "free" | "pay_per_use") {
  if (!identity) return;
  const sql = db();
  await sql`INSERT INTO ai_usage (user_telegram, usage_type, amount_charged) VALUES (${identity}, ${usageType}, ${usageType === "pay_per_use" ? PAY_PER_USE_RUB : 0})`;
}

async function wasFreeUsage(identity: string): Promise<boolean> {
  if (!identity) return true;
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int as cnt FROM ai_usage WHERE user_telegram = ${identity} AND usage_type = 'free'
  `) as Array<{ cnt: number }>;
  return (rows[0]?.cnt ?? 0) < FREE_LIMIT;
}

async function ensureSession(sessionId: string | null | undefined, identity: string): Promise<string> {
  const sql = db();
  if (sessionId) {
    const rows = (await sql`SELECT id FROM ai_sessions WHERE id = ${sessionId}`) as Array<{ id: string }>;
    if (rows.length) return sessionId;
  }
  const created = (await sql`
    INSERT INTO ai_sessions (user_telegram) VALUES (${identity || null}) RETURNING id
  `) as Array<{ id: string }>;
  return created[0].id;
}

export async function POST(req: NextRequest) {
  if (!OR_KEY()) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен на сервере" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });

  const message: string = body.message ?? "";
  const userTelegram: string = body.user_telegram ?? "";
  const anonymousId: string = body.anonymous_id ?? "";
  const identity = userTelegram || anonymousId;
  const attachments: Array<{ type: string; mime_type?: string; base64?: string }> = body.attachments ?? [];

  if (!message.trim() && attachments.length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        await ensureTables();
        const sql = db();
        const sessionId = await ensureSession(body.session_id, identity);

        const history = (await sql`
          SELECT role, content FROM ai_messages
          WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT 20
        `) as Array<{ role: string; content: string }>;

        await sql`INSERT INTO ai_messages (session_id, role, content, attachments) VALUES (${sessionId}, 'user', ${message}, ${JSON.stringify(attachments)})`;

        const usage = await checkUsageLimit(identity);
        // Блокируем сразу по результату проверки лимита, а не только когда модель
        // реально вызовет calculate_finance_scenarios — модель может посчитать
        // себестоимость/маржу "в уме" по данным из истории диалога, вообще не
        // вызывая инструмент, и тогда gate внутри TOOL_RUNNERS никогда не сработает.
        let usageBlocked = !usage.allowed;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const TOOL_RUNNERS: Record<string, (input: any) => Promise<unknown>> = {
          analyze_product_or_supplier: runProcurementAnalysis,
          calculate_logistics_options: runLogisticsCalculation,
          calculate_customs: runCustomsAnalysis,
          get_or_update_client_profile: (input) => runProfileAction({ ...input, user_telegram: input.user_telegram || identity }),
          calculate_finance_scenarios: async (input) => {
            if (!usage.allowed) {
              return { error: usage.reason, paywall: true };
            }
            return runFinanceCalculation(input);
          },
        };

        // Если лимит исчерпан — убираем сам инструмент из списка, чтобы модель не
        // могла "притвориться", что считает, и жёстко запрещаем ей оценивать
        // себестоимость/маржу/прибыль текстом без вызова инструмента.
        const availableTools = usage.allowed
          ? ALL_TOOLS
          : ALL_TOOLS.filter((t) => t.function.name !== "calculate_finance_scenarios");

        const userContent: Array<Record<string, unknown>> = [{ type: "text", text: message || "Посмотри документ" }];
        for (const att of attachments) {
          if (att.type === "image" && att.base64) {
            userContent.push({ type: "image_url", image_url: { url: `data:${att.mime_type || "image/jpeg"};base64,${att.base64}` } });
          }
        }

        const apiMsgs: Array<Record<string, unknown>> = [
          { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
          ...(usageBlocked
            ? [
                {
                  role: "system",
                  content:
                    "У клиента закончились бесплатные полные анализы. Инструмент calculate_finance_scenarios " +
                    "тебе недоступен. ЗАПРЕЩЕНО самостоятельно считать или озвучивать себестоимость, маржу, " +
                    "прибыль, ROI в любой форме (в том числе приблизительно, экстраполяцией по предыдущим " +
                    "сообщениям диалога). Если вопрос требует такого расчёта — вежливо сообщи, что бесплатный " +
                    `лимит исчерпан и полный анализ стоит ${PAY_PER_USE_RUB}₽, предложи написать @ChinaBridgeLID_bot ` +
                    "для оплаты. Маршруты доставки и таможенную классификацию (без себестоимости) считать можно.",
                },
              ]
            : []),
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: attachments.length ? userContent : message },
        ];

        let finalText = "";
        const toolCallsLog: Array<{ tool: string; input: unknown; output?: unknown }> = [];

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
              tools: availableTools,
              tool_choice: "auto",
              max_tokens: 2000,
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text().catch(() => "");
            send({ error: `OpenRouter error ${resp.status}: ${errText}` });
            send({ done: true });
            controller.close();
            return;
          }

          const data = (await resp.json()) as {
            choices: Array<{ finish_reason: string; message: { role: string; content: string | null; tool_calls?: ToolCall[] } }>;
          };
          const choice = data.choices?.[0];
          if (!choice) {
            send({ error: "Пустой ответ от AI" });
            send({ done: true });
            controller.close();
            return;
          }

          if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
            apiMsgs.push(choice.message as unknown as Record<string, unknown>);

            for (const tc of choice.message.tool_calls) {
              const fn = tc.function.name;
              send({ status: TOOL_STATUS_LABELS[fn] ?? `⚙️ Вызываю ${fn}...` });

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

              toolCallsLog.push({ tool: fn, input: args, output: result });
              apiMsgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
            }
          } else {
            finalText = choice.message.content ?? "";
            break;
          }
        }

        if (!finalText) finalText = "Не удалось получить ответ. Попробуйте переформулировать запрос.";

        const hasHandoffCta = /\[Передать поставку ChinaBridge[^\]]*\]/.test(finalText);
        const cleanResponse = finalText.replace(/\[Передать поставку ChinaBridge[^\]]*\]/g, "").trim();

        await sql`INSERT INTO ai_messages (session_id, role, content, tool_calls) VALUES (${sessionId}, 'assistant', ${cleanResponse}, ${JSON.stringify(toolCallsLog)})`;

        const didFullAnalysis = toolCallsLog.some((t) => t.tool === "calculate_finance_scenarios") && !usageBlocked;
        if (didFullAnalysis) {
          const usageType = (await wasFreeUsage(identity)) ? "free" : "pay_per_use";
          await recordUsage(identity, usageType);
        }

        let analysisId: string | null = null;
        if (hasHandoffCta && didFullAnalysis) {
          const variants = toolCallsLog
            .filter((t) => t.tool === "calculate_finance_scenarios")
            .map((t) => ({ input: t.input, output: t.output }));
          const created = (await sql`
            INSERT INTO ai_analyses (session_id, user_telegram, product_description, variants, reasoning, status)
            VALUES (${sessionId}, ${identity || null}, ${message}, ${JSON.stringify(variants)}, ${cleanResponse}, 'draft')
            RETURNING id
          `) as Array<{ id: string }>;
          analysisId = created[0]?.id ?? null;
        }

        send({
          session_id: sessionId,
          response: cleanResponse,
          tool_calls: toolCallsLog,
          paywall: usageBlocked ? { message: usage.reason, price_rub: PAY_PER_USE_RUB } : null,
          show_handoff_cta: hasHandoffCta,
          analysis_id: analysisId,
        });
        send({ done: true });
        controller.close();
      } catch (e) {
        send({ error: String(e) });
        send({ done: true });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
