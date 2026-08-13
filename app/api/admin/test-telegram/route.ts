import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const token       = process.env.TELEGRAM_BOT_TOKEN      ?? '';
  const chatManager = process.env.TELEGRAM_MANAGER_CHAT_ID ?? '';
  const chatGeneral = process.env.TELEGRAM_CHAT_ID         ?? '';
  const chatChannel = process.env.TELEGRAM_CHANNEL_ID      ?? '';
  const n8nUrl      = process.env.N8N_WEBHOOK_URL          ?? '';

  const results: Record<string, unknown> = {
    vars: {
      TELEGRAM_BOT_TOKEN:       token       ? `set (${token.length} chars)` : 'NOT SET',
      TELEGRAM_MANAGER_CHAT_ID: chatManager ? `set: ${chatManager}`         : 'NOT SET',
      TELEGRAM_CHAT_ID:         chatGeneral ? `set: ${chatGeneral}`         : 'NOT SET',
      TELEGRAM_CHANNEL_ID:      chatChannel ? `set: ${chatChannel}`         : 'NOT SET',
      N8N_WEBHOOK_URL:          n8nUrl      ? `set (${n8nUrl.slice(0, 40)}...)` : 'NOT SET',
    },
  };

  if (!token) {
    return NextResponse.json({ ok: false, ...results, error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  // Проверяем бота
  try {
    const me = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(5000) });
    const meData = await me.json();
    results.bot = meData.ok ? `@${meData.result?.username} (${meData.result?.id})` : meData;
  } catch (e) { results.bot = String(e); }

  // Проверяем чаты
  for (const [name, cid] of [
    ['MANAGER_CHAT', chatManager],
    ['GENERAL_CHAT', chatGeneral],
  ] as [string, string][]) {
    if (!cid) { results[name] = 'not set'; continue; }
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${cid}`, { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      results[name] = d.ok
        ? { type: d.result?.type, title: d.result?.title, username: d.result?.username, first_name: d.result?.first_name }
        : { error: d.description };
    } catch (e) { results[name] = String(e); }
  }

  // Отправляем тест в MANAGER_CHAT
  if (chatManager) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatManager,
          text: '✅ <b>Тест уведомлений ChinaBridge</b>\n\nЕсли вы видите это — всё работает!',
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(6000),
      });
      const d = await r.json();
      results.test_send_manager = d.ok ? 'SENT OK' : { error: d.description, code: d.error_code };
    } catch (e) { results.test_send_manager = String(e); }
  }

  // Считаем лиды в БД (таблица crm_leads)
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [total]   = await sql`SELECT COUNT(*) as cnt FROM crm_leads`;
    const [week]    = await sql`SELECT COUNT(*) as cnt FROM crm_leads WHERE created_at >= NOW() - INTERVAL '7 days'`;
    const [today]   = await sql`SELECT COUNT(*) as cnt FROM crm_leads WHERE created_at >= NOW() - INTERVAL '1 day'`;
    const recent    = await sql`SELECT lead_id, name, phone, telegram, source, status, created_at FROM crm_leads ORDER BY created_at DESC LIMIT 10`;
    results.db_leads = { total: total.cnt, last_7_days: week.cnt, last_24h: today.cnt, recent };
  } catch (e) { results.db_leads = { error: String(e) }; }

  // Считаем product_analyses
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [total] = await sql`SELECT COUNT(*) as cnt FROM product_analyses`;
    const [week]  = await sql`SELECT COUNT(*) as cnt FROM product_analyses WHERE created_at::timestamptz >= NOW() - INTERVAL '7 days'`;
    results.db_analyses = { total: total.cnt, last_7_days: week.cnt };
  } catch (e) { results.db_analyses = { error: String(e) }; }

  return NextResponse.json({ ok: true, ...results });
}
