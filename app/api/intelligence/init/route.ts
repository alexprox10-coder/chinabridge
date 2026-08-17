import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  ensureIntelligenceSchema, upsertFact, createSource, getSources, getStats,
} from '@/lib/intelligence/client';
import { SEED_FACTS, SEED_SOURCES } from '@/lib/intelligence/seed';

export const runtime  = 'nodejs';
export const dynamic  = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!);
  await ensureIntelligenceSchema(sql);

  // Seed sources
  const existing = await getSources();
  const sourceNames = new Set(existing.map(s => s.name));

  let sourcesAdded = 0;
  for (const src of SEED_SOURCES) {
    if (!sourceNames.has(src.name)) {
      await createSource(src);
      sourcesAdded++;
    }
  }

  // Seed facts (upsert — updates value if exists)
  let factsUpserted = 0;
  for (const fact of SEED_FACTS) {
    await upsertFact(fact);
    factsUpserted++;
  }

  const stats = await getStats();

  return NextResponse.json({
    ok: true,
    sources_added: sourcesAdded,
    facts_upserted: factsUpserted,
    stats,
  });
}

export async function GET() {
  const stats = await getStats();
  return NextResponse.json({ ok: true, stats });
}
