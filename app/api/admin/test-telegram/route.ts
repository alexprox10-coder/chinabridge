import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const token       = process.env.TELEGRAM_BOT_TOKEN      ?? '';
  const chatManager = process.env.TELEGRAM_MANAGER_CHAT_ID ?? '';
  const chatGeneral = process.env.TELEGRAM_CHAT_ID         ?? '';
  const chatChannel = process.env.TELEGRAM_CHANNEL_ID      ?? '';

  const results: Record<string, unknown> = {
    vars: {
      TELEGRAM_BOT_TOKEN:       token       ? `set (${token.length} chars)` : 'NOT SET',
      TELEGRAM_MANAGER_CHAT_ID: chatManager ? `set: ${chatManager}`         : 'NOT SET',
      TELEGRAM_CHAT_ID:         chatGeneral ? `set: ${chatGeneral}`         : 'NOT SET',
      TELEGRAM_CHANNEL_ID:      chatChannel ? `set: ${chatChannel}`         : 'NOT SET',
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
  ] as const) {
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

  return NextResponse.json({ ok: true, ...results });
}
