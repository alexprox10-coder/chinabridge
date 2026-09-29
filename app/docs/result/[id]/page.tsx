"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ResultData {
  doc_id: string;
  status: string;
  filename: string;
  destination_country: string;
  result: {
    extracted: {
      doc_type: string;
      doc_number: string;
      doc_date: string;
      supplier: { name_en: string; name_cn: string };
      items: Array<{
        name_ru: string;
        name_cn: string;
        quantity: number;
        unit: string;
        total_price: number;
        currency: string;
        weight_net: number;
        weight_gross: number;
      }>;
      total_amount: number;
      total_currency: string;
      confidence: number;
    };
    hs_codes: Array<{
      hs_code: string;
      description_ru: string;
      confidence: number;
      duty_rate_percent: number;
      requires_certificate: boolean;
      certificate_type: string;
    }>;
    duties: Array<{
      customs_value_rub: number;
      duty_amount: number;
      duty_rate_percent: number;
      vat_amount: number;
      vat_rate_percent: number;
      customs_fee: number;
      total_duties: number;
      landed_cost_rub: number;
      currency: string;
    }>;
    validation: {
      is_valid: boolean;
      risk_level: string;
      errors: Array<{ field: string; issue: string; recommendation: string }>;
      warnings: Array<{ field: string; issue: string; recommendation: string }>;
      certificates_required: Array<string | { product?: string; requirement?: string; note?: string }>;
      import_restrictions: Array<string | { product?: string; restriction?: string; note?: string }>;
      broker_notes?: string;
    };
    summary: {
      total_items: number;
      total_amount_cny: number;
      total_duties_rub: number;
      total_landed_cost_rub: number;
      risk_level: string;
      is_ready: boolean;
    };
  };
}

const RISK_COLOR = { low: "#00A86B", medium: "#e08020", high: "#cc2222" };
const RISK_LABEL = { low: "✅ Низкий риск", medium: "⚠️ Средний риск", high: "❌ Высокий риск" };

export default function DocsResultPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/docs/result/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d as ResultData);
      })
      .catch((e) => setError(String(e)));
  }, [id]);

  if (error) return (
    <main style={{ fontFamily: "system-ui,sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
        <div style={{ fontSize: 18, color: "#f88", marginBottom: 16 }}>{error}</div>
        <a href="/docs/upload" style={{ color: "#229ED9" }}>← Загрузить другой документ</a>
      </div>
    </main>
  );

  if (!data) return (
    <main style={{ fontFamily: "system-ui,sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#8899aa" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        Загружаем результат...
      </div>
    </main>
  );

  const { extracted, hs_codes, duties, validation, summary } = data.result;
  const riskLevel = summary.risk_level as keyof typeof RISK_COLOR;
  const cur = duties[0]?.currency === "KZT" ? "₸" : "₽";

  return (
    <main style={{ fontFamily: "system-ui,sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <a href="/docs/upload" style={{ color: "#5a7899", fontSize: 13, textDecoration: "none", display: "block", marginBottom: 20 }}>← Загрузить другой документ</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>Результат анализа</h1>
            <div style={{ fontSize: 13, color: "#8899aa" }}>{data.filename} · {extracted.doc_date || "—"}</div>
          </div>
          <a
            href={`/api/docs/export/${id}`}
            download
            style={{ background: "#229ED9", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
          >
            📥 Скачать PDF пакет
          </a>
        </div>

        {/* Risk badge */}
        <div style={{ background: `${RISK_COLOR[riskLevel]}22`, border: `1px solid ${RISK_COLOR[riskLevel]}66`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: RISK_COLOR[riskLevel] }}>{RISK_LABEL[riskLevel]}</div>
          <div style={{ fontSize: 13, color: "#8899aa", marginTop: 4 }}>
            {summary.total_items} товаров · Пошлины: {summary.total_duties_rub.toLocaleString()} {cur} · Себестоимость до склада: {summary.total_landed_cost_rub.toLocaleString()} {cur}
          </div>
        </div>

        {/* Supplier */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#5a7899", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Документ</div>
          <div style={{ fontWeight: 700 }}>{extracted.supplier.name_en || extracted.supplier.name_cn}</div>
          <div style={{ fontSize: 13, color: "#8899aa", marginTop: 2 }}>
            {extracted.doc_type === "invoice" ? "Коммерческий инвойс" : extracted.doc_type} № {extracted.doc_number || "—"}
          </div>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {extracted.items.map((item, i) => {
            const hs = hs_codes[i];
            const d = duties[i];
            const conf = hs?.confidence ?? 0;
            const confColor = conf >= 0.85 ? "#00A86B" : conf >= 0.65 ? "#e08020" : "#cc2222";
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name_ru || item.name_cn}</div>
                    {item.name_cn !== item.name_ru && <div style={{ fontSize: 12, color: "#5a7899", marginTop: 2 }}>{item.name_cn}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700 }}>{item.quantity} {item.unit}</div>
                    <div style={{ fontSize: 12, color: "#8899aa" }}>{item.total_price?.toLocaleString()} {item.currency}</div>
                  </div>
                </div>

                {/* ТН ВЭД */}
                <div style={{ background: "#060f1e", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "#5a7899", textTransform: "uppercase", letterSpacing: "0.05em" }}>ТН ВЭД ЕАЭС</div>
                    <div style={{ fontSize: 11, color: confColor, fontWeight: 700 }}>
                      {Math.round(conf * 100)}% уверенность
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "monospace", color: "#229ED9" }}>{hs?.hs_code || "—"}</div>
                  <div style={{ fontSize: 12, color: "#8899aa", marginTop: 4 }}>{hs?.description_ru}</div>
                  {hs?.requires_certificate && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#e08020", background: "rgba(224,128,32,0.1)", borderRadius: 6, padding: "4px 10px" }}>
                      ⚠ Требуется: {hs.certificate_type}
                    </div>
                  )}
                </div>

                {/* Duties */}
                {d && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13 }}>
                    <div style={{ color: "#8899aa" }}>Таможенная стоимость</div>
                    <div style={{ textAlign: "right", fontWeight: 600 }}>{d.customs_value_rub?.toLocaleString()} {cur}</div>
                    <div style={{ color: "#8899aa" }}>Пошлина {d.duty_rate_percent}%</div>
                    <div style={{ textAlign: "right" }}>{d.duty_amount?.toLocaleString()} {cur}</div>
                    <div style={{ color: "#8899aa" }}>НДС {d.vat_rate_percent}%</div>
                    <div style={{ textAlign: "right" }}>{d.vat_amount?.toLocaleString()} {cur}</div>
                    <div style={{ color: "#8899aa" }}>Таможенный сбор</div>
                    <div style={{ textAlign: "right" }}>{d.customs_fee?.toLocaleString()} {cur}</div>
                    <div style={{ fontWeight: 700, borderTop: "1px solid #1e3a5f", paddingTop: 4, marginTop: 4 }}>ИТОГО платежей</div>
                    <div style={{ textAlign: "right", fontWeight: 700, borderTop: "1px solid #1e3a5f", paddingTop: 4, marginTop: 4, color: "#229ED9" }}>{d.total_duties?.toLocaleString()} {cur}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation */}
        {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.certificates_required.length > 0) && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Результат проверки</div>
            {validation.errors.map((e, i) => (
              <div key={i} style={{ marginBottom: 10, padding: "10px", background: "rgba(200,0,0,0.1)", borderRadius: 8, fontSize: 13 }}>
                <div style={{ color: "#f88", fontWeight: 600 }}>❌ {e.issue}</div>
                <div style={{ color: "#8899aa", marginTop: 4 }}>→ {e.recommendation}</div>
              </div>
            ))}
            {validation.warnings.map((w, i) => (
              <div key={i} style={{ marginBottom: 10, padding: "10px", background: "rgba(224,128,32,0.1)", borderRadius: 8, fontSize: 13 }}>
                <div style={{ color: "#e08020", fontWeight: 600 }}>⚠️ {w.issue}</div>
                <div style={{ color: "#8899aa", marginTop: 4 }}>→ {w.recommendation}</div>
              </div>
            ))}
            {validation.certificates_required.map((c, i) => {
              if (typeof c === "string") return <div key={i} style={{ marginBottom: 8, fontSize: 13, color: "#8899aa" }}>📋 {c}</div>;
              return (
                <div key={i} style={{ marginBottom: 8, padding: "8px 12px", background: "rgba(255,200,0,0.05)", borderRadius: 8, fontSize: 13, color: "#8899aa" }}>
                  📋 <span style={{ color: "#fff", fontWeight: 600 }}>{c.product}</span>
                  {c.requirement && <div style={{ marginTop: 4 }}>{c.requirement}</div>}
                  {c.note && <div style={{ marginTop: 4, fontSize: 12, color: "#5a7899" }}>{c.note}</div>}
                </div>
              );
            })}
            {validation.import_restrictions?.map((r, i) => {
              const text = typeof r === "string" ? r : `${r.product}: ${r.restriction}`;
              const note = typeof r === "object" ? r.note : "";
              return (
                <div key={i} style={{ marginBottom: 8, padding: "10px", background: "rgba(200,100,0,0.08)", borderRadius: 8, fontSize: 13 }}>
                  <div style={{ color: "#e08020", fontWeight: 600 }}>🚫 {text}</div>
                  {note && <div style={{ color: "#8899aa", marginTop: 4 }}>{note}</div>}
                </div>
              );
            })}
            {validation.broker_notes && (
              <div style={{ marginTop: 12, padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 13, color: "#8899aa" }}>
                <span style={{ fontWeight: 700, color: "#fff" }}>Брокеру: </span>{validation.broker_notes}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.4)", borderRadius: 14, padding: "20px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Нужна доставка из Китая?</div>
          <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 16 }}>Расчёт стоимости за 15 минут · Без предоплаты</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://t.me/chinabridge_pay_bot" target="_blank" rel="noopener noreferrer" style={{ background: "#229ED9", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              → Написать менеджеру
            </a>
            <a href={`/api/docs/export/${id}`} download style={{ background: "rgba(255,255,255,0.08)", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              📥 Скачать PDF
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
