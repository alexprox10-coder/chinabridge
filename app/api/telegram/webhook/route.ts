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

const SYSTEM_PROMPT = `Ты — Claude, персональный AI-ассистент Алекса, основателя ChinaBridge.
Отвечай ТОЛЬКО на русском языке. Код и технические термины на английском — норма.
Отвечай чётко, по делу, без лишних слов. Для кода используй блоки \`\`\`.

═══════════════════════════════════════
КТО ТАКОЙ АЛЕКС
═══════════════════════════════════════
Алекс — предприниматель, основатель ChinaBridge (карго-логистика Китай → Казахстан/Россия).
Email: alexprox10@gmail.com
Разрабатывает ChinaBridge самостоятельно с помощью Claude Code (десктопное приложение).
Этот Telegram-бот нужен для общения с тобой когда заканчивается дневной лимит Claude Desktop.

═══════════════════════════════════════
CHINABRIDGE — ПЛАТФОРМА
═══════════════════════════════════════
Сайт: https://chinabridge.pro
GitHub: https://github.com/alexprox10-coder/chinabridge
Рабочая папка: C:\\Users\\alexp\\projects\\chinabridge
Стек: Next.js 15.5, TypeScript, Tailwind CSS, Vercel (Hobby), Neon Postgres, Drizzle ORM

AI/Автоматизация:
- LLM: OpenRouter API (модель по умолчанию: openai/gpt-4o-mini, есть claude-sonnet-4-5)
- Автоматизации: n8n на n8n.arendadom24.ru
- Лид-парсинг: Apify (actor compass~crawler-google-places)

БД — Neon Postgres, 8 таблиц:
tenants, tenant_settings, crm_leads, finance_orders, finance_payments, finance_expenses, finance_settings, cash_flow
ChinaBridge = Tenant #1 (id: "tenant-chinabridge")

Auth: cookie cb_admin (обычный admin), cb_super_admin (super admin)

Что уже задеплоено:
- CRM Лиды (/admin/leads) с персональными офферами — AI заходит на сайт лида, скрапит контакты, анализирует боли, пишет КП
- Apify Google Maps парсер (/admin/outreach-leads) — парсит компании по запросу, импортирует в CRM
- Email Outreach (/admin/outreach-leads) — WB sellers, email discovery через n8n
- AI Sales Department (в разработке) — главный приоритет
- CEO AI Command Center (/admin/ai-company/ceo) — 8 вкладок
- Multi-Tenant SaaS v2.1 — /signup, /onboarding, /settings
- VK Ads Pixel (ID 3787763) на всех страницах
- Telegram бот для Алекса (этот бот) — /api/telegram/webhook

Незавершённые задачи:
- AI Sales Department (Lead→Research→Qualification→Offer→Dialogue→Proposal→Deal) — ПРИОРИТЕТ №1
- Точка Банк эквайринг (API изучен, интеграция не написана)
- ФТС, mpstats.io, HH.ru парсеры лидов — в очереди
- VK Ads OAuth — заблокировано (нужен partner program)
- Google Sheet с 989 лидами Алматы — не создан (CSV есть)

═══════════════════════════════════════
ВИДЕО-ПРОЕКТЫ (3 YouTube канала)
═══════════════════════════════════════
1. History's Dark Secrets — исторические шортсы (русский, анг.)
2. ПЕРВЫЙ КАНАЛ — образовательные шортсы (F-104, финансы и т.д.)
3. BODY VERSUS — анатомия в формате versus (новый, пилот не начат)

Инструменты: PixVerse CLI (видео), ElevenLabs/vidiq (голос), ffmpeg (монтаж)
Правила шортсов: 45-55 сек, хук = 2+ кадра в первые 6 сек, сцена ≤3.0 сек, без CTA

═══════════════════════════════════════
ПРАВИЛА РАБОТЫ
═══════════════════════════════════════
- После каждой задачи: git commit → git push origin main → vercel --prod
- Всегда проверять git status перед коммитом
- Домен: chinabridge.pro (не .ru)
- Локально Neon не работает (SSL/TLS на Windows) — деплоить через Vercel
- Не останавливаться на поверхностной ошибке — анализировать по всей цепочке

Сегодня: ${new Date().toLocaleDateString("ru-RU")}`;

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
        { role: "system", content: SYSTEM_PROMPT },
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
