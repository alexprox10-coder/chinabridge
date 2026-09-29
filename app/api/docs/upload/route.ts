import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { extractDocumentData } from "@/lib/docs/ocr";
import { classifyHSCode } from "@/lib/docs/hs_classifier";
import { calculateDuties } from "@/lib/docs/duty_calculator";
import { validateDocument } from "@/lib/docs/validator";
import { generateDocumentPackage } from "@/lib/docs/pdf_generator";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const dest = (formData.get("country") as "RU" | "KZ") || "RU";
  const marketplace = (formData.get("marketplace") as string) || "";
  const telegram = (formData.get("telegram") as string) || "";

  if (!file) return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
  if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i))
    return NextResponse.json({ error: "Поддерживаются JPG, PNG, WEBP, HEIC, PDF" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Файл слишком большой (макс 20MB)" }, { status: 400 });

  const db = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
  let docId: string = crypto.randomUUID();

  if (db) {
    try {
      const row = await db`
        INSERT INTO docs_uploads (id, filename, mime_type, destination_country, marketplace, user_telegram, status)
        VALUES (${docId}, ${file.name}, ${file.type}, ${dest}, ${marketplace}, ${telegram}, 'processing')
        RETURNING id
      `;
      docId = (row[0] as { id: string }).id;
    } catch {
      // proceed without DB record
    }
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Step 1: OCR
    const extracted = await extractDocumentData(base64, mimeType);

    // Step 2: ТН ВЭД classification (parallel per item)
    const hsCodes = await Promise.all(extracted.items.map((item) => classifyHSCode(item)));

    // Step 3: Duty calculations
    const duties = extracted.items.map((item, i) => calculateDuties(item, hsCodes[i], dest));

    // Step 4: Validation
    const validation = await validateDocument(
      extracted,
      hsCodes.map((h) => h.hs_code_clean),
      dest,
      marketplace || undefined
    );

    // Step 5: PDF (optional — if pdfkit fails on Vercel, proceed without PDF)
    let pdfBase64 = "";
    try {
      const pdfBuffer = await generateDocumentPackage(extracted, hsCodes, duties, validation, dest);
      pdfBase64 = pdfBuffer.toString("base64");
    } catch (pdfErr) {
      console.error("[docs/upload] PDF generation failed (non-fatal):", pdfErr);
    }

    const summary = {
      total_items: extracted.items.length,
      total_amount_cny: extracted.total_amount,
      total_duties_rub: duties.reduce((s, d) => s + d.total_duties, 0),
      total_landed_cost_rub: duties.reduce((s, d) => s + d.landed_cost_rub, 0),
      risk_level: validation.risk_level,
      is_ready: validation.is_valid,
      pdf_ready: pdfBase64.length > 0,
    };

    const result = { extracted, hs_codes: hsCodes, duties, validation, summary };

    if (db) {
      try {
        await db`
          INSERT INTO docs_results (upload_id, result_data, pdf_base64, status)
          VALUES (${docId}, ${JSON.stringify(result)}, ${pdfBase64 || null}, 'completed')
        `;
        await db`UPDATE docs_uploads SET status = 'completed' WHERE id = ${docId}`;
      } catch { /* ok */ }
    }

    // Notify manager (fire-and-forget but awaited per Vercel best practice)
    const webhookUrl = process.env.N8N_WEBHOOK_DOCS;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new_doc_processed",
          doc_id: docId,
          telegram,
          items: summary.total_items,
          total_cny: summary.total_amount_cny,
          total_duties_rub: summary.total_duties_rub,
          risk_level: summary.risk_level,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, doc_id: docId, result: summary });
  } catch (err) {
    console.error("[docs/upload] error:", err);
    if (db) {
      await db`UPDATE docs_uploads SET status = 'error', error_message = ${String(err)} WHERE id = ${docId}`.catch(() => null);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
