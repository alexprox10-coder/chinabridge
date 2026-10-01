import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TOKEN = "cb-stats-check-7f2a";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const idType = await sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'outreach_contacts' ORDER BY ordinal_position
    `;
    const repliesExists = await sql`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outreach_replies') as exists
    `;
    return NextResponse.json({ ok: true, outreach_contacts_columns: idType, outreach_replies_exists: repliesExists[0] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
