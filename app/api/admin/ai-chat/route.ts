import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 120;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const GH_TOKEN = () => process.env.GITHUB_TOKEN ?? "";
const GH_REPO = "alexprox10-coder/chinabridge";

const SYSTEM = `Ты — Claude, AI-ассистент команды ChinaBridge (alexprox10@gmail.com).
Ты работаешь через chinabridge.pro/admin/ai-chat когда недоступен Claude Code.
Помни: ты имеешь ПОЛНЫЙ контекст проекта и должен работать как полноценная замена Claude Code.

=== ПРОЕКТ ===
ChinaBridge — AI-платформа для импорта товаров из Китая в KZ и RU.
Сайт: chinabridge.pro
Стек: Next.js 15.5 App Router, Neon Postgres (@neondatabase/serverless), Vercel, OpenRouter API
Репо: github.com/${GH_REPO}
Admin: chinabridge.pro/admin

=== АРХИТЕКТУРА ===
- /app/admin/* — все admin страницы (CRM, Outbound, AI Sales, Analytics)
- /app/api/* — API routes (Next.js Route Handlers)
- /lib/outbound/* — Outbound AI engine (scoring, messaging, china-match, economics)
- /lib/db/schema.ts — Drizzle ORM schema
- Neon Postgres — основная БД
- OpenRouter — AI вызовы (claude-haiku-4-5, gpt-4o-mini)

=== OUTBOUND CRM v1.1 ===
Стадии лида: FOUND→SCORED→PERSONALIZED→READY_TO_CONTACT→APPROVED→CONTACTED→REPLIED→QUALIFIED→HOT→QUOTE→DEAL
Evidence Score: CONFIRMED(≥80), PROBABLE(≥60), INFERRED(≥35), WEAK
Approve → APPROVED, отдельная кнопка Send → CONTACTED

=== ТРАФИК ===
- 7.9K users/неделю, 16с активного времени, 1.15 страниц/сеанс
- CPA трафик 84% от VK — попадает на главную, не конвертит
- Нужен отдельный лендинг для CPA трафика
- Kaspi, WB, Ozon — три маркетплейса KZ = серая доставка; RU белая через Суньфэньхэ

=== ПАРТНЁРЫ ===
- АнтонКит (Гуанчжоу): авто $2.50/кг KZ (5-8 дней), авиа $23/кг

=== ПРАВИЛА ===
- Отвечай по-русски, код на английском
- Конкретные действия, не абстракции
- Если просят изменить код — используй github_write_file (он автоматически деплоит в Vercel)
- Помни всю историю разговоров (хранится в БД)`;

// ─── Tools ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "browse_web",
      description: "Открыть и прочитать содержимое веб-страницы. Используй для проверки сайта, документации, конкурентов.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Полный URL включая https://" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_read_file",
      description: "Прочитать файл из репозитория chinabridge (alexprox10-coder/chinabridge). Используй чтобы посмотреть код перед редактированием.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Путь к файлу, например: app/api/outbound/leads/route.ts" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_list_dir",
      description: "Показать список файлов в директории репозитория chinabridge. Пустая строка — корень проекта.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Путь к директории (пустая строка = корень)" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_write_file",
      description: "Записать файл в репозиторий chinabridge и создать коммит. Vercel автоматически задеплоит изменения в production (~1-2 минуты).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Путь к файлу в репозитории" },
          content: { type: "string", description: "Полное содержимое файла" },
          message: { type: "string", description: "Сообщение коммита (по-английски)" },
        },
        required: ["path", "content", "message"],
      },
    },
  },
];

// ─── Tool implementations ─────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await r.text();
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"')
      .replace(/\s{2,}/g, " ").trim().slice(0, 15000);
    return `[URL: ${url} | HTTP ${r.status}]\n\n${clean}`;
  } catch (e) {
    return `[Ошибка загрузки ${url}: ${String(e)}]`;
  }
}

async function ghReadFile(path: string): Promise<string> {
  try {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN()}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ChinaBridge-AI-Chat",
      },
    });
    if (!r.ok) return `[GitHub error ${r.status}: ${await r.text()}]`;
    const data = await r.json() as { content: string; encoding: string; size: number };
    if (data.encoding === "base64") {
      const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
      return `[Файл: ${path} | ${data.size} байт]\n\n${content.slice(0, 20000)}`;
    }
    return `[Файл: ${path}] binary`;
  } catch (e) {
    return `[Ошибка: ${String(e)}]`;
  }
}

async function ghListDir(path: string): Promise<string> {
  try {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN()}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ChinaBridge-AI-Chat",
      },
    });
    if (!r.ok) return `[GitHub error ${r.status}]`;
    const items = await r.json() as Array<{ name: string; type: string; size: number }>;
    if (!Array.isArray(items)) return `[Не директория]`;
    return `[${path || "/"} — ${items.length} элементов]\n` +
      items.map(i => `${i.type === "dir" ? "📁" : "📄"} ${i.name}${i.type === "file" ? ` (${i.size}б)` : ""}`).join("\n");
  } catch (e) {
    return `[Ошибка: ${String(e)}]`;
  }
}

async function ghWriteFile(path: string, content: string, message: string): Promise<string> {
  try {
    // Get current SHA (needed for updates)
    let sha: string | undefined;
    const getR = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN()}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ChinaBridge-AI-Chat",
      },
    });
    if (getR.ok) {
      const existing = await getR.json() as { sha: string };
      sha = existing.sha;
    }

    const body: Record<string, string> = {
      message: `${message}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch: "main",
    };
    if (sha) body.sha = sha;

    const putR = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GH_TOKEN()}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ChinaBridge-AI-Chat",
      },
      body: JSON.stringify(body),
    });

    if (!putR.ok) return `[Ошибка записи ${putR.status}: ${await putR.text()}]`;
    const result = await putR.json() as { commit: { sha: string; html_url: string } };
    return `[✅ Закоммичено! Файл: ${path} | SHA: ${result.commit?.sha?.slice(0, 7)} | Vercel деплоит автоматически (~1-2 мин)]`;
  } catch (e) {
    return `[Ошибка: ${String(e)}]`;
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    const rows = await sql`
      SELECT id, role, content, model, created_at
      FROM ai_chat_history ORDER BY created_at ASC LIMIT 500
    ` as { id: number; role: string; content: string; model: string; created_at: string }[];
    return NextResponse.json({ ok: true, messages: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`TRUNCATE TABLE ai_chat_history RESTART IDENTITY`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

type ToolCall = { id: string; type: string; function: { name: string; arguments: string } };

export async function POST(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);

    const { message, model = "anthropic/claude-opus-4-5" } = await req.json() as {
      message: string; model?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });
    }

    await sql`INSERT INTO ai_chat_history (role, content, model) VALUES ('user', ${message}, ${model})`;

    const history = await sql`
      SELECT role, content FROM ai_chat_history ORDER BY created_at ASC LIMIT 500
    ` as { role: string; content: string }[];

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: string) =>
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        const sendJson = (obj: object) => send(JSON.stringify(obj));

        try {
          const apiMsgs: object[] = [
            { role: "system", content: SYSTEM },
            ...history.map(m => ({ role: m.role, content: m.content })),
          ];

          // Agentic loop — up to 6 tool rounds
          for (let round = 0; round < 6; round++) {
            const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${OR_KEY()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://chinabridge.pro",
                "X-Title": "ChinaBridge Admin AI",
              },
              body: JSON.stringify({
                model,
                messages: apiMsgs,
                tools: TOOLS,
                tool_choice: "auto",
                max_tokens: 4096,
                stream: false,
              }),
            });

            if (!resp.ok) { sendJson({ error: await resp.text() }); break; }

            const data = await resp.json() as {
              choices: Array<{
                finish_reason: string;
                message: { role: string; content: string | null; tool_calls?: ToolCall[] };
              }>;
            };

            const choice = data.choices?.[0];
            if (!choice) { sendJson({ error: "No response from AI" }); break; }

            if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
              apiMsgs.push(choice.message);

              for (const tc of choice.message.tool_calls) {
                const fn = tc.function.name;
                let args: Record<string, string> = {};
                try { args = JSON.parse(tc.function.arguments); } catch {}

                let result = "";
                if (fn === "browse_web" && args.url) {
                  sendJson({ status: `🌐 Открываю: ${args.url}` });
                  result = await fetchPage(args.url);
                } else if (fn === "github_read_file" && args.path) {
                  sendJson({ status: `📄 Читаю файл: ${args.path}` });
                  result = await ghReadFile(args.path);
                } else if (fn === "github_list_dir") {
                  sendJson({ status: `📁 Смотрю директорию: ${args.path || "/"}` });
                  result = await ghListDir(args.path ?? "");
                } else if (fn === "github_write_file" && args.path && args.content) {
                  sendJson({ status: `✏️ Коммичу: ${args.path}` });
                  result = await ghWriteFile(args.path, args.content, args.message ?? "update via AI chat");
                } else {
                  result = `[Unknown tool: ${fn}]`;
                }

                apiMsgs.push({ role: "tool", tool_call_id: tc.id, content: result });
              }
            } else {
              fullText = choice.message.content ?? "";
              if (fullText) sendJson({ text: fullText });
              break;
            }
          }

          if (fullText) {
            try {
              await sql`INSERT INTO ai_chat_history (role, content, model) VALUES ('assistant', ${fullText}, ${model})`;
            } catch (e) {
              console.error("[ai-chat] save failed:", e);
            }
          }

          send("[DONE]");
          controller.close();
        } catch (e) {
          sendJson({ error: String(e) });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
