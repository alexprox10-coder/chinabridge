import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";
const TABLE_ID = "ZUdd2z8BpyvePLeX";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paramStr = searchParams.get("params") ?? "";
  const url = `${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows${paramStr ? `?${paramStr}` : ""}`;

  const res = await fetch(url, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
    signal: AbortSignal.timeout(30000),
  });

  const raw = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = raw; }

  const isObj = typeof parsed === "object" && parsed !== null;
  const keys = isObj ? Object.keys(parsed as object) : [];
  const rowsLen = isObj && "rows" in (parsed as object) ? (parsed as {rows: unknown[]}).rows?.length : "N/A";
  const dataLen = isObj && "data" in (parsed as object) ? (parsed as {data: unknown[]}).data?.length : "N/A";

  return NextResponse.json({
    status: res.status,
    url,
    topLevelKeys: keys,
    rowsCount: rowsLen,
    dataCount: dataLen,
    sample: isObj ? { ...parsed as object, rows: undefined, data: undefined } : parsed,
    firstRow: isObj && "data" in (parsed as object)
      ? (parsed as {data: unknown[]}).data?.[0]
      : isObj && "rows" in (parsed as object)
      ? (parsed as {rows: unknown[]}).rows?.[0]
      : null,
  });
}
