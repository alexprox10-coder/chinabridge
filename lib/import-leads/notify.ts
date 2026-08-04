import type { ImportLead } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const ADMIN_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chinabridge.pro";

export async function notifyTelegramLead(lead: ImportLead): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const crmUrl = `${ADMIN_URL}/admin/import-leads`;

  const text = `🔥 Новый лид (Import Finder)

🏢 Компания: ${lead.company}
🌐 Сайт: ${lead.website}
📦 Категория: ${lead.category}
📍 Город: ${lead.city || "—"}
📞 Телефон: ${lead.phone || "—"}
📧 Email: ${lead.email || "—"}

🏆 Lead Score: ${lead.score_stars} (${lead.score}/5)
📊 Импортирует: ${lead.imports === "yes" ? "Да ✅" : lead.imports === "likely" ? "Вероятно 🟡" : "Нет 🔴"}

💡 Почему интересен:
${lead.why}

🎯 Предложить:
${lead.offer}

💬 Готовое сообщение:
${lead.message}

📋 CRM: ${crmUrl}`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    /* non-blocking */
  }
}
