import { NextRequest, NextResponse } from 'next/server';
import { listRows } from '@/lib/rate-engine/db';
import { TABLE_IDS } from '@/lib/rate-engine/db';

export const runtime = 'nodejs';
export const revalidate = 3600; // cache 1h

export interface RateBenchmark {
  id?: number;
  route_from: string;
  route_to: string;
  city_to: string;
  mode: string;
  service_type: string;
  price_low: number;
  price_high: number;
  price_median: number;
  price_unit: string;
  currency: string;
  days_min: number;
  days_max: number;
  notes: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country_to = searchParams.get('country_to');
  const mode = searchParams.get('mode');

  const rows = await listRows<RateBenchmark>(TABLE_IDS.rate_benchmarks).catch(() => []);

  const filtered = rows.filter(r => {
    if (country_to && r.route_to !== country_to) return false;
    if (mode && r.mode !== mode) return false;
    return true;
  });

  return NextResponse.json({ ok: true, data: filtered, count: filtered.length });
}
