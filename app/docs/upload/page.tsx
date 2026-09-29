"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const FREE_LIMIT = 3;

const STEPS = [
  "Читаем документ...",
  "Определяем коды ТН ВЭД...",
  "Рассчитываем пошлины...",
  "Проверяем на ошибки...",
  "Формируем пакет документов...",
];

// ── Paywall modal ─────────────────────────────────────────────────────────────
function DocsPaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: 20, maxWidth: 420, width: "100%", overflow: "hidden" }}>

        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1e3a5f", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#5a7899", fontSize: 20, cursor: "pointer" }}>×</button>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Бесплатные анализы исчерпаны</div>
          <p style={{ color: "#8899aa", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Вы использовали {FREE_LIMIT} бесплатных анализа. Оформите подписку ChinaBridge Docs для неограниченного использования.
          </p>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Plans */}
          {[
            { name: "Старт", price: "2 990 ₽/мес", desc: "до 10 документов", color: "#229ED9" },
            { name: "Про", price: "7 990 ₽/мес", desc: "до 50 документов", color: "#00A86B" },
            { name: "Брокер", price: "19 990 ₽/мес", desc: "безлимит + API", color: "#f59e0b" },
          ].map(p => (
            <a key={p.name} href="https://t.me/chinabridge_pay_bot" target="_blank" rel="noopener noreferrer"
              style={{ display: "block", background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}33`, borderRadius: 12, padding: "12px 16px", textDecoration: "none", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <span style={{ color: "#64748b", fontSize: 11, marginLeft: 8 }}>— {p.desc}</span>
                </div>
                <span style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>{p.price}</span>
              </div>
            </a>
          ))}

          <a href="https://t.me/chinabridge_pay_bot" target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", background: "#229ED9", color: "#fff", fontWeight: 700, fontSize: 14, padding: 13, borderRadius: 10, textDecoration: "none", marginTop: 4 }}>
            Оформить подписку в Telegram →
          </a>

          <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", color: "#00A86B", fontSize: 13, textDecoration: "none", padding: "4px 0" }}>
            Есть вопросы? Написать менеджеру
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DocsUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [country, setCountry] = useState<"RU" | "KZ">("RU");
  const [marketplace, setMarketplace] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [freeLeft, setFreeLeft] = useState<number>(FREE_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);

  // Fetch current usage from server on mount
  useEffect(() => {
    fetch("/api/docs/check-access")
      .then(r => r.json())
      .then((d: { free_left?: number }) => {
        if (typeof d.free_left === "number") setFreeLeft(d.free_left);
      })
      .catch(() => null);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;

    // Client-side guard: show paywall if already at limit
    if (freeLeft <= 0) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setError("");
    setStep(0);

    const interval = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 8000);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("country", country);
    fd.append("marketplace", marketplace);
    fd.append("telegram", telegram);

    try {
      const res = await fetch("/api/docs/upload", { method: "POST", body: fd });
      const data = await res.json() as { success?: boolean; doc_id?: string; error?: string; free_left?: number };
      clearInterval(interval);

      if (res.status === 402) {
        setFreeLeft(0);
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (data.success && data.doc_id) {
        if (typeof data.free_left === "number") setFreeLeft(data.free_left);
        router.push(`/docs/result/${data.doc_id}`);
      } else {
        setError(data.error || "Ошибка обработки. Попробуйте ещё раз.");
        setLoading(false);
      }
    } catch (e) {
      clearInterval(interval);
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px" }}>
      {showPaywall && <DocsPaywallModal onClose={() => setShowPaywall(false)} />}

      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Back */}
        <a href="/docs" style={{ color: "#5a7899", fontSize: 13, textDecoration: "none", display: "block", marginBottom: 24 }}>← ChinaBridge Docs</a>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Загрузить документ</h1>
        <p style={{ fontSize: 14, color: "#8899aa", marginBottom: 32 }}>
          Фото инвойса, скрин WeChat, PDF — AI прочитает и подготовит таможенный пакет
        </p>

        {/* Free counter */}
        {freeLeft > 0 ? (
          <div style={{ background: "rgba(34,158,217,0.08)", border: "1px solid rgba(34,158,217,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#8899aa" }}>
            Бесплатно осталось: <span style={{ color: "#229ED9", fontWeight: 700 }}>{freeLeft} из {FREE_LIMIT}</span> · Результаты не сохраняются
          </div>
        ) : (
          <div onClick={() => setShowPaywall(true)} style={{ background: "rgba(200,0,0,0.1)", border: "1px solid rgba(200,0,0,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#f87171", cursor: "pointer" }}>
            🔒 Бесплатные анализы исчерпаны — <span style={{ textDecoration: "underline" }}>оформить подписку</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#229ED9" : file ? "#00A86B" : "#1e3a5f"}`,
            borderRadius: 16,
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(34,158,217,0.08)" : file ? "rgba(0,168,107,0.08)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s",
            marginBottom: 24,
          }}
        >
          {file ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: "#8899aa" }}>{(file.size / 1024 / 1024).toFixed(2)} МБ</div>
              <div style={{ fontSize: 12, color: "#00A86B", marginTop: 6 }}>✓ Файл выбран — нажмите снова чтобы изменить</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Перетащите файл или нажмите для выбора</div>
              <div style={{ fontSize: 12, color: "#5a7899" }}>JPG, PNG, WEBP, HEIC, PDF · до 20 МБ</div>
            </>
          )}
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
        </div>

        {/* Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>

          {/* Country */}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#8899aa", marginBottom: 8, fontWeight: 600 }}>Страна назначения</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["RU", "KZ"] as const).map((c) => (
                <button key={c} onClick={() => setCountry(c)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${country === c ? "#229ED9" : "#1e3a5f"}`,
                  background: country === c ? "rgba(34,158,217,0.15)" : "transparent",
                  color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
                }}>
                  {c === "RU" ? "🇷🇺 Россия" : "🇰🇿 Казахстан"}
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#8899aa", marginBottom: 8, fontWeight: 600 }}>
              Маркетплейс <span style={{ fontWeight: 400 }}>(опционально)</span>
            </label>
            <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #1e3a5f", background: "#060f1e", color: "#fff", fontSize: 14,
            }}>
              <option value="">Не указывать</option>
              <option value="wb">Wildberries</option>
              <option value="ozon">Ozon</option>
              <option value="kaspi">Kaspi.kz</option>
            </select>
          </div>

          {/* Telegram */}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#8899aa", marginBottom: 8, fontWeight: 600 }}>
              Telegram <span style={{ fontWeight: 400 }}>(для уведомления о готовности)</span>
            </label>
            <input
              type="text"
              placeholder="@username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #1e3a5f", background: "#060f1e", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(200,0,0,0.15)", border: "1px solid rgba(200,0,0,0.4)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#f88" }}>
            ❌ {error}
          </div>
        )}

        {/* Loading progress */}
        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "#229ED9" }}>{STEPS[step]}</span>
              <span style={{ color: "#5a7899" }}>шаг {step + 1}/{STEPS.length}</span>
            </div>
            <div style={{ height: 4, background: "#1e3a5f", borderRadius: 2 }}>
              <div style={{ height: "100%", background: "#229ED9", borderRadius: 2, width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 1s ease" }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{
            width: "100%", padding: "16px", background: !file || loading ? "#1e3a5f" : freeLeft <= 0 ? "#f59e0b" : "#229ED9",
            color: !file || loading ? "#5a7899" : "#fff",
            border: "none", borderRadius: 14, fontWeight: 700, fontSize: 16,
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Обрабатываем документ..." : freeLeft <= 0 ? "🔒 Оформить подписку" : "🔍 Проанализировать документ"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#5a7899", marginTop: 12 }}>
          {freeLeft > 0
            ? `${freeLeft} из ${FREE_LIMIT} бесплатных анализов · ~60 секунд обработки`
            : "Подписка от 2 990 ₽/мес · Без ограничений"}
        </p>

      </div>
    </main>
  );
}
