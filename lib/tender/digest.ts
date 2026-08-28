// Daily Tender Intelligence Report — Telegram digest
import type { TenderOpportunity } from "./types";
import { getOpportunities, getDailyStats } from "./db";

const TG_API = "https://api.telegram.org";
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
  ?? process.env.TELEGRAM_CHAT_ID
  ?? "8979087725";

function fmt(n: number): string {
  return n.toLocaleString("ru");
}

function rub(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} млрд ₽`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} млн ₽`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)} тыс ₽`;
  return `${n} ₽`;
}

function urgencyEmoji(urgency: string): string {
  return urgency === "HIGH" ? "🔥" : urgency === "MEDIUM" ? "⚡" : "📋";
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`${TG_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {});
}

export async function sendHotAlert(op: TenderOpportunity): Promise<void> {
  const urg = urgencyEmoji(op.urgency);
  const text = [
    `${urg} <b>HOT TENDER LEAD</b>`,
    ``,
    `<b>Компания:</b> ${op.company_id}`,
    `<b>Контракт:</b> ${rub(op.contract_value)}`,
    `<b>Товар:</b> ${op.category}`,
    `<b>China Fit:</b> ${op.china_import_fit}/100`,
    `<b>Opportunity:</b> ${op.opportunity_score}/100`,
    op.delivery_deadline ? `<b>Срок:</b> ${op.delivery_deadline} дней` : null,
    op.repeat_winner ? `<b>Повторный победитель:</b> ДА (${op.win_count} побед/год)` : null,
    ``,
    `<b>Оффер:</b> ${op.recommended_offer ?? "—"}`,
    `<b>Действие:</b> ${op.next_best_action ?? "—"}`,
    ``,
    `<a href="https://chinabridge.pro/admin/intelligence/tenders">Открыть в Admin →</a>`,
  ].filter(Boolean).join("\n");

  await sendTelegram(text);
}

export async function sendDailyDigest(): Promise<void> {
  const stats = await getDailyStats();
  const { rows: top5 } = await getOpportunities({ min_score: 75, limit: 5 });

  const header = [
    `🏆 <b>Tender Intelligence Daily Report</b>`,
    `📅 ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`,
    ``,
    `📊 <b>Сводка за сутки:</b>`,
    `• Процедур обработано: <b>${fmt(stats.total_procedures)}</b>`,
    `• Победителей найдено: <b>${fmt(stats.total_winners)}</b>`,
    `• China Fit &gt;80: <b>${fmt(stats.china_fit_80)}</b>`,
    `• Opportunity &gt;80: <b>${fmt(stats.opportunity_80)}</b>`,
    `• 🔥 HOT leads: <b>${fmt(stats.hot_count)}</b>`,
    `• Повторные победители: <b>${fmt(stats.repeat_winners)}</b>`,
    `• Сумма топ-контрактов: <b>${rub(stats.total_contract_value)}</b>`,
  ].join("\n");

  await sendTelegram(header);

  if (top5.length === 0) {
    await sendTelegram("💤 Новых HOT opportunities пока нет.");
    return;
  }

  let topText = `\n🥇 <b>TOP ${top5.length} OPPORTUNITIES:</b>\n`;
  top5.forEach((op, i) => {
    const urg = urgencyEmoji(op.urgency);
    topText += [
      ``,
      `<b>${i + 1}. ${op.company_id}</b> ${urg}`,
      `Контракт: ${rub(op.contract_value)} | ${op.category}`,
      `China Fit: ${op.china_import_fit} | Opportunity: ${op.opportunity_score}`,
      op.repeat_winner ? `🔄 Повторный победитель` : `🆕 Новый контракт`,
      op.next_best_action ? `→ ${op.next_best_action}` : null,
    ].filter(Boolean).join("\n");
  });

  topText += `\n\n<a href="https://chinabridge.pro/admin/intelligence/tenders">Открыть все →</a>`;
  await sendTelegram(topText);
}
