import type { CheckResult } from "../types";

// AI CTO uses its own dedicated bot; falls back to general bot
const BOT_TOKEN = process.env.AI_CTO_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID   = process.env.AI_CTO_CHAT_ID   ?? process.env.TELEGRAM_CHAT_ID   ?? "";

async function checkBotCredentials(): Promise<CheckResult> {
  if (!BOT_TOKEN) return { name: "Bot token", status: "ERROR", message: "TELEGRAM_BOT_TOKEN not set" };
  if (!CHAT_ID)   return { name: "Chat ID",   status: "ERROR", message: "TELEGRAM_CHAT_ID not set"   };
  return { name: "Telegram credentials", status: "OK", message: `Token set, chat: ${CHAT_ID}` };
}

async function checkBotApi(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { signal: AbortSignal.timeout(8000) });
    const json = await res.json() as { ok: boolean; result?: { username?: string } };
    const ms   = Date.now() - t0;
    if (!json.ok) return { name: "Telegram Bot API", status: "ERROR", message: "Bot token invalid", ms };
    return { name: "Telegram Bot API", status: "OK", message: `@${json.result?.username ?? "bot"} — ${ms}ms`, ms };
  } catch (e) {
    return { name: "Telegram Bot API", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

export async function checkTelegramBot(): Promise<CheckResult[]> {
  const creds = await checkBotCredentials();
  if (creds.status === "ERROR") return [creds];
  const api = await checkBotApi();
  return [creds, api];
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10000),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
