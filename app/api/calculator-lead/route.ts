import { NextResponse } from "next/server";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN   = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const PARSER_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

async function ensureTable(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS calculator_leads (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      telegram     TEXT NOT NULL,
      product_url  TEXT,
      product_name TEXT,
      margin       DECIMAL,
      profit       DECIMAL,
      purchase_price DECIMAL,
      marketplace  TEXT,
      verdict      TEXT,
      source       TEXT DEFAULT 'calculator',
      status       TEXT DEFAULT 'new',
      report_code  UUID DEFAULT gen_random_uuid(),
      pdf_sent_at  TIMESTAMPTZ,
      notes        TEXT
    )
  `;
  await sql`ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS report_code UUID DEFAULT gen_random_uuid()`.catch(() => null);
}

function fmtNum(n: number | null | undefined): string {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString("ru-RU");
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sql = neon(process.env.DATABASE_URL!);

    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO calculator_leads
        (telegram, product_url, product_name, margin, profit, purchase_price, marketplace, verdict, source)
      VALUES
        (${data.telegram ?? ""},
         ${data.product_url ?? null},
         ${data.product_name ?? null},
         ${data.margin ?? null},
         ${data.profit ?? null},
         ${data.purchase_price ?? null},
         ${data.marketplace ?? null},
         ${data.verdict ?? null},
         ${data.source ?? "calculator_pdf"})
      RETURNING id, report_code
    `;
    const row = rows[0] as { id: string; report_code: string };

    // Notify manager
    const notifyToken = PARSER_BOT_TOKEN || LID_BOT_TOKEN;
    if (notifyToken && MANAGER_CHAT_ID) {
      const verdictEmoji = data.verdict === "green" ? "🟢" : data.verdict === "red" ? "🔴" : "🟡";
      const text = [
        `🔥 <b>НОВЫЙ ЛИД С КАЛЬКУЛЯТОРА</b>`,
        ``,
        `👤 Telegram: <code>${data.telegram}</code>`,
        `${verdictEmoji} Вердикт: ${data.verdict ?? "—"}`,
        `📊 Маржа: ${data.margin?.toFixed(1) ?? "—"}%`,
        `💰 Прибыль/шт: ${fmtNum(data.profit)} ₽`,
        `🛍 Маркетплейс: ${data.marketplace ?? "—"}`,
        data.product_name ? `📦 Товар: ${data.product_name}` : "",
        data.product_url ? `🔗 ${data.product_url}` : "",
        ``,
        `→ Запросил PDF-отчёт, ждёт бота`,
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: MANAGER_CHAT_ID, text, parse_mode: "HTML" }),
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, report_code: row.report_code });
  } catch (e) {
    console.error("[calculator-lead]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
