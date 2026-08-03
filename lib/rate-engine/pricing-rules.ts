import type { PricingRule } from './types';
import { listRows, createRow, updateRow, deleteRow, TABLE_IDS } from './db';

export async function getPricingRules(): Promise<PricingRule[]> {
  return listRows<PricingRule>(TABLE_IDS.pricing_rules);
}

export async function createPricingRule(
  data: Omit<PricingRule, 'id'>,
): Promise<PricingRule> {
  return createRow<PricingRule>(TABLE_IDS.pricing_rules, data as Record<string, unknown>);
}

export async function updatePricingRule(
  id: number,
  data: Partial<PricingRule>,
): Promise<PricingRule> {
  return updateRow<PricingRule>(TABLE_IDS.pricing_rules, id, data as Record<string, unknown>);
}

export async function deletePricingRule(id: number): Promise<void> {
  return deleteRow(TABLE_IDS.pricing_rules, id);
}

export function applyMargin(cost: number, marginPercent: number): number {
  return Math.round(cost * (1 + marginPercent / 100) * 100) / 100;
}

export function applyDiscount(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}
