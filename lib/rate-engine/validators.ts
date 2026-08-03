import type { CalculationInput, ShippingRate, Route, AdditionalService, PricingRule } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCalculationInput(input: Partial<CalculationInput>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!input.country_to && !input.city_to) {
    errors.push({ field: 'country_to', message: 'Укажите страну или город назначения' });
  }
  if (input.weight !== undefined && input.weight < 0) {
    errors.push({ field: 'weight', message: 'Вес не может быть отрицательным' });
  }
  if (input.volume !== undefined && input.volume < 0) {
    errors.push({ field: 'volume', message: 'Объём не может быть отрицательным' });
  }
  if (!input.weight && !input.volume && !input.packages) {
    errors.push({ field: 'weight', message: 'Укажите вес, объём или количество мест' });
  }
  return errors;
}

export function validateShippingRate(data: Partial<ShippingRate>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.carrier_name?.trim()) errors.push({ field: 'carrier_name', message: 'Укажите перевозчика' });
  if (!data.transport_type) errors.push({ field: 'transport_type', message: 'Укажите тип транспорта' });
  if (!data.cargo_type) errors.push({ field: 'cargo_type', message: 'Укажите тип груза' });
  if (!data.rate_type) errors.push({ field: 'rate_type', message: 'Укажите тип тарифа' });
  if (!data.price_value || data.price_value <= 0) errors.push({ field: 'price_value', message: 'Укажите цену (> 0)' });
  if (!data.currency) errors.push({ field: 'currency', message: 'Укажите валюту' });
  return errors;
}

export function validateRoute(data: Partial<Route>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.country_from?.trim()) errors.push({ field: 'country_from', message: 'Укажите страну отправления' });
  if (!data.city_from?.trim()) errors.push({ field: 'city_from', message: 'Укажите город отправления' });
  if (!data.country_to?.trim()) errors.push({ field: 'country_to', message: 'Укажите страну назначения' });
  if (!data.city_to?.trim()) errors.push({ field: 'city_to', message: 'Укажите город назначения' });
  if (!data.transport_type) errors.push({ field: 'transport_type', message: 'Укажите тип транспорта' });
  return errors;
}

export function validateService(data: Partial<AdditionalService>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.name?.trim()) errors.push({ field: 'name', message: 'Укажите название услуги' });
  if (!data.price_type) errors.push({ field: 'price_type', message: 'Укажите тип цены' });
  if (data.price_value === undefined || data.price_value < 0) errors.push({ field: 'price_value', message: 'Укажите стоимость' });
  if (!data.currency) errors.push({ field: 'currency', message: 'Укажите валюту' });
  return errors;
}

export function validatePricingRule(data: Partial<PricingRule>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.name?.trim()) errors.push({ field: 'name', message: 'Укажите название правила' });
  if (!data.rule_type) errors.push({ field: 'rule_type', message: 'Укажите тип правила' });
  if (data.value === undefined || data.value < 0) errors.push({ field: 'value', message: 'Укажите значение (%)' });
  if (data.min_weight !== undefined && data.max_weight !== undefined && data.min_weight >= data.max_weight) {
    errors.push({ field: 'max_weight', message: 'Макс. вес должен быть больше мин. веса' });
  }
  if (data.priority !== undefined && (data.priority < 1 || data.priority > 99)) {
    errors.push({ field: 'priority', message: 'Приоритет: 1–99' });
  }
  return errors;
}
