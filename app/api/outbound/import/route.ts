// Parser Club File Import
// POST /api/outbound/import  (multipart/form-data, field: "file")
// Accepts XLSX / CSV / TXT — admin only
// Batch-qualifies rows via Claude Haiku 4.5 with 2s delay between rows

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { qualifyLead } from "@/lib/outbound/intake-qualifier";
import { scoreIntakeLead, buildFingerprint } from "@/lib/outbound/intake-scorer";
import { runOutboundMigrations } from "@/lib/outbound/migrations";

export const runtime = "nodejs";
export const maxDuration = 300; // large files need time

export async function POST(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid multipart" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });
  }

  const source = String(formData.get("source") ?? "xlsx_import");
  const fileName = file.name.toLowerCase();

  let rows: ParsedRow[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      rows = parseCsvOrTxt(buffer.toString("utf8"));
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      rows = await parseXlsx(buffer);
    } else {
      return NextResponse.json({ ok: false, error: "unsupported format — use xlsx/csv/txt" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: `parse error: ${err}` }, { status: 400 });
  }

  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "no rows found" }, { status: 400 });
  }

  await runOutboundMigrations();
  const sql = neon(process.env.DATABASE_URL!);
  const approxDate = new Date().toISOString().slice(0, 10);

  const results = { total: rows.length, saved: 0, duplicates: 0, noise: 0, errors: 0 };
  const savedIds: string[] = [];

  for (const row of rows.slice(0, 500)) { // cap at 500 per import
    try {
      const text = row.text.trim();
      if (!text || text.length < 5) { results.noise++; continue; }

      const fingerprint = buildFingerprint(row.username, row.chat, text, approxDate);

      const existing = await sql`
        SELECT id FROM outbound_lead_events WHERE fingerprint = ${fingerprint} LIMIT 1
      `;
      if (existing.length > 0) { results.duplicates++; continue; }

      const qual = await qualifyLead(text, { username: row.username, chat: row.chat, source });
      const score = scoreIntakeLead(qual);

      if (qual.intent === "NOISE" || score.final_score < 5) {
        await sql`
          INSERT INTO outbound_lead_events
            (fingerprint, source, raw_text, tg_username, tg_chat, intent,
             lead_score, evidence_score, final_score, priority, stream,
             qualification_reason, key_signals, ai_reply_draft, product_hint, geography_hint)
          VALUES
            (${fingerprint}, ${source}, ${text}, ${row.username}, ${row.chat}, ${qual.intent},
             ${score.lead_score}, ${score.evidence_score}, ${score.final_score}, ${score.priority}, ${qual.stream},
             ${qual.qualification_reason}, ${JSON.stringify(qual.key_signals)},
             '', ${qual.product_hint}, ${qual.geography_hint})
        `;
        results.noise++;
        continue;
      }

      const [event] = await sql`
        INSERT INTO outbound_lead_events
          (fingerprint, source, raw_text, tg_username, tg_chat, intent,
           lead_score, evidence_score, final_score, priority, stream,
           qualification_reason, key_signals, ai_reply_draft, product_hint, geography_hint)
        VALUES
          (${fingerprint}, ${source}, ${text}, ${row.username}, ${row.chat}, ${qual.intent},
           ${score.lead_score}, ${score.evidence_score}, ${score.final_score}, ${score.priority}, ${qual.stream},
           ${qual.qualification_reason}, ${JSON.stringify(qual.key_signals)},
           ${qual.ai_reply_draft}, ${qual.product_hint}, ${qual.geography_hint})
        RETURNING id
      `;
      results.saved++;
      savedIds.push(event.id);

      // Throttle Haiku calls: 2s gap between rows
      await new Promise(r => setTimeout(r, 2000));
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, results, saved_ids: savedIds.slice(0, 20) });
}

interface ParsedRow {
  text: string;
  username: string;
  chat: string;
}

function parseCsvOrTxt(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

  // Try to detect header
  const hasHeader = /text|message|сообщение|username|chat/i.test(firstLine);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const headerCols = hasHeader
    ? firstLine.split(delimiter).map(h => h.toLowerCase().trim())
    : null;

  return dataLines.map(line => {
    const cols = line.split(delimiter);
    if (headerCols) {
      const textIdx = headerCols.findIndex(h => /text|message|сообщение|content/i.test(h));
      const userIdx = headerCols.findIndex(h => /username|user|автор/i.test(h));
      const chatIdx = headerCols.findIndex(h => /chat|channel|группа/i.test(h));
      return {
        text: cols[textIdx >= 0 ? textIdx : 0]?.replace(/^["']|["']$/g, "").trim() ?? "",
        username: cols[userIdx >= 0 ? userIdx : 1]?.replace(/^["']|["']$/g, "").trim() ?? "",
        chat: cols[chatIdx >= 0 ? chatIdx : 2]?.replace(/^["']|["']$/g, "").trim() ?? "",
      };
    }
    // No header: assume first col = text
    return {
      text: cols[0]?.replace(/^["']|["']$/g, "").trim() ?? "",
      username: cols[1]?.replace(/^["']|["']$/g, "").trim() ?? "",
      chat: cols[2]?.replace(/^["']|["']$/g, "").trim() ?? "",
    };
  }).filter(r => r.text.length > 0);
}

async function parseXlsx(buffer: Buffer): Promise<ParsedRow[]> {
  // Dynamic import — falls back to CSV parser if xlsx not installed
  let XLSX: typeof import("xlsx") | null = null;
  try {
    XLSX = await import("xlsx");
  } catch {
    // xlsx not installed: treat as CSV (binary content won't parse well, but won't crash)
    return parseCsvOrTxt(buffer.toString("utf8", 0, Math.min(buffer.length, 200_000)));
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return raw.map(row => {
    const keys = Object.keys(row).map(k => k.toLowerCase());
    const textKey = Object.keys(row).find((_, i) => /text|message|сообщение|content/i.test(keys[i])) ?? Object.keys(row)[0] ?? "";
    const userKey = Object.keys(row).find((_, i) => /username|user|автор/i.test(keys[i])) ?? "";
    const chatKey = Object.keys(row).find((_, i) => /chat|channel|группа/i.test(keys[i])) ?? "";
    return {
      text: String(row[textKey] ?? "").trim(),
      username: String(row[userKey] ?? "").trim(),
      chat: String(row[chatKey] ?? "").trim(),
    };
  }).filter(r => r.text.length > 0);
}
