import type { PricingRule } from '../types';

type SeedRule = Omit<PricingRule, 'id'>;

export const SEED_PRICING_RULES: SeedRule[] = [
  {
    name: 'Small Order',
    rule_type: 'markup',
    value: 35,
    min_weight: 0,
    max_weight: 100,
    customer_type: 'B2C',
    priority: 1,
    status: 'active',
  },
  {
    name: 'Standard Consolidation',
    rule_type: 'markup',
    value: 25,
    min_weight: 100,
    max_weight: 1000,
    customer_type: 'SMALL_BUSINESS',
    priority: 2,
    status: 'active',
  },
  {
    name: 'B2B Volume',
    rule_type: 'markup',
    value: 18,
    min_weight: 1000,
    max_weight: 999999,
    customer_type: 'BUSINESS',
    priority: 3,
    status: 'active',
  },
  {
    name: 'VIP Client',
    rule_type: 'markup',
    value: 12,
    customer_type: 'VIP',
    priority: 4,
    status: 'active',
  },
];
