// Parser Club File Import — XLSX / CSV / TXT
// POST /api/outbound/import  (multipart/form-data, field: "file")
// Admin only. Batch-qualifies rows via Claude Haiku 4.5 (2s throttle).

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { qualifyLead } from "@/lib/outbound/intake-qualifier";
import { scoreIntakeLead, buildFingerprint, mapOffer } from "@/lib/outbound/intake-scorer";
import { runOutboundMigrations } from "@/lib/outbound/migrations";
import { logIntakeEvent } from "@/lib/outbound/intake-analytics";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ ok: false, error: "invalid multipart" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });

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

  if (!rows.length) return NextResponse.json({ ok: false, error: "no rows found" }, { status: 400 });

  await runOutboundMigrations();
  const sql = neon(process.env.DATABASE_URL!);
  const approxDate = new Date().toISOString().slice(0, 10);
  const results = { total: rows.length, saved: 0, duplicates: 0, noise: 0, errors: 0 };
  const savedIds: string[] = [];

  for (const row of rows.slice(0, 500)) {
    try {
      const text = row.text.trim();
      if (!text || text.length < 5) { results.noise++; continue; }

      const fingerprint = buildFingerprint(row.username, row.chat, text, approxDate, row.external_id || undefined, row.external_id ? source : undefined);

      const existing = await sql`SELECT id FROM outbound_lead_events WHERE fingerprint = ${fingerprint} LIMIT 1`;
      if (existing.length > 0) { results.duplicates++; continue; }

      const { result: qual, normalizedText } = await qualifyLead(text, {
        username: row.username, chat: row.chat, source,
      });
      const score = scoreIntakeLead(qual);
      const offer = mapOffer(qual);

      const rawPayload = { source, username: row.username, chat: row.chat, text, external_id: row.external_id };

      const isNoise = qual.intent === "NOISE" || score.final_score < 5;

      const [event] = await sql`
        INSERT INTO outbound_lead_events (
          fingerprint, source, source_type, external_id, raw_text, normalized_text,
          raw_payload, source_chat, tg_username, tg_chat,
          intent, intent_subtype, lead_score, evidence_score, final_score,
          confidence, priority, stream,
          country, city, destination, product, product_category,
          business_type, supplier_exists, weight_kg, volume_m3, packages, urgency,
          recommended_offer, qualification_reason, key_signals, evidence_data,
          ai_reply_draft, product_hint, geography_hint,
          processing_status, approval_status
        ) VALUES (
          ${fingerprint}, ${source}, ${"file_import"}, ${row.external_id ?? ""},
          ${text}, ${normalizedText},
          ${JSON.stringify(rawPayload)}, ${row.chat}, ${row.username}, ${row.chat},
          ${qual.intent}, ${qual.intent_subtype},
          ${score.lead_score}, ${score.evidence_score}, ${score.final_score},
          ${qual.confidence}, ${score.priority}, ${qual.stream},
          ${qual.country}, ${qual.city}, ${qual.destination},
          ${qual.product ?? ""}, ${qual.product_category},
          ${qual.business_type}, ${qual.supplier_exists},
          ${qual.weight_kg}, ${qual.volume_m3}, ${qual.packages}, ${qual.urgency ?? ""},
          ${offer}, ${qual.qualification_reason},
          ${JSON.stringify(qual.key_signals)}, ${JSON.stringify(qual.evidence)},
          ${isNoise ? "" : qual.ai_reply_draft}, ${qual.product_hint}, ${qual.geography_hint},
          ${"processed"}, ${"PENDING"}
        ) RETURNING id
      `;

      await logIntakeEvent(sql, "lead_received", event.id, source, qual.country, qual.stream, score.final_score);
      if (isNoise) {
        await logIntakeEvent(sql, "lead_rejected", event.id, source, qual.country, qual.stream, score.final_score);
        results.noise++;
      } else {
        await logIntakeEvent(sql, "lead_classified", event.id, source, qual.country, qual.stream, score.final_score);
        results.saved++;
        savedIds.push(event.id);
      }

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
  external_id?: string;
}

// §4.1 ТЗ column mapping for Parser Club XLSX
const TEXT_COLS = /^(text|message|сообщение|текст|content|msg)$/i;
const USER_COLS = /^(username|user|автор|author|from|отправитель|name|имя)$/i;
const CHAT_COLS = /^(chat|channel|группа|chat_name|чат|канал|chat_url)$/i;
const ID_COLS   = /^(id|message_id|external_id|msg_id)$/i;

function parseCsvOrTxt(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  const hasHeader = /text|message|сообщение|username|chat|автор/i.test(firstLine);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headerCols = hasHeader ? firstLine.split(delimiter).map(h => h.toLowerCase().trim().replace(/^["']|["']$/g, "")) : null;

  return dataLines.map(line => {
    const cols = splitCsvLine(line, delimiter);
    if (headerCols) {
      const textIdx  = headerCols.findIndex(h => TEXT_COLS.test(h));
      const userIdx  = headerCols.findIndex(h => USER_COLS.test(h));
      const chatIdx  = headerCols.findIndex(h => CHAT_COLS.test(h));
      const idIdx    = headerCols.findIndex(h => ID_COLS.test(h));
      return {
        text: clean(cols[textIdx >= 0 ? textIdx : 0]),
        username: clean(cols[userIdx >= 0 ? userIdx : 1] ?? ""),
        chat: clean(cols[chatIdx >= 0 ? chatIdx : 2] ?? ""),
        external_id: idIdx >= 0 ? clean(cols[idIdx]) : undefined,
      };
    }
    return { text: clean(cols[0] ?? ""), username: clean(cols[1] ?? ""), chat: clean(cols[2] ?? "") };
  }).filter(r => r.text.length > 0);
}

function splitCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === delim && !inQ) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function clean(s: string): string {
  return (s ?? "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

async function parseXlsx(buffer: Buffer): Promise<ParsedRow[]> {
  // Dynamic require with webpackIgnore — xlsx is optional
  let XLSX: { read: Function; utils: { sheet_to_json: Function } } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    XLSX = require(/* webpackIgnore: true */ "xlsx");
  } catch {
    return parseCsvOrTxt(buffer.toString("utf8", 0, Math.min(buffer.length, 200_000)));
  }
  if (!XLSX) return parseCsvOrTxt(buffer.toString("utf8", 0, Math.min(buffer.length, 200_000)));

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return raw.map(row => {
    const keys = Object.keys(row);
    const textKey  = keys.find(k => TEXT_COLS.test(k)) ?? keys[0] ?? "";
    const userKey  = keys.find(k => USER_COLS.test(k)) ?? "";
    const chatKey  = keys.find(k => CHAT_COLS.test(k)) ?? "";
    const idKey    = keys.find(k => ID_COLS.test(k)) ?? "";
    return {
      text: String(row[textKey] ?? "").trim(),
      username: String(row[userKey] ?? "").trim(),
      chat: String(row[chatKey] ?? "").trim(),
      external_id: idKey ? String(row[idKey] ?? "").trim() : undefined,
    };
  }).filter(r => r.text.length > 0);
}
