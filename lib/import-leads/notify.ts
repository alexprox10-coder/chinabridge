import type { ImportLead } from "./types";

const N8N_URL = process.env.N8N_WEBHOOK_URL ?? "";
const ADMIN_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chinabridge.pro";

export async function notifyTelegramLead(lead: ImportLead): Promise<void> {
  if (!N8N_URL) return;

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
    await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "import_lead.found",
        lead: {
          ...lead,
          telegram_text: text,
          crm_url: crmUrl,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    /* non-blocking */
  }
}
