import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });

  const sql = neon(dbUrl);
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  await sql`DELETE FROM calc_anon_requests WHERE ip = ${ip} AND date = CURRENT_DATE`;
  return NextResponse.json({ ok: true, ip, message: "Rate limit reset for your IP" });
}
