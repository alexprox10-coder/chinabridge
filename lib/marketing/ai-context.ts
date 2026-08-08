import {
  getMemories,
  getCampaigns,
  getChannelStats,
  getPartners,
  getTasks,
  getConversation,
  type CampaignRow,
  type ChannelRow,
  type PartnerRow,
  type TaskRow,
} from "./db";

/* ────────────────────────────────────────────────────────────────────────────
   Builds the full Russian-language system prompt for the AI marketing director.
   Everything the model knows about the current state of marketing lives here.
   ──────────────────────────────────────────────────────────────────────────── */

const BASE_PROMPT = `Ты — AI-директор по маркетингу компании ChinaBridge.

О компании:
- ChinaBridge — сервис белого импорта товаров из Китая в Россию и Казахстан
- Сайт: chinabridge.pro
- Продукт: импорт под ключ (поиск поставщика, проверка, выкуп, логистика, таможня)
- Целевая аудитория: предприниматели, продавцы WB/Ozon, ИП, малый бизнес
- Минимальная партия: от 50 кг
- Ключевое УТП: белая схема, официальное таможенное оформление, AI-платформа
- Средний чек: 80 000–250 000 ₽ за поставку
- Тарифы: комиссия выкупа от 5%, доставка от $2.5/кг, таможня от 11 000 ₽

Твои обязанности:
1. Анализировать маркетинговые данные и воронку конверсии
2. Рекомендовать рекламные каналы с обоснованием на основе данных
3. Находить рекламные площадки (Telegram, VK, YouTube, сайты)
4. Искать и оценивать партнеров (школы WB, ВЭД, логистика, агентства)
5. Составлять рекламные кампании и медиапланы
6. Создавать UTM-метки и отслеживать конверсию
7. Составлять ежедневные и недельные отчеты
8. Проводить A/B тесты и анализировать результаты

ВАЖНЫЕ ПРАВИЛА:
- Никогда не давай рекомендации без данных. Если данных нет — скажи "Недостаточно данных"
- Если используются демо-данные — всегда указывай "(ДЕМО)"
- Считай реальные метрики: CPL = бюджет/лиды, CAC = бюджет/оплаты, ROAS = выручка/расходы
- Отвечай на русском языке
- Будь конкретным: называй цифры, даты, каналы, площадки
- При поиске площадок — предлагай реальные существующие каналы/сообщества`;

/* ── Formatting helpers ───────────────────────────────────────────────────── */

const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

function ratio(numerator: number, denominator: number): string {
  if (!denominator) return "н/д";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function perUnit(spend: number, units: number): string {
  if (!units) return "н/д";
  return rub(spend / units);
}

function formatMemories(memories: Array<{ key: string; value: string; category: string }>): string {
  if (!memories.length) {
    return "Владелец пока не сохранил ни одной инструкции. Если он просит что-то запомнить — подтверди, что запомнил.";
  }
  const byCategory = new Map<string, Array<{ key: string; value: string }>>();
  for (const m of memories) {
    const cat = m.category || "general";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push({ key: m.key, value: m.value });
  }
  const parts: string[] = [];
  for (const [cat, items] of byCategory) {
    parts.push(`Категория «${cat}»:`);
    for (const it of items) parts.push(`  - ${it.key}: ${it.value}`);
  }
  return parts.join("\n");
}

function formatCampaigns(campaigns: CampaignRow[]): string {
  if (!campaigns.length) {
    return "Кампаний в базе нет. Реальных данных по рекламным кампаниям нет — не выдумывай цифры.";
  }

  const lines: string[] = [];
  let totalSpend = 0;
  let totalLeads = 0;
  let totalPayments = 0;

  for (const c of campaigns) {
    const spend = c.spend_rub ?? 0;
    const leads = c.leads ?? 0;
    const clicks = c.clicks ?? 0;
    const impressions = c.impressions ?? 0;
    const payments = c.payments ?? 0;
    const trials = c.trials ?? 0;

    totalSpend += spend;
    totalLeads += leads;
    totalPayments += payments;

    const period =
      c.start_date || c.end_date ? ` | период: ${c.start_date ?? "?"} → ${c.end_date ?? "?"}` : "";
    const utm = c.utm_campaign ? ` | utm_campaign=${c.utm_campaign}` : "";

    lines.push(
      `- [#${c.id}] «${c.name}» | канал: ${c.channel} | статус: ${c.status} | бюджет: ${rub(
        c.budget_rub,
      )}${period}${utm}`,
    );
    lines.push(
      `    факт: расход ${rub(spend)}, показов ${impressions}, кликов ${clicks} (CTR ${ratio(
        clicks,
        impressions,
      )}), лидов ${leads} (CPL ${perUnit(spend, leads)}), триалов ${trials}, оплат ${payments} (CAC ${perUnit(
        spend,
        payments,
      )})`,
    );
    if (c.goal) lines.push(`    цель: ${c.goal}`);
  }

  lines.push("");
  lines.push(
    `ИТОГО по кампаниям: расход ${rub(totalSpend)}, лидов ${totalLeads} (средний CPL ${perUnit(
      totalSpend,
      totalLeads,
    )}), оплат ${totalPayments} (средний CAC ${perUnit(totalSpend, totalPayments)})`,
  );

  return lines.join("\n");
}

function formatChannels(channels: ChannelRow[]): string {
  if (!channels.length) {
    return "В базе нет ни одного рекламного канала с накопленной статистикой. Аналитика в правой панели интерфейса — ДЕМО-данные.";
  }

  const lines: string[] = [];
  for (const ch of channels) {
    lines.push(
      `- ${ch.name} (${ch.platform}, ${ch.status}): расход ${rub(ch.spend_total)}, лидов ${
        ch.leads_total
      }, триалов ${ch.trials_total}, оплат ${ch.payments_total} | CPL ${perUnit(
        ch.spend_total,
        ch.leads_total,
      )} | CAC ${perUnit(ch.spend_total, ch.payments_total)} | лид→оплата ${ratio(
        ch.payments_total,
        ch.leads_total,
      )}`,
    );
    if (ch.notes) lines.push(`    заметка: ${ch.notes}`);
  }
  return lines.join("\n");
}

function formatPartners(partners: PartnerRow[]): string {
  if (!partners.length) {
    return "Партнеров в базе нет. Если владелец просит найти партнеров — предложи конкретные реальные площадки и объясни, как их добавить в CRM партнеров.";
  }

  const byStatus = new Map<string, PartnerRow[]>();
  for (const p of partners) {
    if (!byStatus.has(p.status)) byStatus.set(p.status, []);
    byStatus.get(p.status)!.push(p);
  }

  const lines: string[] = [];
  lines.push(
    `Всего партнеров: ${partners.length}. По статусам: ${[...byStatus.entries()]
      .map(([s, arr]) => `${s}=${arr.length}`)
      .join(", ")}`,
  );
  for (const p of partners.slice(0, 25)) {
    const audience = p.audience_size ? `${p.audience_size.toLocaleString("ru-RU")} подписчиков` : "аудитория н/д";
    const price = p.ad_price ? rub(p.ad_price) : "цена н/д";
    const er = p.er !== null && p.er !== undefined ? `ER ${p.er}%` : "ER н/д";
    lines.push(
      `- [#${p.id}] ${p.name} (${p.platform}) | ${audience} | ${er} | ${price} | статус: ${p.status} | скоринг: ${
        p.score ?? "н/д"
      }`,
    );
  }
  if (partners.length > 25) lines.push(`... и ещё ${partners.length - 25} партнеров`);
  return lines.join("\n");
}

function formatTasks(tasks: TaskRow[]): string {
  if (!tasks.length) return "Открытых маркетинговых задач нет.";
  return tasks
    .slice(0, 20)
    .map(
      (t) =>
        `- [#${t.id}] ${t.title} | приоритет: ${t.priority} | статус: ${t.status}${
          t.due_date ? ` | дедлайн: ${t.due_date}` : ""
        }`,
    )
    .join("\n");
}

function formatHistory(history: Array<{ role: string; content: string }>): string {
  if (!history.length) return "Это начало диалога.";
  return history
    .slice(-12)
    .map((m) => {
      const who = m.role === "user" ? "Владелец" : "Ты";
      const text = m.content.length > 600 ? `${m.content.slice(0, 600)}…` : m.content;
      return `${who}: ${text}`;
    })
    .join("\n");
}

/* ── Main entry ───────────────────────────────────────────────────────────── */

export async function buildMarketingSystemPrompt(sessionId: string): Promise<string> {
  const [memories, campaigns, channels, partners, tasks, history] = await Promise.all([
    getMemories().catch(() => [] as Awaited<ReturnType<typeof getMemories>>),
    getCampaigns().catch(() => [] as CampaignRow[]),
    getChannelStats().catch(() => [] as ChannelRow[]),
    getPartners().catch(() => [] as PartnerRow[]),
    getTasks("open").catch(() => [] as TaskRow[]),
    getConversation(sessionId, 12).catch(() => [] as Array<{ role: string; content: string }>),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return [
    BASE_PROMPT,
    "",
    `Сегодняшняя дата: ${today}`,
    "",
    "[ТЕКУЩИЕ ДАННЫЕ МАРКЕТИНГА]",
    "",
    "── Рекламные кампании ──",
    formatCampaigns(campaigns),
    "",
    "── Каналы привлечения (накопленная статистика) ──",
    formatChannels(channels),
    "",
    "── Партнеры и площадки ──",
    formatPartners(partners),
    "",
    "── Открытые задачи маркетинга ──",
    formatTasks(tasks),
    "",
    "[ЗАПОМНЕННЫЕ ИНСТРУКЦИИ ВЛАДЕЛЬЦА]",
    formatMemories(memories),
    "",
    "[КРАТКИЙ КОНТЕКСТ ПРЕДЫДУЩЕГО ДИАЛОГА]",
    formatHistory(history),
    "",
    "Отвечай структурировано, используй короткие абзацы, списки и конкретные цифры. Не выдумывай данные, которых нет выше.",
  ].join("\n");
}
