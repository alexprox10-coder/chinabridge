import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = neon(process.env.DATABASE_URL!);

    const [byProduct, byCategory, recent, total] = await Promise.all([
      db`SELECT product_name, COUNT(*) AS cnt
         FROM leads
         WHERE product_name IS NOT NULL AND product_name != ''
         GROUP BY product_name
         ORDER BY cnt DESC
         LIMIT 50`,
      db`SELECT
           CASE
             WHEN product_name ~* 'светильник|led|фонарь|лампа|освещ|прожектор' THEN 'lighting'
             WHEN product_name ~* 'электроник|гаджет|наушник|телефон|смартфон|планшет|ноутбук|процессор|видеокарт' THEN 'electronics'
             WHEN product_name ~* 'одежд|футболк|худи|куртк|обувь|текстиль' THEN 'clothing'
             WHEN product_name ~* 'автозапчаст|запчаст|шин|диск|автомобил|мото' THEN 'auto_parts'
             WHEN product_name ~* 'мебель|диван|стол|стул|кровать|шкаф' THEN 'furniture'
             WHEN product_name ~* 'оборудован|станок|инструмент|насос|компрессор|генератор' THEN 'equipment'
             WHEN product_name ~* 'игрушк|детск|конструктор' THEN 'toys'
             WHEN product_name ~* 'упаковк|пакет|пэт|тара|этикетк' THEN 'packaging'
             WHEN product_name ~* 'косметик|парфюм|крем|шампун' THEN 'cosmetics'
             WHEN product_name ~* 'посуд|кухонн|сковород|кастрюл' THEN 'home_goods'
             ELSE 'other'
           END AS category,
           COUNT(*) AS cnt
         FROM leads
         WHERE product_name IS NOT NULL AND product_name != ''
         GROUP BY category
         ORDER BY cnt DESC`,
      db`SELECT product_name, company_name, created_at
         FROM leads
         WHERE product_name IS NOT NULL AND product_name != ''
         ORDER BY created_at DESC
         LIMIT 30`,
      db`SELECT COUNT(*) AS n FROM leads WHERE product_name IS NOT NULL AND product_name != ''`,
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
