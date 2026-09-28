// ChinaBridge Docs — PDF package generator (pdfkit)
import type { ExtractedData } from "./ocr";
import type { HSClassification } from "./hs_classifier";
import type { DutyCalculation } from "./duty_calculator";
import type { ValidationResult } from "./validator";

export async function generateDocumentPackage(
  extracted: ExtractedData,
  hsCodes: HSClassification[],
  duties: DutyCalculation[],
  validation: ValidationResult,
  dest: "RU" | "KZ"
): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const destLabel = dest === "RU" ? "Россия" : "Казахстан";
    const currency = dest === "RU" ? "₽" : "₸";
    const totalDuties = duties.reduce((s, d) => s + d.total_duties, 0);
    const totalLanded = duties.reduce((s, d) => s + d.landed_cost_rub, 0);

    // ── HEADER ───────────────────────────────────────────────────────────────
    doc.fontSize(20).font("Helvetica-Bold")
       .text("ChinaBridge Docs — Таможенный пакет", { align: "center" });
    doc.fontSize(9).font("Helvetica").fillColor("#666")
       .text(`Сформировано: ${new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })} | chinabridge.pro/docs`, { align: "center" });
    doc.fillColor("#000").moveDown(0.8);

    hr(doc);

    // ── 1. ДОКУМЕНТ ──────────────────────────────────────────────────────────
    section(doc, "1. ИНФОРМАЦИЯ О ДОКУМЕНТЕ");
    row(doc, "Тип", docTypeLabel(extracted.doc_type));
    row(doc, "Номер", extracted.doc_number || "—");
    row(doc, "Дата", extracted.doc_date || "—");
    row(doc, "Поставщик", extracted.supplier.name_en || extracted.supplier.name_cn || "—");
    row(doc, "Страна назначения", destLabel);
    doc.moveDown(0.8);

    // ── 2. ТОВАРЫ ─────────────────────────────────────────────────────────────
    section(doc, "2. ПЕРЕЧЕНЬ ТОВАРОВ И ТАМОЖЕННЫЕ ПЛАТЕЖИ");

    extracted.items.forEach((item, i) => {
      const hs = hsCodes[i] ?? {} as HSClassification;
      const d = duties[i] ?? {} as DutyCalculation;

      doc.fontSize(10).font("Helvetica-Bold")
         .text(`${i + 1}. ${item.name_ru || item.name_cn}`);
      if (item.name_cn !== item.name_ru)
        doc.fontSize(9).font("Helvetica").fillColor("#555")
           .text(`   Оригинал: ${item.name_cn}`);
      doc.fillColor("#000");

      row(doc, "   Количество", `${item.quantity} ${item.unit}`);
      row(doc, "   Стоимость", `${item.total_price?.toLocaleString()} ${item.currency}`);
      row(doc, "   Вес н/б", `${item.weight_net ?? 0}/${item.weight_gross ?? 0} кг`);

      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a3a6e")
         .text(`   ТН ВЭД ЕАЭС: ${hs.hs_code || "—"}`);
      doc.fontSize(9).font("Helvetica").fillColor("#333")
         .text(`   ${hs.description_ru || ""}`);
      doc.fillColor("#000").moveDown(0.3);

      doc.fontSize(10).font("Helvetica-Bold").text("   Таможенные платежи:");
      doc.fontSize(9).font("Helvetica");
      doc.text(`   Таможенная стоимость: ${d.customs_value_rub?.toLocaleString()} ${currency}`);
      doc.text(`   Пошлина ${d.duty_rate_percent}%: ${d.duty_amount?.toLocaleString()} ${currency}`);
      doc.text(`   НДС при ввозе ${d.vat_rate_percent}%: ${d.vat_amount?.toLocaleString()} ${currency}`);
      doc.text(`   Таможенный сбор: ${d.customs_fee?.toLocaleString()} ${currency}`);
      doc.fontSize(10).font("Helvetica-Bold")
         .text(`   ИТОГО платежей: ${d.total_duties?.toLocaleString()} ${currency}`);
      doc.font("Helvetica")
         .text(`   Себестоимость "до склада": ${d.landed_cost_rub?.toLocaleString()} ${currency}`);

      if (hs.requires_certificate) {
        doc.fontSize(9).fillColor("#c00")
           .text(`   ⚠ Требуется: ${hs.certificate_type || "EAC сертификат"}`);
        doc.fillColor("#000");
      }

      if (i < extracted.items.length - 1) {
        doc.moveDown(0.5);
        hr(doc, "#ddd");
        doc.moveDown(0.5);
      }
    });

    doc.moveDown(0.8);

    // ── 3. ИТОГ ───────────────────────────────────────────────────────────────
    hr(doc);
    section(doc, "3. ИТОГОВЫЙ РАСЧЁТ");
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`ИТОГО таможенных платежей: ${totalDuties.toLocaleString()} ${currency}`);
    doc.text(`ИТОГО себестоимость до склада: ${totalLanded.toLocaleString()} ${currency}`);
    doc.moveDown(0.8);

    // ── 4. СТАТУС ─────────────────────────────────────────────────────────────
    section(doc, "4. РЕЗУЛЬТАТ ПРОВЕРКИ");
    const riskLabel: Record<string, string> = {
      low: "✅ НИЗКИЙ риск — документы готовы к подаче",
      medium: "⚠  СРЕДНИЙ риск — требует внимания",
      high: "❌ ВЫСОКИЙ риск — необходима доработка",
    };
    doc.fontSize(11).font("Helvetica-Bold")
       .fillColor(validation.risk_level === "low" ? "#007a40" : validation.risk_level === "medium" ? "#b86000" : "#c00000")
       .text(riskLabel[validation.risk_level] || riskLabel.medium);
    doc.fillColor("#000").font("Helvetica").fontSize(9);

    if (validation.errors.length > 0) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Ошибки:");
      doc.font("Helvetica");
      validation.errors.forEach((e) => {
        doc.text(`• ${e.issue}`);
        doc.text(`  → ${e.recommendation}`, { indent: 8 });
      });
    }

    if (validation.warnings.length > 0) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Предупреждения:");
      doc.font("Helvetica");
      validation.warnings.forEach((w) => doc.text(`• ${w.issue}`));
    }

    if (validation.certificates_required.length > 0) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Необходимые сертификаты:");
      doc.font("Helvetica");
      validation.certificates_required.forEach((c) => doc.text(`• ${c}`));
    }

    if (validation.broker_notes) {
      doc.moveDown(0.8);
      section(doc, "5. ПРИМЕЧАНИЯ ДЛЯ БРОКЕРА");
      doc.fontSize(9).font("Helvetica").text(validation.broker_notes);
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(8).fillColor("#888")
       .text("Расчёт является предварительным. Окончательное решение принимает таможенный брокер.", { align: "center" })
       .text("ChinaBridge Docs | chinabridge.pro/docs | info@chinabridge.pro", { align: "center" });

    doc.end();
  });
}

function hr(doc: InstanceType<typeof import("pdfkit")>, color = "#aaa") {
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(color).stroke().strokeColor("#000").moveDown(0.5);
}

function section(doc: InstanceType<typeof import("pdfkit")>, title: string) {
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a3a6e").text(title);
  doc.fillColor("#000").moveDown(0.4);
}

function row(doc: InstanceType<typeof import("pdfkit")>, label: string, value: string) {
  doc.fontSize(9).font("Helvetica");
  const x = doc.x;
  doc.text(label + ":", x, doc.y, { continued: true, width: 160 });
  doc.font("Helvetica-Bold").text(" " + value);
  doc.font("Helvetica");
}

function docTypeLabel(t: string): string {
  const map: Record<string, string> = {
    invoice: "Коммерческий инвойс",
    packing_list: "Упаковочный лист",
    cmr: "CMR-накладная",
    certificate: "Сертификат",
    other: "Другой документ",
  };
  return map[t] || t;
}
