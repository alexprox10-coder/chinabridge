import { NextResponse } from "next/server";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const resp = await fetch("https://enter.tochka.com/uapi/acquiring/v1.0/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOCHKA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Data: {
          customerCode: TOCHKA_CUSTOMER_CODE,
          amount: 2000.0,
          purpose: "Аудит партии из Китая — ChinaBridge",
          paymentMode: ["sbp", "card", "tinkoff"],
          redirectUrl: "https://chinabridge.pro/audit-success",
          callbackUrl: "https://chinabridge.pro/api/payments/tochka-webhook",
        },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[create-tripwire] Tochka error:", resp.status, txt);
      return NextResponse.json({ error: "payment_failed" }, { status: 502 });
    }

    const data = await resp.json() as { Data?: { operationId?: string; paymentLink?: string } };
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
