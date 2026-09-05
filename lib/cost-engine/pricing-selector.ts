import type { PricingRule } from '@/lib/rate-engine/types';
import { listRows, TABLE_IDS } from '@/lib/rate-engine/db';
import type { PricingSelectorInput, PricingSelection } from './types';

const DEFAULT_MARKUP = 20;

function ruleMatchesInput(rule: PricingRule, input: PricingSelectorInput): boolean {
  // VIP override — weight range ignored for VIP rules
  if (rule.customer_type === 'VIP') {
    return input.customer_type === 'VIP';
  }

  // Customer type filter
  if (rule.customer_type && input.customer_type && rule.customer_type !== input.customer_type) {
    return false;
  }

  // Weight range filter
  const w = input.weight ?? 0;
  if (rule.min_weight !== undefined && rule.min_weight !== null && w < rule.min_weight) return false;
  if (rule.max_weight !== undefined && rule.max_weight !== null && w >= rule.max_weight) return false;

  // Transport type filter
  if (rule.transport_type && input.transport_type && rule.transport_type !== input.transport_type) {
    return false;
  }

  // Cargo type filter
  if (rule.cargo_type && input.cargo_type && rule.cargo_type !== input.cargo_type) {
    return false;
  }

  return true;
}

function buildReason(rule: PricingRule, input: PricingSelectorInput): string {
  const parts: string[] = [];

  if (rule.customer_type === 'VIP') {
    parts.push('VIP клиент');
  } else if (input.weight !== undefined) {
    const w = input.weight;
    if (rule.max_weight) {
      parts.push(`Вес ${w} кг: до ${rule.max_weight} кг`);
    } else if (rule.min_weight) {
      parts.push(`Вес ${w} кг: от ${rule.min_weight} кг`);
    }
  }

  if (rule.transport_type) parts.push(`транспорт: ${rule.transport_type}`);
  if (rule.cargo_type) parts.push(`груз: ${rule.cargo_type}`);

  return parts.length > 0 ? parts.join(', ') : `Применено правило: ${rule.name}`;
}

export async function selectPricingRule(input: PricingSelectorInput, preloadedRules?: PricingRule[]): Promise<PricingSelection> {
  const allRules = preloadedRules ?? await listRows<PricingRule>(TABLE_IDS.pricing_rules);

  // Only active rules participate in selection
  const active = allRules.filter(r => r.status === 'active');

  // VIP check first — highest priority regardless of weight
  if (input.customer_type === 'VIP') {
    const vipRule = active
      .filter(r => r.customer_type === 'VIP')
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];

    if (vipRule) {
      return {
        selected_rule: vipRule,
        markup_percent: vipRule.value,
        reason: buildReason(vipRule, input),
      };
    }
  }

  // Weight-based selection
  const candidates = active
    .filter(r => r.customer_type !== 'VIP')
    .filter(r => ruleMatchesInput(r, input))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  if (candidates.length > 0) {
    const best = candidates[0];
    return {
      selected_rule: best,
      markup_percent: best.value,
      reason: buildReason(best, input),
    };
  }

  // Fallback — no matching rule
  return {
    selected_rule: null,
    markup_percent: DEFAULT_MARKUP,
    reason: 'Нет подходящего правила, применена базовая наценка 20%',
  };
}
