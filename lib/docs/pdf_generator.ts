// ChinaBridge Docs — PDF generator (pdfmake — works in all Node.js/serverless envs)
import type { ExtractedData } from "./ocr";
import type { HSClassification } from "./hs_classifier";
import type { DutyCalculation } from "./duty_calculator";
import type { ValidationResult } from "./validator";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake/src/printer");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfsModule = require("pdfmake/build/vfs_fonts");
// pdfmake v0.2: fonts are under pdfMake.vfs; v0.1: under vfs directly
const vfsFonts: Record<string, string> = vfsModule.pdfMake?.vfs ?? vfsModule.vfs ?? vfsModule;

const fonts = {
  Roboto: {
    normal:      Buffer.from(vfsFonts["Roboto-Regular.ttf"],     "base64"),
    bold:        Buffer.from(vfsFonts["Roboto-Medium.ttf"],      "base64"),
    italics:     Buffer.from(vfsFonts["Roboto-Italic.ttf"],      "base64"),
    bolditalics: Buffer.from(vfsFonts["Roboto-MediumItalic.ttf"],"base64"),
  },
};

const fmt = (n: number | undefined) =>
  (n ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

export async function generateDocumentPackage(
  extracted: ExtractedData,
  hsCodes: HSClassification[],
  duties: DutyCalculation[],
  validation: ValidationResult,
  dest: "RU" | "KZ"
): Promise<Buffer> {
  const currency = dest === "RU" ? "₽" : "₸";
  const destLabel = dest === "RU" ? "Россия" : "Казахстан";
  const totalDuties = duties.reduce((s, d) => s + (d.total_duties ?? 0), 0);
  const totalLanded = duties.reduce((s, d) => s + (d.landed_cost_rub ?? 0), 0);
  const date = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  const riskColor = validation.risk_level === "low" ? "#007a40"
    : validation.risk_level === "medium" ? "#b86000" : "#c00000";
  const riskLabel = validation.risk_level === "low"
    ? "✓ НИЗКИЙ риск — документы готовы к подаче"
    : validation.risk_level === "medium"
    ? "⚠ СРЕДНИЙ риск — требует внимания"
    : "✗ ВЫСОКИЙ риск — необходима доработка";

  // Build goods table rows
  const goodsRows: object[] = [
    [
      { text: "№", style: "th" },
      { text: "Товар", style: "th" },
      { text: "Кол-во", style: "th" },
      { text: "Стоимость", style: "th" },
      { text: "ТН ВЭД ЕАЭС", style: "th" },
      { text: `Пошлины (${currency})`, style: "th" },
    ],
  ];

  extracted.items.forEach((item, i) => {
    const hs = hsCodes[i] ?? ({} as HSClassification);
    const d = duties[i] ?? ({} as DutyCalculation);
    goodsRows.push([
      { text: String(i + 1), alignment: "center" },
      {
        stack: [
          { text: item.name_ru || item.name_cn, bold: true, fontSize: 9 },
          { text: item.name_cn, color: "#666", fontSize: 8 },
          hs.requires_certificate
            ? { text: `⚠ ${hs.certificate_type || "Требуется сертификат"}`, color: "#c00", fontSize: 7, margin: [0, 2, 0, 0] }
            : {},
        ],
      },
      { text: `${item.quantity} ${item.unit}`, alignment: "center", fontSize: 9 },
      {
        stack: [
          { text: `${fmt(item.total_price)} ${item.currency}`, fontSize: 9 },
          { text: `${fmt(d.customs_value_rub)} ${currency}`, color: "#555", fontSize: 8 },
        ],
      },
      {
        stack: [
          { text: hs.hs_code || "—", bold: true, color: "#1a3a6e", fontSize: 9 },
          { text: (hs.description_ru || "").slice(0, 60) + "…", fontSize: 7, color: "#444" },
          { text: `Уверенность: ${Math.round((hs.confidence ?? 0) * 100)}%`, fontSize: 7, color: "#888" },
        ],
      },
      {
        stack: [
          { text: `Пошлина ${d.duty_rate_percent ?? 0}%: ${fmt(d.duty_amount)} ${currency}`, fontSize: 8 },
          { text: `НДС ${d.vat_rate_percent ?? 0}%: ${fmt(d.vat_amount)} ${currency}`, fontSize: 8 },
          { text: `Сбор: ${fmt(d.customs_fee)} ${currency}`, fontSize: 8 },
          { text: `ИТОГО: ${fmt(d.total_duties)} ${currency}`, bold: true, fontSize: 9, color: "#1a3a6e" },
        ],
      },
    ]);
  });

  // Validation issues
  const issueItems: object[] = [];
  validation.errors?.forEach((e) => {
    issueItems.push({ text: `✗ ${e.issue}`, color: "#c00", fontSize: 9 });
    issueItems.push({ text: `  → ${e.recommendation}`, color: "#555", fontSize: 8, margin: [8, 0, 0, 4] });
  });
  validation.warnings?.forEach((w) => {
    issueItems.push({ text: `⚠ ${w.issue}`, color: "#b86000", fontSize: 9 });
    issueItems.push({ text: `  → ${w.recommendation}`, color: "#555", fontSize: 8, margin: [8, 0, 0, 4] });
  });

  const docDef = {
    pageSize: "A4" as const,
    pageMargins: [30, 40, 30, 40] as [number, number, number, number],
    defaultStyle: { font: "Roboto", fontSize: 10 },
    styles: {
      header: { fontSize: 16, bold: true, color: "#1a3a6e", alignment: "center" as const },
      subheader: { fontSize: 8, color: "#888", alignment: "center" as const },
      section: { fontSize: 11, bold: true, color: "#1a3a6e", margin: [0, 12, 0, 4] as [number, number, number, number] },
      th: { bold: true, fillColor: "#1a3a6e", color: "#fff", fontSize: 9 },
      footer: { fontSize: 7, color: "#aaa", alignment: "center" as const },
    },
    content: [
      { text: "ChinaBridge Docs — Таможенный пакет", style: "header" },
      { text: `${date} | chinabridge.pro/docs`, style: "subheader" },
      { canvas: [{ type: "line" as const, x1: 0, y1: 4, x2: 535, y2: 4, lineWidth: 1, lineColor: "#1a3a6e" }] },

      { text: "1. Информация о документе", style: "section" },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: [{ text: "Тип: ", bold: true }, docTypeLabel(extracted.doc_type)], fontSize: 9 },
              { text: [{ text: "Номер: ", bold: true }, extracted.doc_number || "—"], fontSize: 9 },
              { text: [{ text: "Дата: ", bold: true }, extracted.doc_date || "—"], fontSize: 9 },
            ],
          },
          {
            width: "50%",
            stack: [
              { text: [{ text: "Поставщик: ", bold: true }, extracted.supplier.name_en || extracted.supplier.name_cn || "—"], fontSize: 9 },
              { text: [{ text: "Покупатель: ", bold: true }, extracted.buyer.name || "—"], fontSize: 9 },
              { text: [{ text: "Страна назначения: ", bold: true }, destLabel], fontSize: 9 },
            ],
          },
        ],
      },

      { text: "2. Товары и таможенные платежи", style: "section" },
      {
        table: {
          headerRows: 1,
          widths: [20, "*", 50, 70, 100, 90] as (number | string)[],
          body: goodsRows,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#ccc",
          vLineColor: () => "#ccc",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      },

      { text: "3. Итоговый расчёт", style: "section" },
      {
        table: {
          widths: ["*", 150] as (number | string)[],
          body: [
            [
              { text: "Итого таможенных платежей:", bold: true },
              { text: `${fmt(totalDuties)} ${currency}`, bold: true, alignment: "right" as const, color: "#1a3a6e" },
            ],
            [
              { text: "Итого себестоимость до склада:", bold: true },
              { text: `${fmt(totalLanded)} ${currency}`, bold: true, alignment: "right" as const, color: "#007a40" },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      },

      { text: "4. Результат проверки", style: "section" },
      { text: riskLabel, bold: true, color: riskColor, fontSize: 11, margin: [0, 0, 0, 6] as [number, number, number, number] },
      ...(issueItems.length > 0 ? issueItems : [{ text: "Замечаний не обнаружено", color: "#007a40", fontSize: 9 }]),

      ...(validation.certificates_required?.length > 0 ? [
        { text: "Необходимые разрешительные документы:", bold: true, fontSize: 9, margin: [0, 8, 0, 2] as [number, number, number, number] },
        ...validation.certificates_required.map((c: string) => ({ text: `• ${c}`, fontSize: 8, color: "#444" })),
      ] : []),

      ...(validation.broker_notes ? [
        { text: "Примечания для брокера:", style: "section" },
        { text: validation.broker_notes, fontSize: 8, color: "#333" },
      ] : []),

      { text: "\n" },
      { canvas: [{ type: "line" as const, x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: "#ccc" }] },
      { text: "\nРасчёт является предварительным. Окончательное решение принимает таможенный брокер.\nChinaBridge Docs | chinabridge.pro/docs", style: "footer", margin: [0, 4, 0, 0] as [number, number, number, number] },
    ],
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDef);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (c: Buffer) => chunks.push(c));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
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
