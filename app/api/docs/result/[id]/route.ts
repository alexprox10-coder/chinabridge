import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const db = neon(process.env.DATABASE_URL);
  const rows = await db`
    SELECT r.result_data, u.status, u.filename, u.destination_country, u.marketplace
    FROM docs_results r
    JOIN docs_uploads u ON u.id = r.upload_id
    WHERE r.upload_id = ${id}
    LIMIT 1
  `;
  if (!rows.length)
    return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  const row = rows[0] as { result_data: unknown; status: string; filename: string; destination_country: string; marketplace: string };
  return NextResponse.json({
    doc_id: id,
    status: row.status,
    filename: row.filename,
    destination_country: row.destination_country,
    marketplace: row.marketplace,
    result: row.result_data,
  });
}
