import { getDb } from "../db";
import { financeOrders, financePayments, financeExpenses, financeSettings, cashFlow } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  FinanceOrder, FinancePayment, FinanceExpense, FinanceSetting, CashFlowEntry,
} from "./types";
import { calcFinancials } from "./types";

const TENANT_ID = "tenant-chinabridge";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToOrder(r: typeof financeOrders.$inferSelect): FinanceOrder {
  return {
    id:             r.id,
    lead_id:        r.leadId,
    order_id:       r.orderId,
    client_id:      r.clientId,
    client_name:    r.clientName,
    manager:        r.manager,
    currency:       r.currency as FinanceOrder["currency"],
    goods_cost:     Number(r.goodsCost),
    delivery_cost:  Number(r.deliveryCost),
    services_cost:  Number(r.servicesCost),
    bank_fee:       Number(r.bankFee),
    customs_cost:   Number(r.customsCost),
    other_expenses: Number(r.otherExpenses),
    total_cost:     Number(r.totalCost),
    client_price:   Number(r.clientPrice),
    gross_profit:   Number(r.grossProfit),
    net_profit:     Number(r.netProfit),
    margin_percent: Number(r.marginPercent),
    notes:          r.notes,
    status:         r.status,
    created_at:     r.createdAt,
    updated_at:     r.updatedAt,
  };
}

function rowToPayment(r: typeof financePayments.$inferSelect): FinancePayment {
  return {
    id:               r.id,
    payment_id:       r.paymentId,
    lead_id:          r.leadId,
    order_id:         r.orderId,
    finance_order_id: r.financeOrderId,
    client_name:      r.clientName,
    type:             r.type as FinancePayment["type"],
    amount:           Number(r.amount),
    currency:         r.currency as FinancePayment["currency"],
    payment_date:     r.paymentDate,
    payment_method:   r.paymentMethod,
    status:           r.status as FinancePayment["status"],
    comment:          r.comment,
    created_at:       r.createdAt,
  };
}

function rowToExpense(r: typeof financeExpenses.$inferSelect): FinanceExpense {
  return {
    id:               r.id,
    expense_id:       r.expenseId,
    lead_id:          r.leadId,
    order_id:         r.orderId,
    finance_order_id: r.financeOrderId,
    category:         r.category,
    amount:           Number(r.amount),
    currency:         r.currency as FinanceExpense["currency"],
    expense_date:     r.expenseDate,
    description:      r.description,
    receipt_url:      r.receiptUrl,
    created_at:       r.createdAt,
  };
}

function rowToSetting(r: typeof financeSettings.$inferSelect): FinanceSetting {
  return {
    id:         r.id,
    key:        r.key,
    value:      r.value,
    label:      r.label,
    updated_at: r.updatedAt,
  };
}

function rowToCashFlow(r: typeof cashFlow.$inferSelect): CashFlowEntry {
  return {
    id:               r.id,
    cashflow_id:      r.cashflowId,
    type:             r.type as CashFlowEntry["type"],
    category:         r.category,
    amount:           Number(r.amount),
    currency:         r.currency as CashFlowEntry["currency"],
    account:          r.account as CashFlowEntry["account"],
    lead_id:          r.leadId,
    order_id:         r.orderId,
    description:      r.description,
    transaction_date: r.transactionDate,
    created_at:       r.createdAt,
  };
}

// ── Finance Orders ────────────────────────────────────────────────────────────

export async function getAllFinanceOrders(): Promise<FinanceOrder[]> {
  const db = getDb();
  const rows = await db.select().from(financeOrders)
    .where(eq(financeOrders.tenantId, TENANT_ID))
    .orderBy(desc(financeOrders.createdAt));
  return rows.map(rowToOrder);
}

export async function getFinanceOrderByLead(leadId: string): Promise<FinanceOrder | null> {
  const db = getDb();
  const rows = await db.select().from(financeOrders)
    .where(and(eq(financeOrders.tenantId, TENANT_ID), eq(financeOrders.leadId, leadId)));
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function getFinanceOrderById(id: number): Promise<FinanceOrder | null> {
  const db = getDb();
  const rows = await db.select().from(financeOrders).where(eq(financeOrders.id, id));
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function createFinanceOrder(
  fields: Omit<FinanceOrder, "id" | "tenant_id" | "total_cost" | "gross_profit" | "net_profit" | "margin_percent" | "created_at" | "updated_at">
): Promise<FinanceOrder | null> {
  const db = getDb();
  const computed = calcFinancials(fields);
  const now = new Date().toISOString();
  const [row] = await db.insert(financeOrders).values({
    tenantId:      TENANT_ID,
    leadId:        fields.lead_id,
    orderId:       fields.order_id,
    clientId:      fields.client_id,
    clientName:    fields.client_name,
    manager:       fields.manager,
    currency:      fields.currency,
    goodsCost:     String(fields.goods_cost),
    deliveryCost:  String(fields.delivery_cost),
    servicesCost:  String(fields.services_cost),
    bankFee:       String(fields.bank_fee),
    customsCost:   String(fields.customs_cost),
    otherExpenses: String(fields.other_expenses),
    totalCost:     String(computed.total_cost),
    clientPrice:   String(fields.client_price),
    grossProfit:   String(computed.gross_profit),
    netProfit:     String(computed.net_profit),
    marginPercent: String(computed.margin_percent),
    notes:         fields.notes,
    status:        fields.status,
    createdAt:     now,
    updatedAt:     now,
  }).returning();
  return row ? rowToOrder(row) : null;
}

export async function updateFinanceOrder(id: number, fields: Partial<FinanceOrder>): Promise<boolean> {
  try {
    const db = getDb();
    const current = await getFinanceOrderById(id);
    if (!current) return false;
    const merged = { ...current, ...fields };
    const computed = calcFinancials(merged);
    await db.update(financeOrders).set({
      ...(fields.status      !== undefined && { status:       fields.status }),
      ...(fields.notes       !== undefined && { notes:        fields.notes }),
      ...(fields.client_name !== undefined && { clientName:   fields.client_name }),
      ...(fields.manager     !== undefined && { manager:      fields.manager }),
      ...(fields.goods_cost  !== undefined && { goodsCost:    String(fields.goods_cost) }),
      ...(fields.delivery_cost !== undefined && { deliveryCost: String(fields.delivery_cost) }),
      ...(fields.services_cost !== undefined && { servicesCost: String(fields.services_cost) }),
      ...(fields.bank_fee    !== undefined && { bankFee:      String(fields.bank_fee) }),
      ...(fields.customs_cost !== undefined && { customsCost: String(fields.customs_cost) }),
      ...(fields.other_expenses !== undefined && { otherExpenses: String(fields.other_expenses) }),
      ...(fields.client_price !== undefined && { clientPrice: String(fields.client_price) }),
      totalCost:     String(computed.total_cost),
      grossProfit:   String(computed.gross_profit),
      netProfit:     String(computed.net_profit),
      marginPercent: String(computed.margin_percent),
      updatedAt:     new Date().toISOString(),
    }).where(eq(financeOrders.id, id));
    return true;
  } catch { return false; }
}

// ── Finance Payments ──────────────────────────────────────────────────────────

export async function getAllPayments(): Promise<FinancePayment[]> {
  const db = getDb();
  const rows = await db.select().from(financePayments)
    .where(eq(financePayments.tenantId, TENANT_ID))
    .orderBy(desc(financePayments.createdAt));
  return rows.map(rowToPayment);
}

export async function getPaymentsByLead(leadId: string): Promise<FinancePayment[]> {
  const db = getDb();
  const rows = await db.select().from(financePayments)
    .where(and(eq(financePayments.tenantId, TENANT_ID), eq(financePayments.leadId, leadId)));
  return rows.map(rowToPayment);
}

export async function createPayment(
  fields: Omit<FinancePayment, "id" | "created_at">
): Promise<FinancePayment | null> {
  const db = getDb();
  const [row] = await db.insert(financePayments).values({
    tenantId:       TENANT_ID,
    paymentId:      fields.payment_id,
    leadId:         fields.lead_id,
    orderId:        fields.order_id,
    financeOrderId: fields.finance_order_id,
    clientName:     fields.client_name,
    type:           fields.type,
    amount:         String(fields.amount),
    currency:       fields.currency,
    paymentDate:    fields.payment_date,
    paymentMethod:  fields.payment_method,
    status:         fields.status,
    comment:        fields.comment,
    createdAt:      new Date().toISOString(),
  }).returning();
  return row ? rowToPayment(row) : null;
}

export async function updatePayment(id: number, fields: Partial<FinancePayment>): Promise<boolean> {
  try {
    const db = getDb();
    await db.update(financePayments).set({
      ...(fields.status        !== undefined && { status:       fields.status }),
      ...(fields.comment       !== undefined && { comment:      fields.comment }),
      ...(fields.amount        !== undefined && { amount:       String(fields.amount) }),
      ...(fields.payment_date  !== undefined && { paymentDate:  fields.payment_date }),
      ...(fields.payment_method !== undefined && { paymentMethod: fields.payment_method }),
    }).where(eq(financePayments.id, id));
    return true;
  } catch { return false; }
}

// ── Finance Expenses ──────────────────────────────────────────────────────────

export async function getAllExpenses(): Promise<FinanceExpense[]> {
  const db = getDb();
  const rows = await db.select().from(financeExpenses)
    .where(eq(financeExpenses.tenantId, TENANT_ID))
    .orderBy(desc(financeExpenses.createdAt));
  return rows.map(rowToExpense);
}

export async function getExpensesByLead(leadId: string): Promise<FinanceExpense[]> {
  const db = getDb();
  const rows = await db.select().from(financeExpenses)
    .where(and(eq(financeExpenses.tenantId, TENANT_ID), eq(financeExpenses.leadId, leadId)));
  return rows.map(rowToExpense);
}

export async function createExpense(
  fields: Omit<FinanceExpense, "id" | "created_at">
): Promise<FinanceExpense | null> {
  const db = getDb();
  const [row] = await db.insert(financeExpenses).values({
    tenantId:       TENANT_ID,
    expenseId:      fields.expense_id,
    leadId:         fields.lead_id,
    orderId:        fields.order_id,
    financeOrderId: fields.finance_order_id,
    category:       fields.category,
    amount:         String(fields.amount),
    currency:       fields.currency,
    expenseDate:    fields.expense_date,
    description:    fields.description,
    receiptUrl:     fields.receipt_url,
    createdAt:      new Date().toISOString(),
  }).returning();
  return row ? rowToExpense(row) : null;
}

export async function updateExpense(id: number, fields: Partial<FinanceExpense>): Promise<boolean> {
  try {
    const db = getDb();
    await db.update(financeExpenses).set({
      ...(fields.category    !== undefined && { category:    fields.category }),
      ...(fields.amount      !== undefined && { amount:      String(fields.amount) }),
      ...(fields.description !== undefined && { description: fields.description }),
    }).where(eq(financeExpenses.id, id));
    return true;
  } catch { return false; }
}

// ── Finance Settings ──────────────────────────────────────────────────────────

export async function getFinanceSettings(): Promise<FinanceSetting[]> {
  const db = getDb();
  const rows = await db.select().from(financeSettings)
    .where(eq(financeSettings.tenantId, TENANT_ID));
  return rows.map(rowToSetting);
}

export async function getSettingValue(key: string, fallback = "1"): Promise<string> {
  const all = await getFinanceSettings();
  return all.find((s) => s.key === key)?.value ?? fallback;
}

export async function updateSetting(id: number, value: string): Promise<boolean> {
  try {
    const db = getDb();
    await db.update(financeSettings).set({ value, updatedAt: new Date().toISOString() })
      .where(eq(financeSettings.id, id));
    return true;
  } catch { return false; }
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

export async function getAllCashFlow(): Promise<CashFlowEntry[]> {
  const db = getDb();
  const rows = await db.select().from(cashFlow)
    .where(eq(cashFlow.tenantId, TENANT_ID))
    .orderBy(desc(cashFlow.createdAt));
  return rows.map(rowToCashFlow);
}

export async function getCashFlowByLead(leadId: string): Promise<CashFlowEntry[]> {
  const db = getDb();
  const rows = await db.select().from(cashFlow)
    .where(and(eq(cashFlow.tenantId, TENANT_ID), eq(cashFlow.leadId, leadId)));
  return rows.map(rowToCashFlow);
}

export async function createCashFlowEntry(
  fields: Omit<CashFlowEntry, "id" | "created_at">
): Promise<CashFlowEntry | null> {
  const db = getDb();
  const [row] = await db.insert(cashFlow).values({
    tenantId:        TENANT_ID,
    cashflowId:      fields.cashflow_id,
    type:            fields.type,
    category:        fields.category,
    amount:          String(fields.amount),
    currency:        fields.currency,
    account:         fields.account,
    leadId:          fields.lead_id,
    orderId:         fields.order_id,
    description:     fields.description,
    transactionDate: fields.transaction_date,
    createdAt:       new Date().toISOString(),
  }).returning();
  return row ? rowToCashFlow(row) : null;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface FinanceReport {
  total_revenue:     number;
  total_cost:        number;
  total_profit:      number;
  avg_margin:        number;
  order_count:       number;
  paid_count:        number;
  pending_payments:  number;
  by_manager:        Record<string, { revenue: number; profit: number; count: number }>;
  by_month:          Record<string, { revenue: number; profit: number; count: number }>;
  top_clients:       Array<{ client: string; revenue: number; profit: number }>;
  cashflow_balance:  Record<string, number>;
}

export async function getFinanceReport(): Promise<FinanceReport> {
  const [orders, payments, cf] = await Promise.all([
    getAllFinanceOrders(),
    getAllPayments(),
    getAllCashFlow(),
  ]);

  const total_revenue    = orders.reduce((s, o) => s + (o.client_price ?? 0), 0);
  const total_cost       = orders.reduce((s, o) => s + (o.total_cost   ?? 0), 0);
  const total_profit     = orders.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
  const avg_margin       = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length * 100) / 100
    : 0;
  const paid_count       = payments.filter((p) => p.status === "paid").length;
  const pending_payments = payments.filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const by_manager: FinanceReport["by_manager"] = {};
  for (const o of orders) {
    const m = o.manager || "Без менеджера";
    if (!by_manager[m]) by_manager[m] = { revenue: 0, profit: 0, count: 0 };
    by_manager[m].revenue += o.client_price ?? 0;
    by_manager[m].profit  += o.gross_profit ?? 0;
    by_manager[m].count   += 1;
  }

  const by_month: FinanceReport["by_month"] = {};
  for (const o of orders) {
    const month = (o.created_at ?? "").slice(0, 7);
    if (!month) continue;
    if (!by_month[month]) by_month[month] = { revenue: 0, profit: 0, count: 0 };
    by_month[month].revenue += o.client_price ?? 0;
    by_month[month].profit  += o.gross_profit ?? 0;
    by_month[month].count   += 1;
  }

  const clientMap: Record<string, { revenue: number; profit: number }> = {};
  for (const o of orders) {
    const c = o.client_name || o.client_id || "Неизвестно";
    if (!clientMap[c]) clientMap[c] = { revenue: 0, profit: 0 };
    clientMap[c].revenue += o.client_price ?? 0;
    clientMap[c].profit  += o.gross_profit ?? 0;
  }
  const top_clients = Object.entries(clientMap)
    .map(([client, v]) => ({ client, ...v }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const cashflow_balance: Record<string, number> = {};
  for (const e of cf) {
    const acc = e.account ?? "other";
    if (!cashflow_balance[acc]) cashflow_balance[acc] = 0;
    cashflow_balance[acc] += e.type === "income" ? (e.amount ?? 0) : -(e.amount ?? 0);
  }

  return { total_revenue, total_cost, total_profit, avg_margin, order_count: orders.length,
    paid_count, pending_payments, by_manager, by_month, top_clients, cashflow_balance };
}
