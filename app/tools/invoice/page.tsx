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

const S = {
  page: { background: "#0B1F3A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" } as React.CSSProperties,
  nav: { borderBottom: "1px solid #243a5e", padding: "14px 32px", display: "flex", alignItems: "center", gap: "12px" } as React.CSSProperties,
  section: { maxWidth: "1100px", margin: "0 auto", padding: "0 24px" } as React.CSSProperties,
  label: { color: "#475569", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "8px" },
  card: { background: "#0f2644", border: "1px solid #243a5e", borderRadius: "14px", padding: "24px" } as React.CSSProperties,
};

export default function InvoicePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f); setResult(null); setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/tools/invoice", { method: "POST", body: fd });
      const data = await resp.json() as Result & { error?: string };
      if (!resp.ok || data.error) setError(data.error ?? "Ошибка распознавания");
      else setResult(data);
    } catch { setError("Нет связи с сервером. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); };

  const fmt = (n: number | null | undefined, currency = "USD") =>
    !n ? "—" : `${currency} ${n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const scrollToUpload = () => uploadRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <main style={S.page}>

      {/* ── Nav ── */}
      <div style={S.nav}>
        <a href="/" style={{ color: "#00A86B", fontSize: "14px", textDecoration: "none" }}>← ChinaBridge</a>
        <span style={{ color: "#243a5e" }}>|</span>
        <a href="/tools" style={{ color: "#94a3b8", fontSize: "14px", textDecoration: "none" }}>Инструменты</a>
        <span style={{ color: "#243a5e" }}>|</span>
        <span style={{ fontSize: "14px" }}>Распознавание инвойса</span>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: "64px 24px 0", ...S.section }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "48px", alignItems: "center" }}>

          <div>
            <div style={{ display: "inline-block", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "20px", padding: "5px 14px", fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
              Для импортёров, работающих с Китаем
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
              От 微信-инвойса<br />
              до стоимости карго —<br />
              <span style={{ color: "#00A86B" }}>за 30 секунд</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "17px", lineHeight: 1.7, maxWidth: "520px", marginBottom: "32px" }}>
              Поставщик прислал инвойс картинкой в WeChat — загружаешь фото, мы читаем иероглифы, разбираем позиции и сразу считаем стоимость доставки до России или Казахстана. Без переводчика. Без звонка менеджеру.
            </p>
            <div style={{ display: "flex", gap: "32px" }}>
              {[
                { v: "95%+", l: "Точность на 中文 документах" },
                { v: "30 сек", l: "До готового расчёта" },
                { v: "ZH·RU·KZ", l: "Языки из коробки" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#00A86B" }}>{v}</div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero upload card */}
          <div style={{ background: "#0f2644", border: "1px solid #243a5e", borderRadius: "20px", padding: "28px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Загрузить инвойс</div>
            <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Фото из WeChat, скан, скриншот</div>

            <div
              ref={uploadRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#00A86B" : "#243a5e"}`,
                borderRadius: "12px",
                padding: preview ? "16px" : "32px 16px",
                textAlign: "center",
                cursor: file ? "default" : "pointer",
                background: dragging ? "rgba(0,168,107,0.05)" : "#0B1F3A",
                transition: "all 0.2s",
                marginBottom: "16px",
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
                  <img src={preview} alt="preview" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain", marginBottom: "10px" }} />
                  <div>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }}
                      style={{ background: "none", border: "1px solid #243a5e", color: "#94a3b8", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                      Заменить
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>Перетащи или нажми для выбора</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>JPG, PNG, WEBP, HEIC · до 10 MB</div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!file || loading}
              style={{
                width: "100%", background: !file || loading ? "#1e3a5f" : "#00A86B",
                color: !file || loading ? "#475569" : "#fff",
                border: "none", borderRadius: "10px", padding: "14px",
                fontSize: "15px", fontWeight: 700, cursor: !file || loading ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              {loading ? "Читаем иероглифы…" : "Распознать инвойс и рассчитать доставку →"}
            </button>
            <p style={{ textAlign: "center", color: "#334155", fontSize: "11px", marginTop: "10px" }}>
              Без регистрации · Файл не сохраняется на сервере
            </p>
          </div>
        </div>
      </div>

      {/* ── Result ── */}
      {result && (
        <div style={{ ...S.section, padding: "48px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
            <div>
              <div style={{ ...S.card, marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <div style={{ ...S.label }}>Поставщик</div>
                    <div style={{ fontWeight: 700, fontSize: "18px" }}>{result.invoice.supplier_name_ru || result.invoice.supplier_name || "—"}</div>
                    {result.invoice.supplier_name && result.invoice.supplier_name !== result.invoice.supplier_name_ru && (
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>{result.invoice.supplier_name}</div>
                    )}
                  </div>
                  <div style={{ background: "#00A86B22", border: "1px solid #00A86B44", borderRadius: "8px", padding: "6px 14px", color: "#00A86B", fontSize: "13px", fontWeight: 600 }}>✓ Распознано</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
                  {[
                    { label: "Инвойс №", value: result.invoice.invoice_number || "—" },
                    { label: "Дата", value: result.invoice.invoice_date || "—" },
                    { label: "Сумма", value: fmt(result.invoice.total_value, result.invoice.currency) },
                    { label: "Вес (брутто)", value: result.weight_kg ? `${result.weight_kg} кг` : "—" },
                    { label: "Кол-во мест", value: result.invoice.total_pieces ? `${result.invoice.total_pieces}` : "—" },
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

              {result.invoice.items?.length > 0 && (
                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #243a5e", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 600 }}>Позиции инвойса</span>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>{result.invoice.items.length} поз.</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#0B1F3A" }}>
                          {["Товар (RU)", "中文", "Кол-во", "Цена", "Сумма", "Вес"].map(h => (
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

            <div style={{ position: "sticky", top: "24px" }}>
              <div style={{ ...S.card, border: "1px solid #00A86B44", padding: 0, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#00A86B22,#0f2644)", padding: "20px", borderBottom: "1px solid #243a5e" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Стоимость доставки</div>
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>{result.weight_kg ? `Груз ${result.weight_kg} кг из Китая` : "По данным инвойса"}</div>
                </div>
                <div style={{ padding: "16px" }}>
                  {result.quotes.map((q) => (
                    <div key={q.id} style={{ background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{q.flag} {q.label}</div>
                          <div style={{ color: "#64748b", fontSize: "12px" }}>{q.note}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: "20px", color: "#00A86B" }}>${q.cost_usd.toLocaleString()}</div>
                          <div style={{ color: "#64748b", fontSize: "11px" }}>≈ {Math.round(q.cost_usd * 90).toLocaleString()} ₽</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                        <span>⏱ {q.days_min}–{q.days_max} дней</span>
                        <span>${q.rate_usd_per_kg}/кг</span>
                      </div>
                      {q.below_min && (
                        <div style={{ marginTop: "8px", background: "rgba(251,191,36,0.08)", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", color: "#fbbf24" }}>
                          ⚠️ Минимум {q.min_kg} кг. Расчёт за {q.billable_kg} кг
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ color: "#334155", fontSize: "11px", marginBottom: "14px" }}>* Ориентировочная цена. Точный расчёт с учётом объёма и типа груза — по запросу.</div>
                  <a href={`https://t.me/chinabridge_cargo?text=Хочу доставить груз из Китая. Вес: ${result.weight_kg || "??"} кг, Поставщик: ${result.invoice.supplier_name_ru || result.invoice.supplier_name || "из инвойса"}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", background: "#00A86B", color: "#fff", borderRadius: "10px", padding: "14px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
                    Запросить точный расчёт
                  </a>
                  <button onClick={reset}
                    style={{ width: "100%", background: "transparent", color: "#94a3b8", border: "1px solid #243a5e", borderRadius: "10px", padding: "10px", fontSize: "13px", cursor: "pointer" }}>
                    ← Загрузить другой инвойс
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pain points ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ПРОБЛЕМЫ ИМПОРТЁРА</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Три точки, где поставка из Китая теряет время</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {[
              {
                n: "01", title: "WeChat вместо нормального документа",
                body: "Поставщик шлёт инвойс картинкой в чат, пакинг — фото с телефона, спецификацию — в нестандартном Excel с иероглифами. Менеджер перепечатывает вручную.",
              },
              {
                n: "02", title: "Не знаешь сколько стоит доставка",
                body: "Вес в инвойсе есть, но чтобы узнать цену карго — нужно звонить менеджеру, ждать ответа, считать вручную. Сделка тормозит на самом простом шаге.",
              },
              {
                n: "03", title: "Рост заказов = рост хаоса",
                body: "Каждая новая поставка — это +1 час ручной работы. Количество поставщиков растёт, инвойсы копятся, ошибки в данных тиражируются.",
              },
            ].map((p) => (
              <div key={p.n} style={S.card}>
                <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "13px", fontFamily: "monospace", marginBottom: "12px" }}>{p.n}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>{p.title}</div>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>КАК РАБОТАЕТ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Три шага от фото в WeChat до цены доставки</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {[
              {
                n: "Шаг 01", title: "Загружаешь фото инвойса",
                body: "Фото из WeChat, скриншот, скан — на китайском, английском или смешанный. Читаем иероглифы (简·繁), печати, рукописные пометки.",
                result: "Данные без переводчика и без ручного ввода",
              },
              {
                n: "Шаг 02", title: "Извлекаем позиции и вес",
                body: "Позиции товара с переводом на русский, количество, цена, общая сумма, брутто-вес, артикулы, инкотермс — всё из одного документа.",
                result: "Структура сделки за 30 секунд",
              },
              {
                n: "Шаг 03", title: "Считаем стоимость доставки",
                body: "По фактическому весу из инвойса автоматически считаем карго до Москвы, Алматы или Астаны — авто и авиа — с реальными тарифами ChinaBridge.",
                result: "Цена доставки без звонка менеджеру",
              },
            ].map((step) => (
              <div key={step.n} style={S.card}>
                <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "12px", fontFamily: "monospace", marginBottom: "12px" }}>{step.n}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>{step.title}</div>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "14px" }}>{step.body}</p>
                <div style={{ background: "#0B1F3A", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#00A86B" }}>
                  ИТОГ · {step.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── What client gets ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ЧТО ПОЛУЧАЕШЬ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Из одного фото инвойса — полный пакет данных</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>📋 Из документа</div>
              {[
                ["Поставщик", "Название компании на китайском и русском"],
                ["Позиции товара", "Название ZH→RU, количество, единица измерения"],
                ["Цены", "За единицу и итого в валюте поставщика (CNY/USD/EUR)"],
                ["Вес брутто", "Общий вес партии в кг"],
                ["Инкотермс", "FOB / EXW / CIF — условия поставки"],
                ["Город отправки", "Откуда везти, для точного расчёта маршрута"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #1e3a5f", marginBottom: "12px" }}>
                  <div style={{ color: "#64748b", fontSize: "13px", minWidth: "130px", flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>🚚 Расчёт доставки</div>
              {[
                { flag: "🇷🇺", route: "Авто → Россия", rate: "$3.00/кг", days: "18–28 дней", min: "от 100 кг" },
                { flag: "🇰🇿", route: "Авто → Казахстан", rate: "$2.50/кг", days: "5–8 дней", min: "от 100 кг" },
                { flag: "✈️", route: "Авиа → RU/KZ", rate: "$23/кг", days: "3–7 дней", min: "от 1 кг" },
              ].map((r) => (
                <div key={r.route} style={{ background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "10px", padding: "14px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{r.flag} {r.route}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{r.days} · {r.min}</div>
                  </div>
                  <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "18px" }}>{r.rate}</div>
                </div>
              ))}
              <div style={{ marginTop: "16px", background: "#0B1F3A", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>📞 Точный расчёт</div>
                <div style={{ color: "#64748b", fontSize: "13px" }}>С учётом объёма, типа товара и актуального маршрута — менеджер перезвонит в течение 15 минут</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Before / After ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ДО / ПОСЛЕ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Что меняется в работе с поставщиком</div>
          </div>
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#0B1F3A" }}>
                    {["Ситуация", "Сейчас", "С ChinaBridge Docs"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Получил инвойс из WeChat", "Перепечатываю иероглифы вручную", "Загружаю фото — данные готовы за 30 сек"],
                    ["Узнать стоимость доставки", "Звоню менеджеру, жду ответа", "Цена по трём маршрутам — автоматически"],
                    ["Перевести название товара", "Google Translate, потом правлю", "Перевод ZH→RU встроен в распознавание"],
                    ["Посчитать вес для карго", "Считаю вручную по каждой позиции", "Вес извлекается из инвойса автоматически"],
                  ].map(([s, before, after], i) => (
                    <tr key={i} style={{ borderTop: "1px solid #1e3a5f" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 500 }}>{s}</td>
                      <td style={{ padding: "14px 20px", color: "#94a3b8" }}>{before}</td>
                      <td style={{ padding: "14px 20px", color: "#00A86B", fontWeight: 500 }}>{after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 80px" }}>
          <div style={{ background: "linear-gradient(135deg, #0f2644 0%, #0B1F3A 100%)", border: "1px solid #243a5e", borderRadius: "20px", padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
              Загрузи инвойс — получи расчёт за 30 секунд
            </div>
            <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "28px" }}>
              Без регистрации. Без звонка менеджеру. Фото не сохраняется.
            </p>
            <button
              onClick={scrollToUpload}
              style={{ background: "#00A86B", color: "#fff", border: "none", borderRadius: "12px", padding: "16px 40px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
            >
              Загрузить инвойс ↑
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
