import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ ok: false });

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  try {
    const sql = neon(dbUrl);
    const key = `url:${ip}`;
    await sql`
      CREATE TABLE IF NOT EXISTS calc_anon_requests (
        ip text NOT NULL, date text NOT NULL, count integer DEFAULT 1 NOT NULL,
        PRIMARY KEY (ip, date)
      )`;
    await sql`DELETE FROM calc_anon_requests WHERE ip = ${key} AND date = CURRENT_DATE`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
