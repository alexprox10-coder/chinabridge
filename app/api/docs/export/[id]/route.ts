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
    SELECT pdf_base64, u.filename
    FROM docs_results r
    JOIN docs_uploads u ON u.id = r.upload_id
    WHERE r.upload_id = ${id}
    LIMIT 1
  `;
  if (!rows.length)
    return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  const row = rows[0] as { pdf_base64: string; filename: string };
  if (!row.pdf_base64)
    return NextResponse.json({ error: "PDF не готов" }, { status: 404 });

  const buf = Buffer.from(row.pdf_base64, "base64");
  const safeName = row.filename.replace(/\.[^.]+$/, "") || "invoice";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_customs_package.pdf"`,
      "Content-Length": String(buf.length),
    },
  });
}
