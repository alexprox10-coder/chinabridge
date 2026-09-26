"use client";

import { useState, useRef, useCallback } from "react";

interface InvoiceItem {
  description_zh: string;
  description_ru: string;
  hs_code_hint: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  weight_kg: number;
}

interface Invoice {
  supplier_name: string;
  supplier_name_ru: string;
  invoice_number: string;
  invoice_date: string | null;
  currency: string;
  total_value: number;
  total_weight_kg: number;
  total_pieces: number;
  incoterms: string | null;
  origin_city: string;
  items: InvoiceItem[];
  notes: string;
}

interface Quote {
  id: string;
  label: string;
  flag: string;
  rate_usd_per_kg: number;
  days_min: number;
  days_max: number;
  min_kg: number;
  note: string;
  cost_usd: number;
  billable_kg: number;
  below_min: boolean;
}

interface Result {
  invoice: Invoice;
  quotes: Quote[];
  weight_kg: number;
}

export default function InvoicePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/tools/invoice", { method: "POST", body: fd });
      const data = await resp.json() as Result & { error?: string };
      if (!resp.ok || data.error) {
        setError(data.error ?? "Ошибка распознавания");
      } else {
        setResult(data);
      }
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const fmt = (n: number | null | undefined, currency = "USD") => {
    if (!n) return "—";
    return `${currency} ${n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <main
      style={{ background: "#0B1F3A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1px solid #243a5e", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="/" style={{ color: "#00A86B", fontSize: "14px", textDecoration: "none" }}>← ChinaBridge</a>
        <span style={{ color: "#243a5e" }}>|</span>
        <span style={{ color: "#94a3b8", fontSize: "14px" }}>Инструменты</span>
        <span style={{ color: "#243a5e" }}>|</span>
        <span style={{ fontSize: "14px" }}>Распознавание инвойса</span>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "inline-block", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "24px", padding: "6px 16px", fontSize: "13px", color: "#00A86B", marginBottom: "16px" }}>
            🔬 Бесплатный инструмент · Beta
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.15, marginBottom: "16px" }}>
            От 微信-инвойса<br />
            <span style={{ color: "#00A86B" }}>до стоимости доставки — за 30 секунд</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "560px", margin: "0 auto" }}>
            Загрузи фото или скан китайского инвойса. AI распознает иероглифы, извлечёт позиции и сразу рассчитает стоимость карго до России и Казахстана.
          </p>
        </div>

        {!result ? (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#00A86B" : file ? "#243a5e" : "#243a5e"}`,
                borderRadius: "16px",
                padding: "40px 24px",
                textAlign: "center",
                cursor: file ? "default" : "pointer",
                background: dragging ? "rgba(0,168,107,0.05)" : "#0f2644",
                transition: "all 0.2s",
                marginBottom: "24px",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {preview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="preview"
                    style={{ maxHeight: "220px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain", marginBottom: "12px" }}
                  />
                  <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px" }}>{file?.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    style={{ background: "none", border: "1px solid #243a5e", color: "#94a3b8", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Заменить файл
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                    Перетащи инвойс или нажми для выбора
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                    JPG, PNG, WEBP, HEIC · до 10 MB<br />
                    Фото из WeChat, скан, фото с телефона — всё подойдёт
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#fca5a5", fontSize: "14px", marginBottom: "16px" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!file || loading}
              style={{
                width: "100%",
                background: !file || loading ? "#243a5e" : "#00A86B",
                color: !file || loading ? "#64748b" : "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: !file || loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <span>🔍 Распознаём иероглифы и считаем доставку…</span>
              ) : (
                <span>⚡ Распознать инвойс и рассчитать карго</span>
              )}
            </button>

            <p style={{ textAlign: "center", color: "#475569", fontSize: "12px", marginTop: "12px" }}>
              Бесплатно · Без регистрации · Файл не сохраняется
            </p>
          </div>
        ) : (
          /* Results */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

              {/* Left: Invoice data */}
              <div>
                {/* Summary card */}
                <div style={{ background: "#0f2644", border: "1px solid #243a5e", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Поставщик</div>
                      <div style={{ fontWeight: 700, fontSize: "18px" }}>{result.invoice.supplier_name_ru || result.invoice.supplier_name || "—"}</div>
                      {result.invoice.supplier_name && result.invoice.supplier_name !== result.invoice.supplier_name_ru && (
                        <div style={{ color: "#94a3b8", fontSize: "13px" }}>{result.invoice.supplier_name}</div>
                      )}
                    </div>
                    <div style={{ background: "#00A86B22", border: "1px solid #00A86B44", borderRadius: "8px", padding: "6px 14px", color: "#00A86B", fontSize: "13px", fontWeight: 600 }}>
                      ✓ Распознано
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
                    {[
                      { label: "Инвойс №", value: result.invoice.invoice_number || "—" },
                      { label: "Дата", value: result.invoice.invoice_date || "—" },
                      { label: "Сумма", value: fmt(result.invoice.total_value, result.invoice.currency) },
                      { label: "Вес (брутто)", value: result.weight_kg ? `${result.weight_kg} кг` : "—" },
                      { label: "Мест / штук", value: result.invoice.total_pieces ? `${result.invoice.total_pieces}` : "—" },
                      { label: "Инкотермс", value: result.invoice.incoterms || "—" },
                      { label: "Город отправки", value: result.invoice.origin_city || "Китай" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {result.invoice.notes && (
                    <div style={{ marginTop: "16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fbbf24", fontSize: "13px" }}>
                      💡 {result.invoice.notes}
                    </div>
                  )}
                </div>

                {/* Items table */}
                {result.invoice.items?.length > 0 && (
                  <div style={{ background: "#0f2644", border: "1px solid #243a5e", borderRadius: "16px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #243a5e" }}>
                      <span style={{ fontWeight: 600 }}>Позиции инвойса</span>
                      <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "8px" }}>{result.invoice.items.length} позиций</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "#0B1F3A" }}>
                            {["Товар (RU)", "Китайский", "Кол-во", "Цена", "Сумма", "Вес"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.invoice.items.map((item, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #1e3a5f" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 500 }}>{item.description_ru || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{item.description_zh || "—"}</td>
                              <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{item.quantity} {item.unit}</td>
                              <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{item.unit_price ? `${result.invoice.currency} ${item.unit_price}` : "—"}</td>
                              <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{item.total_price ? `${result.invoice.currency} ${item.total_price}` : "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{item.weight_kg ? `${item.weight_kg} кг` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Cargo quotes */}
              <div style={{ position: "sticky", top: "24px" }}>
                <div style={{ background: "#0f2644", border: "1px solid #00A86B44", borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(135deg, #00A86B22, #0f2644)", padding: "20px", borderBottom: "1px solid #243a5e" }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>💰 Стоимость доставки</div>
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                      {result.weight_kg ? `Груз ${result.weight_kg} кг из Китая` : "На основе вашего инвойса"}
                    </div>
                  </div>

                  <div style={{ padding: "16px" }}>
                    {result.quotes.map((q) => (
                      <div key={q.id} style={{ background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{q.flag} {q.label}</div>
                            <div style={{ color: "#64748b", fontSize: "12px" }}>{q.note}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "20px", color: "#00A86B" }}>
                              ${q.cost_usd.toLocaleString()}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "11px" }}>≈ {Math.round(q.cost_usd * 90).toLocaleString()} ₽</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                          <span>⏱ {q.days_min}–{q.days_max} дней</span>
                          <span>${q.rate_usd_per_kg}/кг</span>
                        </div>
                        {q.below_min && (
                          <div style={{ marginTop: "8px", background: "rgba(251,191,36,0.08)", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", color: "#fbbf24" }}>
                            ⚠️ Минимум {q.min_kg} кг. Цена за {q.billable_kg} кг
                          </div>
                        )}
                      </div>
                    ))}

                    <div style={{ color: "#475569", fontSize: "11px", marginBottom: "16px", padding: "0 4px" }}>
                      * Ориентировочная стоимость. Точный расчёт с учётом объёма, типа груза и маршрута — по запросу.
                    </div>

                    <a
                      href={`https://t.me/chinabridge_cargo?text=Хочу доставить груз из Китая. Вес: ${result.weight_kg || "??"} кг, Поставщик: ${result.invoice.supplier_name_ru || result.invoice.supplier_name || "из инвойса"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        background: "#00A86B",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "14px",
                        textAlign: "center",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "15px",
                        marginBottom: "10px",
                      }}
                    >
                      📦 Запросить точный расчёт
                    </a>

                    <a
                      href="/ai-calculator"
                      style={{
                        display: "block",
                        background: "transparent",
                        color: "#94a3b8",
                        border: "1px solid #243a5e",
                        borderRadius: "10px",
                        padding: "12px",
                        textAlign: "center",
                        textDecoration: "none",
                        fontSize: "13px",
                      }}
                    >
                      Калькулятор доставки →
                    </a>
                  </div>
                </div>

                {/* Preview thumbnail */}
                {preview && (
                  <div style={{ marginTop: "16px", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="invoice" style={{ maxHeight: "120px", maxWidth: "100%", borderRadius: "6px", objectFit: "contain" }} />
                    <div style={{ marginTop: "8px" }}>
                      <button
                        onClick={reset}
                        style={{ background: "none", border: "1px solid #243a5e", color: "#94a3b8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        ← Загрузить другой инвойс
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feature pills */}
        {!result && (
          <div style={{ marginTop: "48px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            {[
              "🈷️ Читает иероглифы (简·繁)",
              "⚖️ Извлекает вес и количество",
              "💱 CNY / USD / EUR",
              "📋 Позиции и артикулы",
              "🚚 Расчёт карго RU + KZ",
              "🔒 Файл не сохраняется на сервере",
            ].map((f) => (
              <div
                key={f}
                style={{ background: "#0f2644", border: "1px solid #243a5e", borderRadius: "20px", padding: "8px 16px", fontSize: "13px", color: "#94a3b8" }}
              >
                {f}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
