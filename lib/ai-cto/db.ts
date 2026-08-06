import { neon } from "@neondatabase/serverless";
import type { CtoReport } from "./types";

const sql = neon(process.env.DATABASE_URL!);

export async function ensureCtoTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cto_reports (
      id           SERIAL PRIMARY KEY,
      run_at       TIMESTAMPTZ DEFAULT NOW(),
      duration_ms  INTEGER,
      health_score INTEGER,
      system_status TEXT,
      sections     JSONB,
      issues       JSONB,
      recommendations JSONB,
      auto_fixed   JSONB,
      telegram_sent BOOLEAN DEFAULT FALSE,
      ceo_notified  BOOLEAN DEFAULT FALSE
    )
  `;
}

export async function saveCtoReport(report: CtoReport): Promise<number> {
  await ensureCtoTable();
  const rows = await sql`
    INSERT INTO cto_reports
      (run_at, duration_ms, health_score, system_status, sections, issues,
       recommendations, auto_fixed, telegram_sent, ceo_notified)
    VALUES (
      ${report.runAt},
      ${report.durationMs},
      ${report.healthScore},
      ${report.systemStatus},
      ${JSON.stringify(report.sections)},
      ${JSON.stringify(report.issues)},
      ${JSON.stringify(report.recommendations)},
      ${JSON.stringify(report.autoFixed)},
      ${report.telegramSent},
      ${report.ceoNotified}
    )
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function getLatestCtoReport(): Promise<CtoReport | null> {
  await ensureCtoTable();
  const rows = await sql`
    SELECT * FROM cto_reports ORDER BY run_at DESC LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToReport(rows[0]);
}

export async function getCtoReportHistory(limit = 30): Promise<CtoReport[]> {
  await ensureCtoTable();
  const rows = await sql`
    SELECT id, run_at, duration_ms, health_score, system_status, telegram_sent, ceo_notified
    FROM cto_reports ORDER BY run_at DESC LIMIT ${limit}
  `;
  return rows.map(r => ({
    id:           r.id as number,
    runAt:        r.run_at as string,
    durationMs:   r.duration_ms as number,
    healthScore:  r.health_score as number,
    systemStatus: r.system_status as CtoReport["systemStatus"],
    sections:     [],
    issues:       { critical: [], warning: [], minor: [] },
    recommendations: [],
    autoFixed:    [],
    telegramSent: r.telegram_sent as boolean,
    ceoNotified:  r.ceo_notified as boolean,
  }));
}

export async function getCtoReportById(id: number): Promise<CtoReport | null> {
  await ensureCtoTable();
  const rows = await sql`SELECT * FROM cto_reports WHERE id = ${id}`;
  if (!rows[0]) return null;
  return rowToReport(rows[0]);
}

function rowToReport(r: Record<string, unknown>): CtoReport {
  return {
    id:           r.id as number,
    runAt:        r.run_at as string,
    durationMs:   r.duration_ms as number,
    healthScore:  r.health_score as number,
    systemStatus: r.system_status as CtoReport["systemStatus"],
    sections:     (r.sections as CtoReport["sections"]) ?? [],
    issues:       (r.issues  as CtoReport["issues"])   ?? { critical: [], warning: [], minor: [] },
    recommendations: (r.recommendations as string[])   ?? [],
    autoFixed:       (r.auto_fixed      as string[])   ?? [],
    telegramSent: r.telegram_sent as boolean,
    ceoNotified:  r.ceo_notified  as boolean,
  };
}
