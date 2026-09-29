import { neon } from "@neondatabase/serverless";

export interface FieldSource {
  value: string;
  source: string;       // 'invoice' | 'packing_list' | 'contract' | 'ocr'
  page?: number;
  confidence?: number;
  note?: string;
}

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS docs_audit_trail (
      id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      upload_id       TEXT NOT NULL,
      field_name      TEXT NOT NULL,
      field_value     TEXT,
      source_type     TEXT DEFAULT 'ocr',
      source_document TEXT,
      page_number     INTEGER DEFAULT 1,
      confidence      NUMERIC DEFAULT 0.9,
      note            TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_trail_upload ON docs_audit_trail(upload_id)`;
}

export async function saveAuditTrail(
  uploadId: string,
  fieldSources: Record<string, FieldSource>
): Promise<void> {
  if (!process.env.DATABASE_URL || !uploadId || !fieldSources) return;
  await ensureTable().catch(() => null);
  const sql = neon(process.env.DATABASE_URL);

  const entries = Object.entries(fieldSources);
  if (!entries.length) return;

  for (const [fieldName, data] of entries) {
    await sql`
      INSERT INTO docs_audit_trail
        (upload_id, field_name, field_value, source_type, source_document, page_number, confidence, note)
      VALUES
        (${uploadId}, ${fieldName}, ${String(data.value ?? "")}, 'ocr',
         ${data.source || "document"}, ${data.page ?? 1}, ${data.confidence ?? 0.9}, ${data.note || ""})
    `.catch(() => null);
  }
}

export async function getAuditTrail(uploadId: string): Promise<Array<Record<string, unknown>>> {
  if (!process.env.DATABASE_URL || !uploadId) return [];
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT field_name, field_value, source_document, page_number, confidence, note
    FROM docs_audit_trail
    WHERE upload_id = ${uploadId}
    ORDER BY field_name
  `.catch(() => [] as unknown[]) as Array<Record<string, unknown>>;
  return rows;
}
