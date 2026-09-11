import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = "8979087725";

async function sendTg(text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
  });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Last 7 days leads
    const rows = await sql`
      SELECT
        COALESCE(country_destination, 'OTHER') as country,
        priority,
        source,
        COUNT(*) as cnt
      FROM crm_leads
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND tenant_id = 'tenant-chinabridge'
      GROUP BY country_destination, priority, source
      ORDER BY country_destination, priority
    `;

    // Aggregate by country
    type Agg = { total: number; hot: number; warm: number; cold: number; ai: number; lp: number; other: number };
    const byCountry: Record<string, Agg> = {};
    for (const r of rows) {
      const c = (r.country as string).toUpperCase() || "OTHER";
      if (!byCountry[c]) byCountry[c] = { total: 0, hot: 0, warm: 0, cold: 0, ai: 0, lp: 0, other: 0 };
      const agg = byCountry[c];
      const cnt = Number(r.cnt);
      agg.total += cnt;
      if (r.priority === "HOT")  agg.hot  += cnt;
      if (r.priority === "WARM") agg.warm += cnt;
      if (r.priority === "COLD") agg.cold += cnt;
      const src = String(r.source ?? "");
      if (src.includes("ai_consultant")) agg.ai += cnt;
      else if (src.includes("lp_") || src.includes("website")) agg.lp += cnt;
      else agg.other += cnt;
    }

    const total = Object.values(byCountry).reduce((s, a) => s + a.total, 0);
    const now = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

    const fmt = (c: string) => {
      const a = byCountry[c] ?? { total: 0, hot: 0, warm: 0, cold: 0, ai: 0, lp: 0, other: 0 };
      const hotRate = a.total > 0 ? Math.round(a.hot / a.total * 100) : 0;
      const flag = c === "KZ" ? "🇰🇿" : c === "RU" ? "🇷🇺" : "🌍";
      return [
        `${flag} <b>${c}</b>: ${a.total} лидов`,
        `  🔥 HOT: ${a.hot} (${hotRate}%) | 🟡 WARM: ${a.warm} | 🔵 COLD: ${a.cold}`,
        `  🤖 AI: ${a.ai} | 🌐 LP/форма: ${a.lp} | 📌 Прочее: ${a.other}`,
      ].join("\n");
    };

    const countries = Object.keys(byCountry).sort();
    const lines = [
      `📊 <b>Воронка RU vs KZ — неделя до ${now}</b>`,
      `Всего лидов: ${total}`,
      "",
      ...countries.map(fmt),
      "",
      `<i>HOT = intent_score ≥ 70 · Данные: Neon CRM</i>`,
    ];

    await sendTg(lines.join("\n"));

    return NextResponse.json({ ok: true, total, countries: byCountry });
  } catch (e) {
    console.error("[funnel-report]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
