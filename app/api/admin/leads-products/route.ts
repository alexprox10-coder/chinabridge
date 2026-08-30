import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = neon(process.env.DATABASE_URL!);

    const [byProduct, byCategory, recent, total] = await Promise.all([
      db`SELECT product, COUNT(*) AS cnt
         FROM crm_leads
         WHERE product IS NOT NULL AND product != ''
         GROUP BY product
         ORDER BY cnt DESC
         LIMIT 50`,
      db`SELECT category, COUNT(*) AS cnt
         FROM crm_leads
         WHERE product IS NOT NULL AND product != ''
         GROUP BY category
         ORDER BY cnt DESC`,
      db`SELECT product, category, company, source, created_at
         FROM crm_leads
         WHERE product IS NOT NULL AND product != ''
         ORDER BY created_at DESC
         LIMIT 30`,
      db`SELECT COUNT(*) AS n FROM crm_leads WHERE product IS NOT NULL AND product != ''`,
    ]);

    return NextResponse.json({
      ok: true,
      total: parseInt((total[0] as { n: string }).n) || 0,
      by_product: byProduct,
      by_category: byCategory,
      recent,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
