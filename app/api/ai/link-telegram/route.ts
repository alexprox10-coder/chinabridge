import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const db = () => neon(process.env.DATABASE_URL!);

// Привязывает анонимную сессию (браузерный UUID) к реальному Telegram, когда
// клиент вводит его добровольно ("Сохранить диалог") или после исчерпания лимита.
// Переносит историю использования (ai_usage) и профиль, накопленные под anonymous_id,
// на identity=telegram — иначе после привязки клиент "потеряет" уже истраченные
// бесплатные анализы и AI забудет то, что успел узнать о нём анонимно.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });

  const sessionId: string = body.session_id ?? "";
  const anonymousId: string = body.anonymous_id ?? "";
  const userTelegram: string = (body.user_telegram ?? "").trim();

  if (!userTelegram) {
    return NextResponse.json({ error: "user_telegram required" }, { status: 400 });
  }

  const sql = db();

  if (sessionId) {
    await sql`UPDATE ai_sessions SET user_telegram = ${userTelegram}, updated_at = NOW() WHERE id = ${sessionId}`;
  }

  if (anonymousId && anonymousId !== userTelegram) {
    await sql`UPDATE ai_sessions SET user_telegram = ${userTelegram} WHERE user_telegram = ${anonymousId}`.catch(() => null);
    await sql`UPDATE ai_usage SET user_telegram = ${userTelegram} WHERE user_telegram = ${anonymousId}`.catch(() => null);
    await sql`UPDATE ai_analyses SET user_telegram = ${userTelegram} WHERE user_telegram = ${anonymousId}`.catch(() => null);
    // ai_client_profiles.user_telegram уникален — если у настоящего telegram уже
    // есть профиль, просто отбрасываем анонимный (переносить нечего конфликтующее).
    await sql`DELETE FROM ai_client_profiles WHERE user_telegram = ${anonymousId}
      AND EXISTS (SELECT 1 FROM ai_client_profiles WHERE user_telegram = ${userTelegram})`.catch(() => null);
    await sql`UPDATE ai_client_profiles SET user_telegram = ${userTelegram} WHERE user_telegram = ${anonymousId}`.catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
