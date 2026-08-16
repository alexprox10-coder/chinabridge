import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ALLOWED = (process.env.TELEGRAM_ALLOWED_CHATS ?? "").split(",").map(s => s.trim()).filter(Boolean);
const MODEL = process.env.TELEGRAM_AI_MODEL ?? "anthropic/claude-sonnet-4-5";

// In-memory history (survives warm serverless instances)
const sessions = new Map<string, { role: "user" | "assistant"; content: string }[]>();

async function tg(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendTyping(chatId: number) {
  await tg("sendChatAction", { chat_id: chatId, action: "typing" });
}

async function send(chatId: number, text: string, extra?: object) {
  // Telegram ограничивает 4096 символов на сообщение
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }
  for (const chunk of chunks) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: chunk,
      parse_mode: "Markdown",
      ...extra,
    });
  }
}

async function callAI(msgs: { role: "user" | "assistant"; content: string }[]) {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) return "⚠️ OPENROUTER_API_KEY не настроен.";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Telegram Bot",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Ты — Claude, персональный AI-ассистент Алекса (основателя ChinaBridge).
Отвечай на русском языке.
Ты помогаешь с: разработкой ChinaBridge (Next.js 15, Vercel, Neon, n8n), видео-продакшном, бизнес-задачами, аналитикой.
Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}.
Отвечай чётко и по делу. Для кода используй блоки с подсветкой.`,
        },
        ...msgs.slice(-30),
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return `⚠️ AI ошибка ${res.status}: ${err.slice(0, 200)}`;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "⚠️ Пустой ответ от AI.";
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // Handle /setWebhook confirmation
  if (body.ok !== undefined) return NextResponse.json({ ok: true });

  const message = body.message ?? body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId: number = message.chat.id;
  const key = String(chatId);
  const text: string = message.text ?? "";
  const firstName: string = message.from?.first_name ?? "друг";

  if (!text) return NextResponse.json({ ok: true });

  // Security
  if (ALLOWED.length > 0 && !ALLOWED.includes(key)) {
    await send(chatId, `❌ Доступ запрещён. Твой chat_id: \`${chatId}\``);
    return NextResponse.json({ ok: true });
  }

  // Commands
  if (text === "/start") {
    await send(
      chatId,
      `👋 Привет, ${firstName}!\n\nЯ Claude — твой персональный AI-ассистент.\nПиши любые вопросы — по коду, бизнесу, видео или просто так.\n\n*Команды:*\n/clear — очистить историю диалога\n/model — показать текущую модель\n/id — показать твой chat\\_id`
    );
    return NextResponse.json({ ok: true });
  }

  if (text === "/clear") {
    sessions.delete(key);
    await send(chatId, "🗑 История диалога очищена. Начнём заново.");
    return NextResponse.json({ ok: true });
  }

  if (text === "/model") {
    await send(chatId, `🤖 Текущая модель: \`${MODEL}\``);
    return NextResponse.json({ ok: true });
  }

  if (text === "/id") {
    await send(chatId, `🆔 Твой chat\\_id: \`${chatId}\``);
    return NextResponse.json({ ok: true });
  }

  // AI response
  await sendTyping(chatId);

  const msgs = sessions.get(key) ?? [];
  msgs.push({ role: "user", content: text });

  const reply = await callAI(msgs);

  msgs.push({ role: "assistant", content: reply });
  sessions.set(key, msgs.slice(-60));

  await send(chatId, reply);

  return NextResponse.json({ ok: true });
}
