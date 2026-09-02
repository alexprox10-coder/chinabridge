import { NextResponse } from "next/server";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import https from "node:https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tochka Bank uses Минцифры CA not trusted by Node.js — skip cert check for this endpoint only
const tochkaAgent = new https.Agent({ rejectUnauthorized: false });

const TOCHKA_JWT           = process.env.TOCHKA_JWT ?? "";
const TOCHKA_CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE ?? "305892710";

async function ensureColumns(sql: NeonQueryFunction<false, false>) {
  await sql`ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS chat_id TEXT`.catch(() => null);
  await sql`ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS tochka_operation_id TEXT`.catch(() => null);
}

export async function POST(req: Request) {
  try {
    const { lead_id, chat_id } = await req.json() as { lead_id?: string; chat_id?: string };
    const sql = neon(process.env.DATABASE_URL!);
    await ensureColumns(sql);

    if (!TOCHKA_JWT) {
      console.error("[create-tripwire] TOCHKA_JWT not set");
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    const reqBody = JSON.stringify({
      Data: {
        customerCode: TOCHKA_CUSTOMER_CODE,
        amount: 2000.0,
        purpose: "Аудит партии из Китая — ChinaBridge",
        paymentMode: ["sbp", "card", "tinkoff"],
        redirectUrl: "https://chinabridge.pro/audit-success",
        callbackUrl: "https://chinabridge.pro/api/payments/tochka-webhook",
      },
    });

    const tochkaResp = await new Promise<{ ok: boolean; body: string }>((resolve, reject) => {
      const req = https.request(
        {
          hostname: "enter.tochka.com",
          port: 443,
          path: "/uapi/acquiring/v1.0/payments",
          method: "POST",
          agent: tochkaAgent,
          headers: {
            Authorization: `Bearer ${TOCHKA_JWT}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(reqBody),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (c: Buffer) => { data += c.toString(); });
          res.on("end", () => resolve({ ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300, body: data }));
        }
      );
      req.setTimeout(15000, () => { req.destroy(new Error("tochka_timeout")); });
      req.on("error", reject);
      req.write(reqBody);
      req.end();
    });

    if (!tochkaResp.ok) {
      console.error("[create-tripwire] Tochka error:", tochkaResp.body);
      return NextResponse.json({ error: "payment_failed" }, { status: 502 });
    }

    const data = JSON.parse(tochkaResp.body) as { Data?: { operationId?: string; paymentLink?: string } };
    const operationId = data.Data?.operationId;
    const paymentLink = data.Data?.paymentLink;

    if (!paymentLink) {
      console.error("[create-tripwire] no paymentLink in response:", JSON.stringify(data));
      return NextResponse.json({ error: "no_link" }, { status: 502 });
    }

    if (lead_id) {
      await sql`
        UPDATE calculator_leads
        SET tochka_operation_id = ${operationId ?? null},
            chat_id = ${chat_id ?? null}
        WHERE id = ${lead_id}::uuid
      `.catch((e) => console.error("[create-tripwire] db update error:", e));
    }

    return NextResponse.json({ success: true, paymentLink, operationId });
  } catch (e) {
    console.error("[create-tripwire]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
