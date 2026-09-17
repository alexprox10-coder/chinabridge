import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.CALC_ADMIN_SECRET;

// Admin-only: reset IP rate limit counter for a specific IP or current request's IP
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "127.0.0.1";
  const date = new Date().toISOString().slice(0, 10);

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Reset lifetime counter (all date keys for this IP)
    await sql`DELETE FROM calc_anon_requests WHERE ip = ${"aif:" + ip}`;
    await sql`DELETE FROM calc_anon_requests WHERE ip = ${ip}`;
    return NextResponse.json({ ok: true, ip });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
