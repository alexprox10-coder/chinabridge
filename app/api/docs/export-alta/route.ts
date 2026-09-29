import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { generateAltaXML } from "@/lib/docs/alta_exporter";
import type { ExtractedData } from "@/lib/docs/ocr";
import type { HSClassification } from "@/lib/docs/hs_classifier";
import type { DutyCalculation } from "@/lib/docs/duty_calculator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID не указан" }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DB не настроен" }, { status: 503 });

  const db = neon(process.env.DATABASE_URL);

  const rows = await db`
    SELECT r.result_data, u.destination_country, u.filename
    FROM docs_results r
    JOIN docs_uploads u ON u.id = r.upload_id
    WHERE r.upload_id = ${id}
    LIMIT 1
  `.catch(() => [] as unknown[]) as Array<{
    result_data: {
      extracted: ExtractedData;
      hs_codes: HSClassification[];
      duties: DutyCalculation[];
    };
    destination_country: string;
    filename: string;
  }>;

  if (!rows[0]) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  const { result_data, destination_country } = rows[0];
  const { extracted, hs_codes, duties } = result_data;

  if (!extracted || !hs_codes || !duties) {
    return NextResponse.json({ error: "Данные документа неполные" }, { status: 422 });
  }

  const xml = generateAltaXML(
    extracted,
    hs_codes,
    duties,
    (destination_country as "RU" | "KZ") || "RU"
  );

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="chinabridge_alta_${id.slice(0, 8)}.xml"`,
    },
  });
}
