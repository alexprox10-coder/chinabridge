"use client";
import { useState } from "react";

interface Product {
  id: string;
  name_cn: string;
  name_ru: string;
  hs_code: string;
  hs_confirmed: boolean;
  times_seen: number;
}

interface Supplier {
  id: string;
  name_cn: string;
  name_en: string;
  address: string;
  total_docs: number;
  last_seen: string;
  products: Product[];
}

export default function DocsHistoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");

  const loadHistory = async () => {
    if (!key.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/docs/master-data?telegram=${encodeURIComponent(key.trim())}`);
    const data = await res.json() as { suppliers?: Supplier[] };
    setSuppliers(data.suppliers || []);
    setLoaded(true);
    setLoading(false);
  };

  const confirmHS = async (productId: string) => {
    if (!newCode.trim()) return;
    await fetch("/api/docs/master-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_hs", product_id: productId, hs_code: newCode.trim() }),
    });
    setConfirmingId(null);
    setNewCode("");
    await loadHistory();
  };

  return (
    <main style={{ fontFamily: "system-ui,sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <a href="/docs/upload" style={{ color: "#5a7899", fontSize: 13, textDecoration: "none", display: "block", marginBottom: 20 }}>← Загрузить документ</a>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>История документов</h1>
        <p style={{ color: "#8899aa", fontSize: 14, marginBottom: 28 }}>Поставщики и товары с подтверждёнными кодами ТН ВЭД</p>

        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <input
            placeholder="Ваш Telegram (@username) или session-key"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadHistory()}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #1e3a5f", background: "#060f1e", color: "#fff", fontSize: 14 }}
          />
          <button
            onClick={loadHistory}
            disabled={loading}
            style={{ padding: "10px 22px", background: "#229ED9", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            {loading ? "Загружаем..." : "Найти"}
          </button>
        </div>

        {loaded && suppliers.length === 0 && (
          <div style={{ textAlign: "center", color: "#5a7899", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            История пуста — загрузите первый документ
          </div>
        )}

        {suppliers.map(s => (
          <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{s.name_en || s.name_cn}</div>
                {s.name_cn && s.name_en && <div style={{ fontSize: 12, color: "#5a7899", marginTop: 2 }}>{s.name_cn}</div>}
                {s.address && <div style={{ fontSize: 12, color: "#5a7899" }}>{s.address}</div>}
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#5a7899" }}>
                <div>Документов: <span style={{ color: "#229ED9", fontWeight: 700 }}>{s.total_docs}</span></div>
                <div>Последний: {new Date(s.last_seen).toLocaleDateString("ru-RU")}</div>
              </div>
            </div>

            {s.products.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: "#5a7899", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Товары</div>
                {s.products.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#060f1e", borderRadius: 8, marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name_ru || p.name_cn}</span>
                      {p.name_cn !== p.name_ru && <span style={{ fontSize: 11, color: "#5a7899", marginLeft: 8 }}>{p.name_cn}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {confirmingId === p.id ? (
                        <>
                          <input
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            placeholder="1234567890"
                            style={{ width: 130, padding: "4px 8px", fontSize: 12, background: "#0a1628", border: "1px solid #229ED9", borderRadius: 6, color: "#fff" }}
                          />
                          <button onClick={() => confirmHS(p.id)} style={{ background: "#00A86B", border: "none", borderRadius: 6, color: "#fff", padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                          <button onClick={() => setConfirmingId(null)} style={{ background: "none", border: "none", color: "#5a7899", cursor: "pointer", fontSize: 14 }}>×</button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: "monospace", fontSize: 13, color: p.hs_confirmed ? "#00A86B" : "#8899aa" }}>
                            {p.hs_code || "—"}
                            {p.hs_confirmed && <span style={{ marginLeft: 4, fontSize: 11 }}>✓</span>}
                          </span>
                          {!p.hs_confirmed && p.hs_code && (
                            <button
                              onClick={() => { setConfirmingId(p.id); setNewCode(p.hs_code); }}
                              style={{ background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.3)", borderRadius: 6, color: "#229ED9", padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
                            >
                              Подтвердить
                            </button>
                          )}
                          <span style={{ fontSize: 11, color: "#3a5575" }}>×{p.times_seen}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
