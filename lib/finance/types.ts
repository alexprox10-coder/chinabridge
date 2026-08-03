export type FinanceCurrency = "USD" | "CNY" | "RUB" | "KZT";

export interface FinanceOrder {
  id?: number;
  lead_id: string;
  order_id: string;
  client_id: string;
  client_name: string;
  manager: string;
  currency: FinanceCurrency;
  goods_cost: number;
  delivery_cost: number;
  services_cost: number;
  bank_fee: number;
  customs_cost: number;
  other_expenses: number;
  total_cost: number;
  client_price: number;
  gross_profit: number;
  net_profit: number;
  margin_percent: number;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FinancePayment {
  id?: number;
  payment_id: string;
  lead_id: string;
  order_id: string;
  finance_order_id: string;
  client_name: string;
  type: "prepayment" | "balance" | "refund" | "adjustment";
  amount: number;
  currency: FinanceCurrency;
  payment_date: string;
  payment_method: string;
  status: "paid" | "pending" | "cancelled";
  comment: string;
  created_at: string;
}

export interface FinanceExpense {
  id?: number;
  expense_id: string;
  lead_id: string;
  order_id: string;
  finance_order_id: string;
  category: string;
  amount: number;
  currency: FinanceCurrency;
  expense_date: string;
  description: string;
  receipt_url: string;
  created_at: string;
}

export interface FinanceSetting {
  id?: number;
  key: string;
  value: string;
  label: string;
  updated_at: string;
}

export interface CashFlowEntry {
  id?: number;
  cashflow_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  currency: FinanceCurrency;
  account: "bank" | "cash" | "china_partner" | "other";
  lead_id: string;
  order_id: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
  "Закупка товара",
  "Доставка",
  "Таможня",
  "Комиссия банка",
  "Перевод денег",
  "Реклама",
  "Зарплата",
  "Прочее",
] as const;

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  prepayment: "Предоплата",
  balance: "Доплата",
  refund: "Возврат",
  adjustment: "Корректировка",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Оплачено",
  pending: "Ожидается",
  cancelled: "Отменено",
};

export const ACCOUNT_LABELS: Record<string, string> = {
  bank: "💰 Расчётный счёт",
  cash: "💵 Наличные",
  china_partner: "🇨🇳 Партнёр в Китае",
  other: "📦 Прочее",
};

export const CURRENCIES: FinanceCurrency[] = ["USD", "CNY", "RUB", "KZT"];

export const CURRENCY_SYMBOLS: Record<FinanceCurrency, string> = {
  USD: "$",
  CNY: "¥",
  RUB: "₽",
  KZT: "₸",
};

export function calcFinancials(fo: Partial<FinanceOrder>): Pick<FinanceOrder, "total_cost" | "gross_profit" | "net_profit" | "margin_percent"> {
  const total_cost =
    (fo.goods_cost ?? 0) +
    (fo.delivery_cost ?? 0) +
    (fo.services_cost ?? 0) +
    (fo.bank_fee ?? 0) +
    (fo.customs_cost ?? 0) +
    (fo.other_expenses ?? 0);

  const gross_profit = (fo.client_price ?? 0) - total_cost;
  const net_profit = gross_profit;
  const margin_percent =
    (fo.client_price ?? 0) > 0
      ? Math.round((gross_profit / (fo.client_price ?? 1)) * 10000) / 100
      : 0;

  return { total_cost, gross_profit, net_profit, margin_percent };
}
