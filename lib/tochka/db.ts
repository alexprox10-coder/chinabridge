import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function ensurePaymentsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS tochka_payments (
      id           SERIAL PRIMARY KEY,
      operation_id TEXT    UNIQUE NOT NULL,
      tenant_id    TEXT    NOT NULL,
      plan         TEXT    NOT NULL,
      amount       INTEGER NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'CREATED',
      payment_link TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function savePayment(p: {
  operationId: string;
  tenantId: string;
  plan: string;
  amount: number;
  paymentLink: string;
}) {
  await ensurePaymentsTable();
  await sql`
    INSERT INTO tochka_payments (operation_id, tenant_id, plan, amount, payment_link)
    VALUES (${p.operationId}, ${p.tenantId}, ${p.plan}, ${p.amount}, ${p.paymentLink})
    ON CONFLICT (operation_id) DO NOTHING
  `;
}

export async function getPaymentByOperation(operationId: string) {
  await ensurePaymentsTable();
  const rows = await sql`
    SELECT * FROM tochka_payments WHERE operation_id = ${operationId}
  `;
  return rows[0] ?? null;
}

export async function updatePaymentStatus(operationId: string, status: string) {
  await sql`
    UPDATE tochka_payments
    SET status = ${status}, updated_at = NOW()
    WHERE operation_id = ${operationId}
  `;
}

export async function getPaymentsForTenant(tenantId: string) {
  await ensurePaymentsTable();
  return sql`
    SELECT * FROM tochka_payments
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT 20
  `;
}
