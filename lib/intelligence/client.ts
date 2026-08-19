import { neon } from '@neondatabase/serverless';
import type {
  IntelSource, IntelFact, IntelFactVersion, IntelChange,
  CreateFactInput, CreateChangeInput, IntelStats,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQL = any;

let schemaEnsured = false;

export async function ensureIntelligenceSchema(sql: SQL): Promise<void> {
  if (schemaEnsured) return;

  await sql`
    CREATE TABLE IF NOT EXISTS intel_sources (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      url              TEXT NOT NULL,
      department       TEXT NOT NULL,
      source_type      TEXT NOT NULL,
      priority         INTEGER NOT NULL DEFAULT 3,
      active           BOOLEAN NOT NULL DEFAULT TRUE,
      crawl_frequency  TEXT NOT NULL DEFAULT 'DAILY',
      last_checked     TEXT,
      last_success     TEXT,
      error_count      INTEGER NOT NULL DEFAULT 0,
      notes            TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS intel_facts (
      id               SERIAL PRIMARY KEY,
      fact_key         TEXT NOT NULL UNIQUE,
      department       TEXT NOT NULL,
      category         TEXT NOT NULL,
      entity           TEXT NOT NULL,
      metric           TEXT NOT NULL,
      current_value    TEXT NOT NULL,
      unit             TEXT,
      valid_from       TEXT NOT NULL,
      source_id        INTEGER REFERENCES intel_sources(id),
      source_url       TEXT,
      confidence       TEXT NOT NULL DEFAULT 'MEDIUM',
      impact_level     TEXT NOT NULL DEFAULT 'MEDIUM',
      label            TEXT NOT NULL,
      notes            TEXT,
      requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
      approved_by      TEXT,
      approved_at      TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS intel_fact_versions (
      id         SERIAL PRIMARY KEY,
      fact_id    INTEGER NOT NULL REFERENCES intel_facts(id),
      fact_key   TEXT NOT NULL,
      value      TEXT NOT NULL,
      valid_from TEXT NOT NULL,
      valid_to   TEXT,
      source_url TEXT,
      confidence TEXT NOT NULL,
      change_id  INTEGER,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS intel_changes (
      id               SERIAL PRIMARY KEY,
      change_code      TEXT NOT NULL UNIQUE,
      fact_id          INTEGER REFERENCES intel_facts(id),
      fact_key         TEXT NOT NULL,
      department       TEXT NOT NULL,
      source_id        INTEGER REFERENCES intel_sources(id),
      source_url       TEXT,
      entity           TEXT NOT NULL,
      metric           TEXT NOT NULL,
      old_value        TEXT,
      new_value        TEXT NOT NULL,
      difference       TEXT,
      unit             TEXT,
      change_type      TEXT NOT NULL DEFAULT 'CHANGE',
      effective_from   TEXT,
      detected_at      TEXT NOT NULL,
      confidence       TEXT NOT NULL DEFAULT 'MEDIUM',
      impact           TEXT NOT NULL DEFAULT 'MEDIUM',
      impact_summary   TEXT,
      affected_systems JSONB NOT NULL DEFAULT '[]',
      status           TEXT NOT NULL DEFAULT 'PENDING',
      reviewed_by      TEXT,
      reviewed_at      TEXT,
      applied_at       TEXT,
      notes            TEXT,
      created_at       TEXT NOT NULL
    )
  `;

  schemaEnsured = true;
}

function getSql(): SQL {
  return neon(process.env.DATABASE_URL!);
}

// ── Sources ───────────────────────────────────────────────────────────────────

export async function getSources(): Promise<IntelSource[]> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const rows = await sql`SELECT * FROM intel_sources ORDER BY priority ASC, name ASC`;
  return rows as IntelSource[];
}

export async function createSource(
  data: Omit<IntelSource, 'id' | 'created_at' | 'updated_at' | 'last_checked' | 'last_success' | 'error_count'>,
): Promise<IntelSource> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const now = new Date().toISOString();
  const [row] = await sql`
    INSERT INTO intel_sources (name, url, department, source_type, priority, active, crawl_frequency, notes, created_at, updated_at)
    VALUES (${data.name}, ${data.url}, ${data.department}, ${data.source_type}, ${data.priority},
            ${data.active}, ${data.crawl_frequency}, ${data.notes ?? null}, ${now}, ${now})
    RETURNING *
  `;
  return row as IntelSource;
}

// ── Facts ─────────────────────────────────────────────────────────────────────

export async function getFacts(department?: string): Promise<IntelFact[]> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const rows = department
    ? await sql`SELECT * FROM intel_facts WHERE department = ${department} ORDER BY category ASC, label ASC`
    : await sql`SELECT * FROM intel_facts ORDER BY department ASC, category ASC, label ASC`;
  return rows as IntelFact[];
}

export async function getFactByKey(fact_key: string): Promise<IntelFact | null> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const rows = await sql`SELECT * FROM intel_facts WHERE fact_key = ${fact_key}`;
  return (rows[0] as IntelFact) ?? null;
}

export async function upsertFact(input: CreateFactInput): Promise<IntelFact> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const now = new Date().toISOString();

  const existing = await sql`SELECT id, current_value, valid_from, confidence FROM intel_facts WHERE fact_key = ${input.fact_key}`;

  if (existing.length > 0) {
    const old = existing[0];
    const [updated] = await sql`
      UPDATE intel_facts SET
        current_value     = ${input.current_value},
        confidence        = ${input.confidence},
        impact_level      = ${input.impact_level},
        source_url        = ${input.source_url ?? null},
        valid_from        = ${input.valid_from},
        notes             = ${input.notes ?? null},
        updated_at        = ${now}
      WHERE fact_key = ${input.fact_key}
      RETURNING *
    `;
    // Archive old version
    await sql`
      INSERT INTO intel_fact_versions (fact_id, fact_key, value, valid_from, valid_to, source_url, confidence, created_at)
      VALUES (${old.id}, ${input.fact_key}, ${old.current_value}, ${old.valid_from}, ${now}, ${input.source_url ?? null}, ${old.confidence}, ${now})
    `;
    return updated as IntelFact;
  }

  // Insert new
  const [row] = await sql`
    INSERT INTO intel_facts (
      fact_key, department, category, entity, metric,
      current_value, unit, valid_from, source_id, source_url,
      confidence, impact_level, label, notes, requires_approval,
      created_at, updated_at
    ) VALUES (
      ${input.fact_key}, ${input.department}, ${input.category}, ${input.entity}, ${input.metric},
      ${input.current_value}, ${input.unit ?? null}, ${input.valid_from}, ${input.source_id ?? null}, ${input.source_url ?? null},
      ${input.confidence}, ${input.impact_level}, ${input.label}, ${input.notes ?? null}, ${input.requires_approval ?? false},
      ${now}, ${now}
    )
    RETURNING *
  `;
  // Initial version
  await sql`
    INSERT INTO intel_fact_versions (fact_id, fact_key, value, valid_from, source_url, confidence, created_at)
    VALUES (${row.id}, ${input.fact_key}, ${input.current_value}, ${input.valid_from}, ${input.source_url ?? null}, ${input.confidence}, ${now})
  `;
  return row as IntelFact;
}

export async function getFactVersions(fact_key: string): Promise<IntelFactVersion[]> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const rows = await sql`
    SELECT * FROM intel_fact_versions WHERE fact_key = ${fact_key} ORDER BY created_at DESC LIMIT 20
  `;
  return rows as IntelFactVersion[];
}

// ── Changes ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseChange(r: any): IntelChange {
  return {
    ...r,
    affected_systems: Array.isArray(r.affected_systems)
      ? r.affected_systems
      : JSON.parse(r.affected_systems ?? '[]'),
  } as IntelChange;
}

export async function getChanges(status?: string, department?: string): Promise<IntelChange[]> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);

  let rows;
  if (status && department) {
    rows = await sql`SELECT * FROM intel_changes WHERE status = ${status} AND department = ${department} ORDER BY detected_at DESC`;
  } else if (status) {
    rows = await sql`SELECT * FROM intel_changes WHERE status = ${status} ORDER BY detected_at DESC`;
  } else if (department) {
    rows = await sql`SELECT * FROM intel_changes WHERE department = ${department} ORDER BY detected_at DESC`;
  } else {
    rows = await sql`SELECT * FROM intel_changes ORDER BY detected_at DESC LIMIT 200`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => parseChange(r));
}

export async function createChange(input: CreateChangeInput): Promise<IntelChange> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  const countRows = await sql`SELECT COUNT(*) as cnt FROM intel_changes WHERE created_at LIKE ${year + '%'}`;
  const seq = Number(countRows[0]?.cnt ?? 0) + 1;
  const change_code = `ИЗМ-${year}-${String(seq).padStart(3, '0')}`;

  const factRows = await sql`SELECT id FROM intel_facts WHERE fact_key = ${input.fact_key}`;
  const fact_id: number | null = factRows.length > 0 ? factRows[0].id : null;

  const affected = JSON.stringify(input.affected_systems ?? []);

  const [row] = await sql`
    INSERT INTO intel_changes (
      change_code, fact_id, fact_key, department, source_id, source_url,
      entity, metric, old_value, new_value, difference, unit,
      change_type, effective_from, detected_at, confidence, impact, impact_summary,
      affected_systems, status, notes, created_at
    ) VALUES (
      ${change_code}, ${fact_id}, ${input.fact_key}, ${input.department},
      ${input.source_id ?? null}, ${input.source_url ?? null},
      ${input.entity}, ${input.metric}, ${input.old_value ?? null}, ${input.new_value},
      ${input.difference ?? null}, ${input.unit ?? null},
      ${input.change_type}, ${input.effective_from ?? null}, ${now},
      ${input.confidence}, ${input.impact}, ${input.impact_summary ?? null},
      ${affected}::jsonb, 'PENDING', ${input.notes ?? null}, ${now}
    )
    RETURNING *
  `;
  return parseChange(row);
}

export async function reviewChange(
  id: number,
  status: 'APPROVED' | 'REJECTED',
  reviewed_by: string,
): Promise<IntelChange> {
  const sql = getSql();
  const now = new Date().toISOString();
  const [row] = await sql`
    UPDATE intel_changes SET status = ${status}, reviewed_by = ${reviewed_by}, reviewed_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `;
  return parseChange(row);
}

export async function applyChange(id: number): Promise<{ ok: boolean; message: string }> {
  const sql = getSql();
  const now = new Date().toISOString();

  const rows = await sql`SELECT * FROM intel_changes WHERE id = ${id} AND status = 'APPROVED'`;
  if (!rows.length) return { ok: false, message: 'Изменение не найдено или не одобрено' };

  const change = parseChange(rows[0]);

  if (change.fact_key) {
    const factRows = await sql`SELECT * FROM intel_facts WHERE fact_key = ${change.fact_key}`;
    if (factRows.length > 0) {
      const fact = factRows[0];
      await sql`
        INSERT INTO intel_fact_versions (fact_id, fact_key, value, valid_from, valid_to, confidence, change_id, created_at)
        VALUES (${fact.id}, ${fact.fact_key}, ${fact.current_value}, ${fact.valid_from}, ${now}, ${fact.confidence}, ${id}, ${now})
      `;
      await sql`
        UPDATE intel_facts SET
          current_value = ${change.new_value},
          valid_from    = ${change.effective_from ?? now},
          updated_at    = ${now}
        WHERE fact_key = ${change.fact_key}
      `;
    }
  }

  await sql`UPDATE intel_changes SET status = 'APPLIED', applied_at = ${now} WHERE id = ${id}`;
  return { ok: true, message: 'Изменение применено' };
}

// ── Snapshot ──────────────────────────────────────────────────────────────────

export interface FactSnapshot {
  value:      string;
  valid_from: string;
  fact_id:    number;
  label:      string;
}

export async function getFactsSnapshot(
  keys: string[],
): Promise<Record<string, FactSnapshot>> {
  const sql = getSql();
  try {
    const rows = await sql`
      SELECT id, fact_key, current_value, valid_from, label
      FROM intel_facts
      WHERE fact_key = ANY(${keys}::text[])
    `;
    const result: Record<string, FactSnapshot> = {};
    for (const r of rows) {
      result[String(r.fact_key)] = {
        value:      String(r.current_value),
        valid_from: String(r.valid_from),
        fact_id:    Number(r.id),
        label:      String(r.label),
      };
    }
    return result;
  } catch {
    return {};
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<IntelStats> {
  const sql = getSql();
  await ensureIntelligenceSchema(sql);

  const [sources, facts, chgPending, chgApplied] = await Promise.all([
    sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE active = true) as active FROM intel_sources`,
    sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE impact_level = 'CRITICAL') as critical FROM intel_facts`,
    sql`SELECT COUNT(*) as cnt FROM intel_changes WHERE status = 'PENDING'`,
    sql`SELECT COUNT(*) as cnt FROM intel_changes WHERE status = 'APPLIED'`,
  ]);

  return {
    sources_total:    Number(sources[0]?.total   ?? 0),
    sources_active:   Number(sources[0]?.active  ?? 0),
    facts_total:      Number(facts[0]?.total     ?? 0),
    facts_critical:   Number(facts[0]?.critical  ?? 0),
    changes_pending:  Number(chgPending[0]?.cnt  ?? 0),
    changes_applied:  Number(chgApplied[0]?.cnt  ?? 0),
  };
}
