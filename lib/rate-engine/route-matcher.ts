import type { ShippingRate, Route, TransportType, CargoType, CalculationInput } from './types';

export interface MatchOptions {
  country_to: string;
  city_to: string;
  country_from?: string;
  city_from?: string;
  transport_type?: TransportType;
  cargo_type?: CargoType;
  weight?: number;
  volume?: number;
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function matchRoute(routes: Route[], opts: MatchOptions): Route | null {
  const active = routes.filter(r => r.status === 'active');

  // Exact city match first
  let match = active.find(r => {
    const cityMatch = normalize(r.city_to) === normalize(opts.city_to);
    const countryMatch = normalize(r.country_to) === normalize(opts.country_to);
    const typeMatch = !opts.transport_type || r.transport_type === opts.transport_type;
    const fromMatch = !opts.city_from || normalize(r.city_from) === normalize(opts.city_from);
    return cityMatch && countryMatch && typeMatch && fromMatch;
  });

  // Fall back to country match
  if (!match) {
    match = active.find(r => {
      const countryMatch = normalize(r.country_to) === normalize(opts.country_to);
      const typeMatch = !opts.transport_type || r.transport_type === opts.transport_type;
      return countryMatch && typeMatch;
    });
  }

  return match ?? null;
}

export function matchRate(rates: ShippingRate[], opts: MatchOptions & { route?: Route }): ShippingRate | null {
  const active = rates.filter(r => r.status === 'active');

  const scored = active
    .filter(r => {
      // Transport type filter
      if (opts.transport_type && r.transport_type !== opts.transport_type) return false;
      // Cargo type filter
      if (opts.cargo_type && r.cargo_type !== opts.cargo_type) return false;
      // Weight range check
      if (opts.weight !== undefined) {
        if (r.min_weight !== undefined && r.min_weight > 0 && opts.weight < r.min_weight) return false;
        if (r.max_weight !== undefined && r.max_weight > 0 && opts.weight > r.max_weight) return false;
      }
      // Volume range check
      if (opts.volume !== undefined) {
        if (r.min_volume !== undefined && r.min_volume > 0 && opts.volume < r.min_volume) return false;
        if (r.max_volume !== undefined && r.max_volume > 0 && opts.volume > r.max_volume) return false;
      }
      return true;
    })
    .map(r => {
      let score = 0;
      // Route match bonus
      if (opts.route && String(r.route_id) === String(opts.route.id)) score += 10;
      // Cargo type match bonus
      if (opts.cargo_type && r.cargo_type === opts.cargo_type) score += 5;
      // Transport type match bonus
      if (opts.transport_type && r.transport_type === opts.transport_type) score += 5;
      return { rate: r, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.rate ?? null;
}

export function getDefaultTransportType(weight?: number, volume?: number): TransportType {
  if (!weight && !volume) return 'truck';
  const w = weight ?? 0;
  const v = volume ?? 0;
  if (w > 500 || v > 3) return 'sea';
  if (w <= 100 && v <= 0.5) return 'air';
  return 'truck';
}
