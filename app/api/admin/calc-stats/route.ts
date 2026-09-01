import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifySessionToken } from "@/lib/crm/auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("cb_admin")?.value ?? "";
  const ok = session ? await verifySessionToken(session) : false;
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const [stats] = await sql`
    SELECT
      COUNT(*)::int                                                         AS total,
      COUNT(CASE WHEN subscribed_until > NOW() THEN 1 END)::int            AS active,
      MIN(created_at)                                                       AS first_payment,
      MAX(created_at)                                                       AS last_payment
    FROM calc_subscriptions
  `;

  const rows = await sql`
    SELECT client_id, subscribed_until, created_at
    FROM calc_subscriptions
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ stats, rows });
}
