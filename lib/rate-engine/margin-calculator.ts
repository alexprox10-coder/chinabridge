import type { MarginResult } from './types';

export function calculateMargin(sale_price: number, cost_price: number): MarginResult {
  const profit = Math.round((sale_price - cost_price) * 100) / 100;
  const margin_percent =
    sale_price > 0 ? Math.round((profit / sale_price) * 10000) / 100 : 0;

  return { sale_price, cost_price, profit, margin_percent };
}

export function calcSalePriceFromMargin(cost_price: number, target_margin_percent: number): number {
  if (target_margin_percent >= 100) throw new Error('Маржа не может быть 100% или выше');
  return Math.round((cost_price / (1 - target_margin_percent / 100)) * 100) / 100;
}

export function calcSalePriceFromMarkup(cost_price: number, markup_percent: number): number {
  return Math.round(cost_price * (1 + markup_percent / 100) * 100) / 100;
}
