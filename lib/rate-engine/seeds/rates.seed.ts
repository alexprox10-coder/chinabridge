import type { ShippingRate } from '../types';

type SeedRate = Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>;

// route_id injected by seed-runner after routes are created
export function getSeedRates(routeMap: Record<string, number>): SeedRate[] {
  const M = 'MARKET' as const;

  const truckBase = {
    transport_type: 'truck' as const,
    cargo_type: 'general' as const,
    rate_type: 'KG' as const,
    currency: 'USD' as const,
    rate_source: M,
    status: 'active' as const,
  };

  return [
    // ── Yiwu → Almaty (truck) — 4 weight tiers ──────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 0, max_weight: 100,
      price_value: 5.5,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 100, max_weight: 300,
      price_value: 4.5,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 300, max_weight: 1000,
      price_value: 3.8,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 1000, max_weight: 0,
      price_value: 3.3,
      delivery_days_min: 18, delivery_days_max: 25,
    },

    // ── Guangzhou → Almaty (truck) — 2 tiers ─────────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Guangzhou → Almaty',
      route_id: String(routeMap['guangzhou_almaty_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 4.8,
      delivery_days_min: 20, delivery_days_max: 30,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Guangzhou → Almaty',
      route_id: String(routeMap['guangzhou_almaty_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 4.0,
      delivery_days_min: 20, delivery_days_max: 30,
    },

    // ── Shenzhen → Almaty (truck) — 2 tiers ──────────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Shenzhen → Almaty',
      route_id: String(routeMap['shenzhen_almaty_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 5.0,
      delivery_days_min: 20, delivery_days_max: 30,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Shenzhen → Almaty',
      route_id: String(routeMap['shenzhen_almaty_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 4.2,
      delivery_days_min: 20, delivery_days_max: 30,
    },

    // ── Yiwu → Moscow (truck) — 3 tiers ──────────────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 100, max_weight: 300,
      price_value: 5.5,
      delivery_days_min: 25, delivery_days_max: 35,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 300, max_weight: 1000,
      price_value: 4.5,
      delivery_days_min: 25, delivery_days_max: 35,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 1000, max_weight: 0,
      price_value: 3.8,
      delivery_days_min: 25, delivery_days_max: 35,
    },

    // ── Guangzhou → Moscow (truck) — 2 tiers ─────────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Guangzhou → Moscow',
      route_id: String(routeMap['guangzhou_moscow_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 6.0,
      delivery_days_min: 30, delivery_days_max: 40,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Guangzhou → Moscow',
      route_id: String(routeMap['guangzhou_moscow_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 4.8,
      delivery_days_min: 30, delivery_days_max: 40,
    },

    // ── Heihe → Blagoveshchensk (truck) — 2 tiers ────────────────
    {
      ...truckBase,
      carrier_name: 'Market | Heihe → Blagoveshchensk',
      route_id: String(routeMap['heihe_blagoveshchensk_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 2.5,
      delivery_days_min: 3, delivery_days_max: 7,
    },
    {
      ...truckBase,
      carrier_name: 'Market | Heihe → Blagoveshchensk',
      route_id: String(routeMap['heihe_blagoveshchensk_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 2.0,
      delivery_days_min: 3, delivery_days_max: 7,
    },

    // ── Air: China → Russia / Kazakhstan (general) — 2 tiers ─────
    {
      carrier_name: 'Market | Air China → RU/KZ',
      transport_type: 'air',
      cargo_type: 'general',
      rate_type: 'KG',
      currency: 'USD',
      rate_source: M,
      status: 'active',
      min_weight: 100, max_weight: 300,
      price_value: 8.0,
      delivery_days_min: 5, delivery_days_max: 10,
    },
    {
      carrier_name: 'Market | Air China → RU/KZ',
      transport_type: 'air',
      cargo_type: 'general',
      rate_type: 'KG',
      currency: 'USD',
      rate_source: M,
      status: 'active',
      min_weight: 300, max_weight: 0,
      price_value: 6.0,
      delivery_days_min: 5, delivery_days_max: 10,
    },

    // ── Container FCL (sea / FIXED) ───────────────────────────────
    {
      carrier_name: 'Market | FCL 20ft (~$3500–5000)',
      transport_type: 'sea',
      cargo_type: 'general',
      rate_type: 'FIXED',
      currency: 'USD',
      rate_source: M,
      status: 'active',
      price_value: 4250,
      delivery_days_min: 35, delivery_days_max: 50,
    },
    {
      carrier_name: 'Market | FCL 40ft (~$5500–7500)',
      transport_type: 'sea',
      cargo_type: 'general',
      rate_type: 'FIXED',
      currency: 'USD',
      rate_source: M,
      status: 'active',
      price_value: 6500,
      delivery_days_min: 35, delivery_days_max: 50,
    },
  ];
}
