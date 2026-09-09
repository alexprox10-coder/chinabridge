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
    // ── Yiwu/Guangzhou → Almaty (97Kapro, 5-8 days) — density-based ──
    // Costs: 600+=$1.30, 400-600=$1.35, 300-400=$1.40, 250-300=$1.45,
    //        200-250=$1.50, 170-200=$1.60, 140-170=$1.70, 120-140=$1.80
    // ChinaBridge sells at: cost + ~65-80% markup
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu/GZ → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 0, max_weight: 50,
      price_value: 3.50,  // light/bulky (<120 kg/m³): cost ~$1.80-1.90 + markup
      delivery_days_min: 5, delivery_days_max: 8,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu/GZ → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 50, max_weight: 200,
      price_value: 3.00,  // medium density (120-170 kg/m³): cost ~$1.70-1.80 + markup
      delivery_days_min: 5, delivery_days_max: 8,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu/GZ → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 200, max_weight: 500,
      price_value: 2.50,  // typical marketplace goods (200-300 kg/m³): cost $1.45-1.50 + markup
      delivery_days_min: 5, delivery_days_max: 8,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu/GZ → Almaty',
      route_id: String(routeMap['yiwu_almaty_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 2.20,  // heavy/dense (400+ kg/m³): cost $1.30-1.40 + markup
      delivery_days_min: 5, delivery_days_max: 8,
    },

    // ── Guangzhou → Almaty (97Kapro) ─────────────────────────────
    {
      ...truckBase,
      carrier_name: '97Kapro | Guangzhou → Almaty',
      route_id: String(routeMap['guangzhou_almaty_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 2.60,
      delivery_days_min: 5, delivery_days_max: 8,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Guangzhou → Almaty',
      route_id: String(routeMap['guangzhou_almaty_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 2.20,
      delivery_days_min: 5, delivery_days_max: 8,
    },

    // ── Shenzhen → Almaty (97Kapro) ──────────────────────────────
    {
      ...truckBase,
      carrier_name: '97Kapro | Shenzhen → Almaty',
      route_id: String(routeMap['shenzhen_almaty_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 2.70,
      delivery_days_min: 5, delivery_days_max: 8,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Shenzhen → Almaty',
      route_id: String(routeMap['shenzhen_almaty_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 2.30,
      delivery_days_min: 5, delivery_days_max: 8,
    },

    // ── Yiwu → Moscow (97Kapro express) — 3 tiers ────────────────
    // Costs (cat A): 200-300=$2.00-2.20, 300-400=$1.80, 400-600=$1.70
    // ChinaBridge sells at cost + ~65% markup
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 100, max_weight: 300,
      price_value: 4.00,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 300, max_weight: 1000,
      price_value: 3.50,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Yiwu → Moscow',
      route_id: String(routeMap['yiwu_moscow_truck'] ?? ''),
      min_weight: 1000, max_weight: 0,
      price_value: 3.00,
      delivery_days_min: 18, delivery_days_max: 25,
    },

    // ── Guangzhou → Moscow (97Kapro) ─────────────────────────────
    {
      ...truckBase,
      carrier_name: '97Kapro | Guangzhou → Moscow',
      route_id: String(routeMap['guangzhou_moscow_truck'] ?? ''),
      min_weight: 100, max_weight: 500,
      price_value: 3.80,
      delivery_days_min: 18, delivery_days_max: 25,
    },
    {
      ...truckBase,
      carrier_name: '97Kapro | Guangzhou → Moscow',
      route_id: String(routeMap['guangzhou_moscow_truck'] ?? ''),
      min_weight: 500, max_weight: 0,
      price_value: 3.20,
      delivery_days_min: 18, delivery_days_max: 25,
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
