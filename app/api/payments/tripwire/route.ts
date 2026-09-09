import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import https from "node:https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOCHKA_JWT           = process.env.TOCHKA_JWT ?? "";
const TOCHKA_CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE ?? "305892710";
const tochkaAgent          = new https.Agent({ rejectUnauthorized: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS tripwire_orders (
      id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      amount         INTEGER DEFAULT 100,
      product_url    TEXT,
      product_name   TEXT,
      margin         DECIMAL,
      operation_id   TEXT,
      status         TEXT DEFAULT 'pending',
      paid_at        TIMESTAMPTZ,
      report_sent_at TIMESTAMPTZ,
      notes          TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_tripwire_op ON tripwire_orders(operation_id)`.catch(() => null);
  await sql`CREATE INDEX IF NOT EXISTS idx_tripwire_status ON tripwire_orders(status)`.catch(() => null);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sql  = neon(process.env.DATABASE_URL!);

    await ensureTable(sql);

    if (!TOCHKA_JWT) {
      console.error("[tripwire] TOCHKA_JWT not set");
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    // Создаём запись в БД
    const rows = await sql`
      INSERT INTO tripwire_orders (amount, product_url, product_name, margin)
      VALUES (100, ${data.product_url ?? null}, ${data.product_name ?? null}, ${data.margin ?? null})
      RETURNING id
    `;
    const orderId     = (rows[0] as { id: string }).id;
    const productName = data.product_name ? String(data.product_name).slice(0, 60) : "товар из Китая";

    const reqBody = JSON.stringify({
      Data: {
        customerCode: TOCHKA_CUSTOMER_CODE,
        amount:       100.0,
        purpose:      `3 фабрики за 100₽ — ${productName}`,
        paymentMode:  ["sbp", "card", "tinkoff"],
        redirectUrl:  `${process.env.NEXT_PUBLIC_URL ?? "https://chinabridge.pro"}/thank-you?order=${orderId}`,
        failRedirectUrl: `${process.env.NEXT_PUBLIC_URL ?? "https://chinabridge.pro"}/ai-calculator`,
        callbackUrl:  "https://chinabridge.pro/api/payments/tochka-webhook",
        paymentLinkId: `tw-${orderId.slice(0, 8)}`,
        ttl:          4320,
      },
    });

    const tochkaResp = await new Promise<{ ok: boolean; body: string }>((resolve, reject) => {
      const r = https.request(
        {
          hostname: "enter.tochka.com",
          port: 443,
          path: "/uapi/acquiring/v1.0/payments",
          method: "POST",
          agent: tochkaAgent,
          headers: {
            Authorization:  `Bearer ${TOCHKA_JWT}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(reqBody),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (c: Buffer) => { body += c.toString(); });
          res.on("end", () => resolve({ ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300, body }));
        }
      );
      r.setTimeout(15000, () => { r.destroy(new Error("timeout")); });
      r.on("error", reject);
      r.write(reqBody);
      r.end();
    });

    if (!tochkaResp.ok) {
      console.error("[tripwire] Tochka error:", tochkaResp.body);
      return NextResponse.json({ error: "payment_failed" }, { status: 502 });
    }

    const resp       = JSON.parse(tochkaResp.body) as { Data?: { operationId?: string; paymentLink?: string } };
    const operationId = resp.Data?.operationId;
    const paymentLink = resp.Data?.paymentLink;

    if (!paymentLink) {
      console.error("[tripwire] no paymentLink:", JSON.stringify(resp));
      return NextResponse.json({ error: "no_link" }, { status: 502 });
    }

    await sql`
      UPDATE tripwire_orders SET operation_id = ${operationId ?? null} WHERE id = ${orderId}
    `.catch(() => null);

    return NextResponse.json({ payment_url: paymentLink, order_id: orderId });
  } catch (e) {
    console.error("[tripwire]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
