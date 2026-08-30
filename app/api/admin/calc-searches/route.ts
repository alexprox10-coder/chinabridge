import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = neon(process.env.DATABASE_URL!);

    const [topProducts, topCategories, recent, total] = await Promise.all([
      db`SELECT product_name, COUNT(*) AS cnt
         FROM calc_searches
         WHERE created_at >= NOW() - INTERVAL '14 days'
         GROUP BY product_name
         ORDER BY cnt DESC
         LIMIT 30`,
      db`SELECT category, COUNT(*) AS cnt
         FROM calc_searches
         WHERE created_at >= NOW() - INTERVAL '14 days'
         GROUP BY category
         ORDER BY cnt DESC`,
      db`SELECT product_name, category, created_at
         FROM calc_searches
         ORDER BY created_at DESC
         LIMIT 50`,
      db`SELECT COUNT(*) AS n FROM calc_searches WHERE created_at >= NOW() - INTERVAL '14 days'`,
    ]);

    return NextResponse.json({
      ok: true,
      total_14d: parseInt((total[0] as { n: string }).n) || 0,
      top_products: topProducts,
      top_categories: topCategories,
      recent,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
