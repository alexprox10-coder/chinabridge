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
    // Keys are stored with "url:" prefix in analyze-url route
    const key = `url:${ip}`;
    await sql`DELETE FROM calc_anon_requests WHERE ip = ${key} AND date = CURRENT_DATE`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
