export const CREDIT_PACKAGES = {
  pack_1:  { price: 490,  credits: 1,  label: "1 расчёт",   description: "Разовый расчёт" },
  pack_5:  { price: 1490, credits: 5,  label: "5 расчётов",  description: "Выгоднее на 40%" },
  pack_20: { price: 3990, credits: 20, label: "20 расчётов", description: "Максимальная выгода" },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;

export const FREE_CALCULATIONS = 3;

// 490₽ за 1 кредит → засчитывается в логистику
export const CREDIT_TO_LOGISTICS_AMOUNT_RUB = 490;

export type TransactionType = "free" | "purchase" | "spend" | "refund";
export type CalcSource = "invoice" | "ai_calc";

export interface CreditBalance {
  session_id:  string;
  balance:     number;
  free_used:   number;
  free_left:   number;
  has_access:  boolean; // free_left > 0 || balance > 0
}

export interface ReserveResult {
  ok:             boolean;
  calculation_id: string;
  used_free:      boolean;
  error?:         string; // "no_credits" | "already_reserved"
}
