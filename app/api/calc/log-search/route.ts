import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { product_name, category } = await req.json() as { product_name?: string; category?: string };
    if (!product_name) return NextResponse.json({ ok: false });

    const db = neon(process.env.DATABASE_URL!);

    // Ensure table exists
    await db`
      CREATE TABLE IF NOT EXISTS calc_searches (
        id          SERIAL PRIMARY KEY,
        product_name TEXT NOT NULL,
        category    TEXT NOT NULL DEFAULT 'other',
        country_from TEXT NOT NULL DEFAULT 'China',
        ua          TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    await db`CREATE INDEX IF NOT EXISTS cs_created ON calc_searches(created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS cs_category ON calc_searches(category)`;

    const ua = req.headers.get("user-agent")?.slice(0, 120) ?? null;
    await db`
      INSERT INTO calc_searches (product_name, category, ua)
      VALUES (${product_name}, ${category ?? "other"}, ${ua})`;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
