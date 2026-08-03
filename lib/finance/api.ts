import type {
  FinanceOrder,
  FinancePayment,
  FinanceExpense,
  FinanceSetting,
  CashFlowEntry,
} from "./types";
import { calcFinancials } from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";

const TABLE = {
  orders:   process.env.N8N_FINANCE_ORDERS_TABLE_ID   ?? "7GcFnGcjaEm0lKWI",
  payments: process.env.N8N_FINANCE_PAYMENTS_TABLE_ID ?? "EbfGzN0n8NznScFf",
  expenses: process.env.N8N_FINANCE_EXPENSES_TABLE_ID ?? "W2s2SbQIwPvRE5OW",
  settings: process.env.N8N_FINANCE_SETTINGS_TABLE_ID ?? "loSjH2oNyMycj913",
  cashflow: process.env.N8N_FINANCE_CASHFLOW_TABLE_ID ?? "iAfFPFWpPeSqByy3",
};

const headers = () => ({
  "X-N8N-API-KEY": N8N_KEY,
  "Content-Type": "application/json",
});

async function dtQuery<T>(tableId: string): Promise<T[]> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const rows: T[] = data?.data?.rows ?? data?.data ?? data?.rows ?? [];
  return rows;
}

async function dtInsert<T>(tableId: string, fields: Omit<T, "id">): Promise<T | null> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.data ?? data ?? null;
}

async function dtPatch<T>(tableId: string, rowId: number, fields: Partial<T>): Promise<boolean> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows/${rowId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  return res.ok;
}

// ── Finance Orders ────────────────────────────────────────────────────────────

export async function getAllFinanceOrders(): Promise<FinanceOrder[]> {
  return dtQuery<FinanceOrder>(TABLE.orders);
}

export async function getFinanceOrderByLead(leadId: string): Promise<FinanceOrder | null> {
  const all = await getAllFinanceOrders();
  return all.find((o) => o.lead_id === leadId) ?? null;
}

export async function getFinanceOrderById(id: number): Promise<FinanceOrder | null> {
  const all = await getAllFinanceOrders();
  return all.find((o) => o.id === id) ?? null;
}

export async function createFinanceOrder(
  fields: Omit<FinanceOrder, "id" | "total_cost" | "gross_profit" | "net_profit" | "margin_percent" | "created_at" | "updated_at">
): Promise<FinanceOrder | null> {
  const computed = calcFinancials(fields);
  const now = new Date().toISOString();
  return dtInsert<FinanceOrder>(TABLE.orders, {
    ...fields,
    ...computed,
    created_at: now,
    updated_at: now,
  });
}

export async function updateFinanceOrder(id: number, fields: Partial<FinanceOrder>): Promise<boolean> {
  const current = await getFinanceOrderById(id);
  if (!current) return false;
  const merged = { ...current, ...fields };
  const computed = calcFinancials(merged);
  return dtPatch<FinanceOrder>(TABLE.orders, id, {
    ...fields,
    ...computed,
    updated_at: new Date().toISOString(),
  });
}

// ── Finance Payments ──────────────────────────────────────────────────────────

export async function getAllPayments(): Promise<FinancePayment[]> {
  return dtQuery<FinancePayment>(TABLE.payments);
}

export async function getPaymentsByLead(leadId: string): Promise<FinancePayment[]> {
  const all = await getAllPayments();
  return all.filter((p) => p.lead_id === leadId);
}

export async function createPayment(
  fields: Omit<FinancePayment, "id" | "created_at">
): Promise<FinancePayment | null> {
  return dtInsert<FinancePayment>(TABLE.payments, {
    ...fields,
    created_at: new Date().toISOString(),
  });
}

export async function updatePayment(id: number, fields: Partial<FinancePayment>): Promise<boolean> {
  return dtPatch<FinancePayment>(TABLE.payments, id, fields);
}

// ── Finance Expenses ──────────────────────────────────────────────────────────

export async function getAllExpenses(): Promise<FinanceExpense[]> {
  return dtQuery<FinanceExpense>(TABLE.expenses);
}

export async function getExpensesByLead(leadId: string): Promise<FinanceExpense[]> {
  const all = await getAllExpenses();
  return all.filter((e) => e.lead_id === leadId);
}

export async function createExpense(
  fields: Omit<FinanceExpense, "id" | "created_at">
): Promise<FinanceExpense | null> {
  return dtInsert<FinanceExpense>(TABLE.expenses, {
    ...fields,
    created_at: new Date().toISOString(),
  });
}

export async function updateExpense(id: number, fields: Partial<FinanceExpense>): Promise<boolean> {
  return dtPatch<FinanceExpense>(TABLE.expenses, id, fields);
}

// ── Finance Settings ──────────────────────────────────────────────────────────

export async function getFinanceSettings(): Promise<FinanceSetting[]> {
  return dtQuery<FinanceSetting>(TABLE.settings);
}

export async function getSettingValue(key: string, fallback = "1"): Promise<string> {
  const all = await getFinanceSettings();
  return all.find((s) => s.key === key)?.value ?? fallback;
}

export async function updateSetting(id: number, value: string): Promise<boolean> {
  return dtPatch<FinanceSetting>(TABLE.settings, id, {
    value,
    updated_at: new Date().toISOString(),
  });
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

export async function getAllCashFlow(): Promise<CashFlowEntry[]> {
  return dtQuery<CashFlowEntry>(TABLE.cashflow);
}

export async function getCashFlowByLead(leadId: string): Promise<CashFlowEntry[]> {
  const all = await getAllCashFlow();
  return all.filter((e) => e.lead_id === leadId);
}

export async function createCashFlowEntry(
  fields: Omit<CashFlowEntry, "id" | "created_at">
): Promise<CashFlowEntry | null> {
  return dtInsert<CashFlowEntry>(TABLE.cashflow, {
    ...fields,
    created_at: new Date().toISOString(),
  });
}

// ── Reports / Analytics ───────────────────────────────────────────────────────

export interface FinanceReport {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_margin: number;
  order_count: number;
  paid_count: number;
  pending_payments: number;
  by_manager: Record<string, { revenue: number; profit: number; count: number }>;
  by_month: Record<string, { revenue: number; profit: number; count: number }>;
  top_clients: Array<{ client: string; revenue: number; profit: number }>;
  cashflow_balance: Record<string, number>;
}

export async function getFinanceReport(): Promise<FinanceReport> {
  const [orders, payments, cashflow] = await Promise.all([
    getAllFinanceOrders(),
    getAllPayments(),
    getAllCashFlow(),
  ]);

  const total_revenue = orders.reduce((s, o) => s + (o.client_price ?? 0), 0);
  const total_cost    = orders.reduce((s, o) => s + (o.total_cost ?? 0), 0);
  const total_profit  = orders.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
  const avg_margin    = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length * 100) / 100
    : 0;

  const paid_count = payments.filter((p) => p.status === "paid").length;
  const pending_payments = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  // By manager
  const by_manager: FinanceReport["by_manager"] = {};
  for (const o of orders) {
    const m = o.manager || "Без менеджера";
    if (!by_manager[m]) by_manager[m] = { revenue: 0, profit: 0, count: 0 };
    by_manager[m].revenue += o.client_price ?? 0;
    by_manager[m].profit  += o.gross_profit ?? 0;
    by_manager[m].count   += 1;
  }

  // By month
  const by_month: FinanceReport["by_month"] = {};
  for (const o of orders) {
    const month = (o.created_at ?? "").slice(0, 7);
    if (!month) continue;
    if (!by_month[month]) by_month[month] = { revenue: 0, profit: 0, count: 0 };
    by_month[month].revenue += o.client_price ?? 0;
    by_month[month].profit  += o.gross_profit ?? 0;
    by_month[month].count   += 1;
  }

  // Top clients
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

  // Cash flow balance by account
  const cashflow_balance: Record<string, number> = {};
  for (const e of cashflow) {
    const acc = e.account ?? "other";
    if (!cashflow_balance[acc]) cashflow_balance[acc] = 0;
    cashflow_balance[acc] += e.type === "income" ? (e.amount ?? 0) : -(e.amount ?? 0);
  }

  return {
    total_revenue,
    total_cost,
    total_profit,
    avg_margin,
    order_count: orders.length,
    paid_count,
    pending_payments,
    by_manager,
    by_month,
    top_clients,
    cashflow_balance,
  };
}
