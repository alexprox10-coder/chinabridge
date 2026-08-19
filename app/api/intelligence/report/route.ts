import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getStats, getFactByKey } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') ?? '24');
  const sql = neon(process.env.DATABASE_URL!);

  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const [stats, pendingChanges, recentApplied, recentFacts, cnyFact, usdFact, customsFact] =
    await Promise.all([
      getStats(),
      sql`
        SELECT id, change_code, fact_key, entity, metric, old_value, new_value,
               difference, impact, change_type, detected_at, impact_summary
        FROM intel_changes
        WHERE status = 'PENDING'
        ORDER BY detected_at DESC
        LIMIT 20
      `,
      sql`
        SELECT id, change_code, fact_key, entity, metric, old_value, new_value,
               difference, impact, applied_at
        FROM intel_changes
        WHERE status = 'APPLIED' AND applied_at >= ${since}
        ORDER BY applied_at DESC
        LIMIT 10
      `,
      sql`
        SELECT fact_key, label, current_value, unit, updated_at, impact_level
        FROM intel_facts
        WHERE updated_at >= ${since}
        ORDER BY updated_at DESC
        LIMIT 10
      `,
      getFactByKey('CNY_RATE'),
      getFactByKey('USD_RATE'),
      getFactByKey('CUSTOMS_DUTY_DEFAULT'),
    ]);

  // Критические изменения (требуют срочного внимания)
  const critical = (pendingChanges as any[]).filter(c => c.impact === 'CRITICAL');
  const warnings = (pendingChanges as any[]).filter(c => c.change_type === 'WARNING');
  const infoChanges = (pendingChanges as any[]).filter(c => c.impact === 'INFO');

  return NextResponse.json({
    ok: true,
    period_hours: hours,
    generated_at: new Date().toISOString(),
    stats,
    rates: {
      cny: cnyFact ? { value: cnyFact.current_value, updated: cnyFact.updated_at } : null,
      usd: usdFact ? { value: usdFact.current_value, updated: usdFact.updated_at } : null,
      customs: customsFact ? { value: customsFact.current_value, unit: customsFact.unit } : null,
    },
    changes: {
      pending_total:  pendingChanges.length,
      critical:       critical,
      warnings:       warnings,
      info:           infoChanges,
      applied_recent: recentApplied,
    },
    facts_updated: recentFacts,
  });
}
