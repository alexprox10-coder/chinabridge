import type { Route } from '../types';

export interface SeedRoute extends Omit<Route, 'id' | 'created_at'> {
  key: string;
}

export const SEED_ROUTES: SeedRoute[] = [
  // ── China → Kazakhstan ──────────────────────────────────────────
  {
    key: 'yiwu_almaty_truck',
    country_from: 'China', city_from: 'Yiwu',
    country_to: 'Kazakhstan', city_to: 'Almaty',
    transport_type: 'truck', delivery_days_min: 18, delivery_days_max: 25, status: 'active',
  },
  {
    key: 'guangzhou_almaty_truck',
    country_from: 'China', city_from: 'Guangzhou',
    country_to: 'Kazakhstan', city_to: 'Almaty',
    transport_type: 'truck', delivery_days_min: 20, delivery_days_max: 30, status: 'active',
  },
  {
    key: 'shenzhen_almaty_truck',
    country_from: 'China', city_from: 'Shenzhen',
    country_to: 'Kazakhstan', city_to: 'Almaty',
    transport_type: 'truck', delivery_days_min: 20, delivery_days_max: 30, status: 'active',
  },
  {
    key: 'beijing_astana_truck',
    country_from: 'China', city_from: 'Beijing',
    country_to: 'Kazakhstan', city_to: 'Astana',
    transport_type: 'truck', delivery_days_min: 20, delivery_days_max: 35, status: 'active',
  },
  // ── China → Russia ───────────────────────────────────────────────
  {
    key: 'yiwu_moscow_truck',
    country_from: 'China', city_from: 'Yiwu',
    country_to: 'Russia', city_to: 'Moscow',
    transport_type: 'truck', delivery_days_min: 25, delivery_days_max: 35, status: 'active',
  },
  {
    key: 'guangzhou_moscow_truck',
    country_from: 'China', city_from: 'Guangzhou',
    country_to: 'Russia', city_to: 'Moscow',
    transport_type: 'truck', delivery_days_min: 30, delivery_days_max: 40, status: 'active',
  },
  {
    key: 'shenzhen_moscow_truck',
    country_from: 'China', city_from: 'Shenzhen',
    country_to: 'Russia', city_to: 'Moscow',
    transport_type: 'truck', delivery_days_min: 30, delivery_days_max: 40, status: 'active',
  },
  {
    key: 'heihe_blagoveshchensk_truck',
    country_from: 'China', city_from: 'Heihe',
    country_to: 'Russia', city_to: 'Blagoveshchensk',
    transport_type: 'truck', delivery_days_min: 3, delivery_days_max: 7, status: 'active',
  },
];
