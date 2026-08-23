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
  }

  return NextResponse.json({ ok: true, subscribed_until: until.toISOString(), clientId: session?.clientId ?? null });
}
