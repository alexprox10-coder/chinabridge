import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getTochkaPaymentStatus } from "@/lib/tochka/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PendingRow = { status: string; telegram_username: string | null };

export async function GET(req: NextRequest) {
  const op = req.nextUrl.searchParams.get("op") ?? "";
  if (!op) return NextResponse.json({ status: "unknown" }, { status: 400 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);
  let dbRow: PendingRow | null = null;

  try {
    const rows = await sql`
      SELECT status, telegram_username
      FROM calc_pending_payments
      WHERE operation_id = ${op}
      LIMIT 1
    ` as PendingRow[];

    if (rows.length > 0) {
      dbRow = rows[0];
      const hasTelegram = !!dbRow.telegram_username;

      if (dbRow.status === "code_sent" || dbRow.status === "verified") {
        return NextResponse.json({ status: "APPROVED", hasTelegram });
      }
    }

    // Poll Tochka for live status
    const tochkaStatus = await getTochkaPaymentStatus(op);

    if (tochkaStatus === "APPROVED") {
      // Re-read — webhook may have just processed it
      const rows2 = await sql`
        SELECT status, telegram_username FROM calc_pending_payments
        WHERE operation_id = ${op} LIMIT 1
      ` as PendingRow[];
      const row2 = rows2[0] ?? dbRow;
      const hasTelegram = !!row2?.telegram_username;
      return NextResponse.json({ status: "APPROVED", hasTelegram });
    }

    return NextResponse.json({ status: tochkaStatus });
  } catch (err) {
    console.error("[calc/payment-status]", err);
    if (dbRow) {
      return NextResponse.json({ status: dbRow.status, hasTelegram: !!dbRow.telegram_username });
    }
    return NextResponse.json({ status: "pending" });
  }
}
