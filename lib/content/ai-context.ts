import {
  getMemories,
  getPosts,
  getTopics,
  getSchedule,
  getAnalyticsSummary,
  getCTAs,
  getConversation,
  type MemoryRow,
  type PostRow,
  type TopicRow,
  type ScheduleRow,
  type CTARow,
  type AnalyticsSummaryRow,
} from "./db";

/* ────────────────────────────────────────────────────────────────────────────
   Builds the full Russian-language system prompt for the AI content manager.
   Everything the model knows about the current content state lives here.
   ──────────────────────────────────────────────────────────────────────────── */

const BASE_PROMPT = `Ты — AI-менеджер по контенту компании ChinaBridge.

О компании:
- ChinaBridge — сервис белого импорта товаров из Китая в Россию и Казахстан
- Сайт: chinabridge.pro
- Telegram-канал: https://t.me/chinabridgeline
- Продукт: импорт под ключ (поиск поставщика, проверка, выкуп, логистика, таможня, AI-платформа)
- Тарифы: комиссия от 5%, доставка от $2.5/кг, таможня от 11 000 ₽
- Целевая аудитория: продавцы WB/Ozon/Kaspi, ИП, малый бизнес, оптовики, импортёры

Твои обязанности:
1. Генерировать качественные посты для Telegram, VK, MAX
2. Находить актуальные темы для контента (новости импорта, Китай, маркетплейсы)
3. Адаптировать один материал под разные платформы
4. Расставлять CTA согласно правилу частоты: 3–5 полезных постов → 1 рекламный
5. Находить рекламные площадки для продвижения ChinaBridge
6. Анализировать эффективность контента и давать рекомендации
7. Планировать контент-календарь

ПРАВИЛА ГЕНЕРАЦИИ ПОСТОВ:
- Telegram: живой, разговорный стиль, 300–800 символов, эмодзи умеренно
- VK: структурированный, 400–700 символов, можно без эмодзи
- MAX: короткий и ёмкий, 150–300 символов
- Нельзя выдумывать факты. Если нет данных — пиши (ДЕМО) или расчётный пример
- Реклама: не более 1 рекламного поста на каждые 3–5 полезных
- Язык: живой русский, без канцелярита, без машинных оборотов

КАТЕГОРИИ КОНТЕНТА:
- news: новости импорта/Китая/маркетплейсов
- useful: практические советы (5 ошибок, как выбрать...)
- case: кейсы (реальные или расчётные с пометкой ДЕМО)
- ai: AI-инструменты для бизнеса, автоматизация
- logistics: логистика, доставка, маршруты
- marketplace: WB, Ozon, Kaspi, тренды
- supplier: поиск и проверка поставщиков
- economics: экономика импорта, расчёты
- sales: рекламные посты с CTA

КОГДА ГЕНЕРИРУЕШЬ ПОСТ, ВСЕГДА ВЫДАВАЙ JSON:
{
  "title": "Заголовок темы",
  "body": "Текст поста",
  "platform": "telegram|vk|max",
  "category": "news|useful|case|ai|logistics|marketplace|supplier|economics|sales",
  "cta_type": "none|calculator|product_finder|supplier_finder|trial|partner",
  "image_prompt": "Описание изображения на английском для AI (или null)",
  "audience": "wb_seller|ozon_seller|b2b|beginner|wholesaler|all",
  "utm_content": "краткий_slug"
}

Если тебя просят найти темы или площадки — дай список с деталями.
Если тебя просят изменить расписание — опиши, что изменишь.`;

/* ── Formatting helpers ───────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  news: "новости",
  useful: "польза",
  case: "кейс",
  ai: "AI",
  logistics: "логистика",
  marketplace: "маркетплейсы",
  supplier: "поставщики",
  economics: "экономика",
  sales: "реклама",
};

function trim(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function formatMemories(memories: MemoryRow[]): string {
  if (!memories.length) {
    return "Владелец пока не сохранил ни одной инструкции. Если он просит что-то запомнить — подтверди, что запомнил.";
  }
  const byCategory = new Map<string, MemoryRow[]>();
  for (const m of memories) {
    const cat = m.category || "general";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(m);
  }
  const parts: string[] = [];
  for (const [cat, items] of byCategory) {
    parts.push(`Категория «${cat}»:`);
    for (const it of items) parts.push(`  - ${it.key}: ${it.value}`);
  }
  return parts.join("\n");
}

function formatPosts(posts: PostRow[]): string {
  if (!posts.length) {
    return "Постов в базе ещё нет. Это старт контент-производства — предложи, с чего начать.";
  }

  const lines: string[] = [];
  for (const p of posts) {
    const cat = CATEGORY_LABELS[p.category] ?? p.category;
    const cta = p.cta_type && p.cta_type !== "none" ? ` | CTA: ${p.cta_type}` : " | без CTA";
    const date = p.created_at ? String(p.created_at).slice(0, 10) : "";
    lines.push(
      `- [#${p.id}] ${p.platform} | ${cat} | статус: ${p.status}${cta}${date ? ` | ${date}` : ""}`,
    );
    lines.push(`    ${trim(p.title || p.body, 140)}`);
  }

  /* CTA frequency check — the 3–5 useful : 1 sales rule. */
  const salesCount = posts.filter((p) => p.category === "sales" || (p.cta_type && p.cta_type !== "none")).length;
  const usefulCount = posts.length - salesCount;
  lines.push("");
  lines.push(
    `Баланс последних ${posts.length} постов: полезных ${usefulCount}, рекламных/с CTA ${salesCount}.` +
      (salesCount > 0 && usefulCount / salesCount < 3
        ? " ВНИМАНИЕ: рекламы слишком много, следующие посты делай без CTA."
        : " Соотношение в норме."),
  );

  return lines.join("\n");
}

function formatTopics(topics: TopicRow[]): string {
  if (!topics.length) return "Свободных тем в очереди нет — можно предложить новые.";
  return topics
    .slice(0, 25)
    .map(
      (t) =>
        `- [#${t.id}] ${t.title} | категория: ${CATEGORY_LABELS[t.category] ?? t.category} | приоритет: ${
          t.priority
        }${t.source ? ` | источник: ${t.source}` : ""}`,
    )
    .join("\n");
}

function formatSchedule(schedule: ScheduleRow[]): string {
  if (!schedule.length) return "Расписание публикаций не настроено.";
  return schedule
    .map((s) => {
      let times = s.posting_times;
      try {
        const parsed = JSON.parse(s.posting_times);
        if (Array.isArray(parsed)) times = parsed.join(", ");
      } catch {
        /* keep raw string */
      }
      return `- ${s.platform}: ${s.posts_per_day} постов/день, минимальный интервал ${s.min_interval_minutes} мин, слоты: ${times}${
        s.is_active ? "" : " (ОТКЛЮЧЕНО)"
      }`;
    })
    .join("\n");
}

function formatAnalytics(summary: AnalyticsSummaryRow[]): string {
  if (!summary.length) {
    return "Реальной статистики по постам пока нет. В интерфейсе показаны ДЕМО-цифры — не выдавай их за факты.";
  }
  return summary
    .map((s) => {
      const ctr = s.views ? `${((s.clicks / s.views) * 100).toFixed(1)}%` : "н/д";
      return `- ${s.platform}: показов ${s.views}, кликов ${s.clicks} (CTR ${ctr}), регистраций ${s.registrations}, триалов ${s.trials}, лидов ${s.leads}, оплат ${s.payments}`;
    })
    .join("\n");
}

function formatCTAs(ctas: CTARow[]): string {
  if (!ctas.length) return "Библиотека CTA пуста.";
  return ctas
    .map((c) => `- ${c.cta_type}: «${c.text_template}» → ${c.url} (вес ${c.weight})`)
    .join("\n");
}

function formatHistory(history: Array<{ role: string; content: string }>): string {
  if (!history.length) return "Это начало диалога.";
  return history
    .slice(-12)
    .map((m) => {
      const who = m.role === "user" ? "Владелец" : "Ты";
      return `${who}: ${m.content.length > 600 ? `${m.content.slice(0, 600)}…` : m.content}`;
    })
    .join("\n");
}

/* ── Main entry ───────────────────────────────────────────────────────────── */

export async function buildContentSystemPrompt(sessionId: string): Promise<string> {
  const [memories, posts, topics, schedule, summary, ctas, history] = await Promise.all([
    getMemories().catch(() => [] as MemoryRow[]),
    getPosts(undefined, undefined, 10).catch(() => [] as PostRow[]),
    getTopics("pending").catch(() => [] as TopicRow[]),
    getSchedule().catch(() => [] as ScheduleRow[]),
    getAnalyticsSummary().catch(() => [] as AnalyticsSummaryRow[]),
    getCTAs().catch(() => [] as CTARow[]),
    getConversation(sessionId, 12).catch(() => [] as Array<{ role: string; content: string }>),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekday = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"][
    now.getUTCDay()
  ];

  return [
    BASE_PROMPT,
    "",
    `Сегодняшняя дата: ${today} (${weekday})`,
    "",
    "[ТЕКУЩЕЕ СОСТОЯНИЕ КОНТЕНТА]",
    "",
    "── Последние 10 постов ──",
    formatPosts(posts),
    "",
    "── Темы в очереди (pending) ──",
    formatTopics(topics),
    "",
    "── Расписание публикаций ──",
    formatSchedule(schedule),
    "",
    "── Статистика по площадкам ──",
    formatAnalytics(summary),
    "",
    "── Библиотека CTA ──",
    formatCTAs(ctas),
    "",
    "[ЗАПОМНЕННЫЕ ИНСТРУКЦИИ ВЛАДЕЛЬЦА]",
    formatMemories(memories),
    "",
    "[КРАТКИЙ КОНТЕКСТ ПРЕДЫДУЩЕГО ДИАЛОГА]",
    formatHistory(history),
    "",
    "Отвечай структурировано, короткими абзацами и списками. Не выдумывай данные, которых нет выше. Когда генерируешь пост — обязательно оборачивай JSON в блок ```json.",
  ].join("\n");
}
