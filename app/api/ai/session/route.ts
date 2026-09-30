import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const db = () => neon(process.env.DATABASE_URL!);

// GET ?user_telegram=... — последняя активная сессия клиента + её сообщения + профиль.
// Используется для восстановления диалога при повторном визите (Profile Memory continuity).
export async function GET(req: NextRequest) {
  const userTelegram = req.nextUrl.searchParams.get("user_telegram");
  if (!userTelegram) {
    return NextResponse.json({ error: "user_telegram required" }, { status: 400 });
  }

  const sql = db();

  const [sessions, profile] = (await Promise.all([
    sql`
      SELECT id, created_at, status, title FROM ai_sessions
      WHERE user_telegram = ${userTelegram}
      ORDER BY created_at DESC LIMIT 1
    `,
    sql`SELECT * FROM ai_client_profiles WHERE user_telegram = ${userTelegram}`,
  ])) as [Array<{ id: string; created_at: string; status: string; title: string | null }>, Array<Record<string, unknown>>];

  const session = sessions[0] ?? null;
  let messages: Array<{ role: string; content: string; created_at: string }> = [];

  if (session) {
    messages = (await sql`
      SELECT role, content, created_at FROM ai_messages
      WHERE session_id = ${session.id} ORDER BY created_at ASC LIMIT 50
    `) as Array<{ role: string; content: string; created_at: string }>;
  }

  return NextResponse.json({
    session_id: session?.id ?? null,
    messages,
    profile: profile[0] ?? null,
  });
}
