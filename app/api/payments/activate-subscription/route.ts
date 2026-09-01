import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSession } from "@/lib/client-portal/auth";

export const runtime = "nodejs";

const DAYS = 30;

export async function POST(_req: NextRequest) {
  const session = await getSession();

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS calc_subscriptions (
      client_id   TEXT NOT NULL,
      client_email TEXT NOT NULL DEFAULT '',
      subscribed_until TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (client_id)
    )`;

  const until = new Date();
  until.setDate(until.getDate() + DAYS);

  if (session?.clientId) {
    await sql`
      INSERT INTO calc_subscriptions (client_id, client_email, subscribed_until)
      VALUES (${session.clientId}, ${session.email ?? ''}, ${until.toISOString()})
      ON CONFLICT (client_id)
      DO UPDATE SET subscribed_until = EXCLUDED.subscribed_until, created_at = NOW()`;

    // Telegram notification to manager
    const tgToken  = process.env.TELEGRAM_PAY_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_PAY_CHAT_ID ?? process.env.TELEGRAM_MANAGER_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChatId) {
      const text = [
        `💳 <b>Оплата PRO-калькулятора</b>`,
        ``,
        `👤 Клиент: <code>${session.clientId}</code>`,
        session.email ? `📧 Email: ${session.email}` : '',
        `📅 Доступ до: <b>${until.toLocaleDateString('ru-RU')}</b>`,
        ``,
        `✅ Подписка активирована`,
      ].filter(Boolean).join('\n');
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'HTML' }),
        signal:  AbortSignal.timeout(5000),
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, subscribed_until: until.toISOString(), clientId: session?.clientId ?? null });
}
