import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import {
  CREATE_SESSIONS_TABLE,
  CREATE_CREDITS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_TRANSACTION_INDEXES,
} from "./migrations";
import type { CreditBalance, ReserveResult, CalcSource, PackageId } from "./types";
import { FREE_CALCULATIONS } from "./types";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

async function ensureTables(sql: ReturnType<typeof neon>): Promise<void> {
  await sql.unsafe(CREATE_SESSIONS_TABLE);
  await sql.unsafe(CREATE_CREDITS_TABLE);
  await sql.unsafe(CREATE_TRANSACTIONS_TABLE);
  await sql.unsafe(CREATE_TRANSACTION_INDEXES);
}

// Upsert session row and return credit balance.
export async function getBalance(session_id: string, ip: string): Promise<CreditBalance> {
  const sql = db();
  await ensureTables(sql);

  // Upsert session
  await sql`
    INSERT INTO calculator_sessions (session_id, ip)
    VALUES (${session_id}, ${ip})
    ON CONFLICT (session_id) DO UPDATE SET last_seen = NOW()
  `;

  // Upsert credits row (ensure row exists)
  await sql`
    INSERT INTO calculator_credits (session_id)
    VALUES (${session_id})
    ON CONFLICT (session_id) DO NOTHING
  `;

  const rows = await sql`
    SELECT balance, free_used FROM calculator_credits WHERE session_id = ${session_id}
  ` as Array<{ balance: number; free_used: number }>;

  const { balance = 0, free_used = 0 } = rows[0] ?? {};
  const free_left = Math.max(0, FREE_CALCULATIONS - free_used);
  return {
    session_id,
    balance,
    free_used,
    free_left,
    has_access: free_left > 0 || balance > 0,
  };
}

// Reserve 1 credit before running the calculation.
// Uses free slot if available, otherwise paid credit.
// Idempotent by calculation_id.
export async function reserve(
  session_id: string,
  ip: string,
  calc_source: CalcSource,
): Promise<ReserveResult> {
  const sql = db();
  await ensureTables(sql);

  const bal = await getBalance(session_id, ip);
  if (!bal.has_access) {
    return { ok: false, calculation_id: "", used_free: false, error: "no_credits" };
  }

  const calculation_id = randomUUID();
  const used_free = bal.free_left > 0;

  if (used_free) {
    // Increment free_used
    await sql`
      UPDATE calculator_credits
      SET free_used = free_used + 1, updated_at = NOW()
      WHERE session_id = ${session_id}
    `;
    await sql`
      INSERT INTO credit_transactions (session_id, type, amount, calculation_id, calc_source)
      VALUES (${session_id}, 'free', -1, ${calculation_id}, ${calc_source})
    `;
  } else {
    // Decrement paid balance
    const updated = await sql`
      UPDATE calculator_credits
      SET balance = balance - 1, updated_at = NOW()
      WHERE session_id = ${session_id} AND balance > 0
      RETURNING balance
    ` as Array<{ balance: number }>;

    if (!updated.length) {
      return { ok: false, calculation_id: "", used_free: false, error: "no_credits" };
    }
    await sql`
      INSERT INTO credit_transactions (session_id, type, amount, calculation_id, calc_source)
      VALUES (${session_id}, 'spend', -1, ${calculation_id}, ${calc_source})
    `;
  }

  return { ok: true, calculation_id, used_free };
}

// Refund 1 credit if calculation failed after reserve().
export async function refund(
  session_id: string,
  calculation_id: string,
  used_free: boolean,
): Promise<void> {
  const sql = db();

  // Check if already refunded
  const existing = await sql`
    SELECT id FROM credit_transactions
    WHERE calculation_id = ${calculation_id} AND type = 'refund'
  ` as Array<{ id: number }>;
  if (existing.length) return;

  if (used_free) {
    await sql`
      UPDATE calculator_credits
      SET free_used = GREATEST(0, free_used - 1), updated_at = NOW()
      WHERE session_id = ${session_id}
    `;
  } else {
    await sql`
      UPDATE calculator_credits
      SET balance = balance + 1, updated_at = NOW()
      WHERE session_id = ${session_id}
    `;
  }

  await sql`
    INSERT INTO credit_transactions (session_id, type, amount, calculation_id)
    VALUES (${session_id}, 'refund', 1, ${calculation_id})
  `;
}

// Add purchased credits after successful Tochka webhook.
// Idempotent by operation_id.
export async function addCredits(
  session_id: string,
  credits: number,
  operation_id: string,
  package_id: PackageId,
): Promise<{ ok: boolean; already_processed: boolean }> {
  const sql = db();
  await ensureTables(sql);

  // Idempotency check
  const existing = await sql`
    SELECT id FROM credit_transactions
    WHERE operation_id = ${operation_id} AND type = 'purchase'
  ` as Array<{ id: number }>;
  if (existing.length) return { ok: true, already_processed: true };

  // Ensure session row exists (may be called from webhook before user visits)
  await sql`
    INSERT INTO calculator_sessions (session_id, ip)
    VALUES (${session_id}, 'webhook')
    ON CONFLICT (session_id) DO NOTHING
  `;
  await sql`
    INSERT INTO calculator_credits (session_id)
    VALUES (${session_id})
    ON CONFLICT (session_id) DO NOTHING
  `;

  await sql`
    UPDATE calculator_credits
    SET balance = balance + ${credits}, updated_at = NOW()
    WHERE session_id = ${session_id}
  `;

  await sql`
    INSERT INTO credit_transactions (session_id, type, amount, operation_id, package_id)
    VALUES (${session_id}, 'purchase', ${credits}, ${operation_id}, ${package_id})
  `;

  return { ok: true, already_processed: false };
}
