import type { ExtractedData } from "./ocr";
import type { HSClassification } from "./hs_classifier";
import type { DutyCalculation } from "./duty_calculator";

export function generateAltaXML(
  extracted: ExtractedData,
  hsCodes: HSClassification[],
  duties: DutyCalculation[],
  dest: "RU" | "KZ"
): string {
  const today = new Date().toISOString().split("T")[0];
  const docDate = extracted.doc_date || today;

  const esc = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const items = extracted.items
    .map((item, i) => {
      const hs = hsCodes[i] ?? {};
      const duty = duties[i] ?? {};
      return `
    <GoodsItem>
      <GoodsItemNumber>${i + 1}</GoodsItemNumber>
      <GoodsDescription>${esc(item.name_ru || item.name_cn)}</GoodsDescription>
      <GoodsDescriptionCN>${esc(item.name_cn)}</GoodsDescriptionCN>
      <CommodityCode>${esc(hs.hs_code_clean)}</CommodityCode>
      <CommodityCodeConfidence>${Math.round(((hs.confidence as number) ?? 0) * 100)}</CommodityCodeConfidence>
      <GoodsQuantity>
        <QuantityInUnits>${item.quantity}</QuantityInUnits>
        <MeasurementUnitCode>${esc(item.unit)}</MeasurementUnitCode>
      </GoodsQuantity>
      <GoodsGrossWeight>${item.weight_gross ?? 0}</GoodsGrossWeight>
      <GoodsNetWeight>${item.weight_net ?? 0}</GoodsNetWeight>
      <CustomsValue>
        <Amount>${(duty as DutyCalculation).customs_value_rub ?? 0}</Amount>
        <CurrencyCode>RUB</CurrencyCode>
        <OriginalAmount>${item.total_price}</OriginalAmount>
        <OriginalCurrencyCode>${esc(item.currency)}</OriginalCurrencyCode>
        <ExchangeRate>${(duty as DutyCalculation).exchange_rate_cny ?? 12.88}</ExchangeRate>
      </CustomsValue>
      <DutyPayments>
        <ImportDuty>
          <Rate>${(duty as DutyCalculation).duty_rate_percent ?? 0}</Rate>
          <Amount>${(duty as DutyCalculation).duty_amount ?? 0}</Amount>
          <CurrencyCode>RUB</CurrencyCode>
        </ImportDuty>
        <VAT>
          <Rate>${(duty as DutyCalculation).vat_rate_percent ?? 20}</Rate>
          <Amount>${(duty as DutyCalculation).vat_amount ?? 0}</Amount>
          <CurrencyCode>RUB</CurrencyCode>
        </VAT>
        <CustomsFee>
          <Amount>${(duty as DutyCalculation).customs_fee ?? 0}</Amount>
          <CurrencyCode>RUB</CurrencyCode>
        </CustomsFee>
        <TotalDuties>
          <Amount>${(duty as DutyCalculation).total_duties ?? 0}</Amount>
          <CurrencyCode>RUB</CurrencyCode>
        </TotalDuties>
      </DutyPayments>
      <CountryOfOrigin>${esc(item.origin_country || "CN")}</CountryOfOrigin>
    </GoodsItem>`;
    })
    .join("\n");

  const totalWeight = extracted.items.reduce((s, item) => s + (item.weight_gross ?? 0), 0);
  const totalDuties = duties.reduce((s, d) => s + (d.total_duties ?? 0), 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Сформировано ChinaBridge Docs ${today} -->
<!-- Для импорта в программу Альта-ГТД: Файл → Импорт → Выбрать XML -->
<!-- chinabridge.pro/docs -->
<CustomsDeclaration
  xmlns="urn:customs.ru:CommonAggregateTypes:5.22.0"
  Version="5.22.0"
  DocumentType="IMPORT">

  <DeclarationMeta>
    <GeneratedBy>ChinaBridge Docs AI</GeneratedBy>
    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
    <SourceDocument>${esc(extracted.doc_type)}</SourceDocument>
    <SourceDocumentNumber>${esc(extracted.doc_number)}</SourceDocumentNumber>
    <AIConfidenceNote>Данные сформированы AI. Требуется проверка таможенным брокером. Коды ТН ВЭД носят предварительный характер.</AIConfidenceNote>
  </DeclarationMeta>

  <Parties>
    <Seller>
      <Name>${esc(extracted.supplier.name_en || extracted.supplier.name_cn)}</Name>
      <NameCN>${esc(extracted.supplier.name_cn)}</NameCN>
      <Address>${esc(extracted.supplier.address)}</Address>
      <CountryCode>CN</CountryCode>
    </Seller>
    <Buyer>
      <Name>${esc(extracted.buyer?.name)}</Name>
    </Buyer>
  </Parties>

  <Transport>
    <DestinationCountry>${dest}</DestinationCountry>
    <OriginCountry>CN</OriginCountry>
  </Transport>

  <Invoice>
    <InvoiceNumber>${esc(extracted.doc_number)}</InvoiceNumber>
    <InvoiceDate>${esc(docDate)}</InvoiceDate>
    <TotalAmount>${extracted.total_amount}</TotalAmount>
    <Currency>${esc(extracted.total_currency)}</Currency>
    <TotalGrossWeight>${totalWeight}</TotalGrossWeight>
  </Invoice>

  <GoodsList>${items}
  </GoodsList>

  <PaymentSummary>
    <TotalDuties>
      <Amount>${totalDuties}</Amount>
      <CurrencyCode>RUB</CurrencyCode>
    </TotalDuties>
  </PaymentSummary>

</CustomsDeclaration>`;
}
