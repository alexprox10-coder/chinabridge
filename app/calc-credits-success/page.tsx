"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const PACKAGES: Record<string, { credits: number; label: string }> = {
  pack_1:  { credits: 1,  label: "1 расчёт" },
  pack_5:  { credits: 5,  label: "5 расчётов" },
  pack_20: { credits: 20, label: "20 расчётов" },
};

function SuccessContent() {
  const params   = useSearchParams();
  const pkg      = params.get("pkg") ?? "pack_1";
  const info     = PACKAGES[pkg] ?? PACKAGES.pack_1;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Poll balance until it reflects the new credits (webhook may take a few seconds)
    let attempts = 0;
    const poll = async () => {
      try {
        const r = await fetch("/api/calc/credits/balance");
        const d = await r.json() as { balance?: number };
        if ((d.balance ?? 0) > 0 || attempts >= 10) {
          setBalance(d.balance ?? 0);
          return;
        }
      } catch { /* ignore */ }
      attempts++;
      setTimeout(poll, 1500);
    };
    poll();
  }, []);

  return (
    <main style={{
      background: "#0B1F3A", minHeight: "100vh", color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#0f2644", border: "1px solid #1e3a5f",
        borderRadius: "24px", maxWidth: "440px", width: "100%",
        padding: "40px 32px", textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "rgba(0,168,107,0.15)", border: "2px solid rgba(0,168,107,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: "32px",
        }}>
          ✅
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
          Оплата прошла успешно!
        </h1>
        <p style={{ color: "#8899aa", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
          Вы приобрели <strong style={{ color: "#fff" }}>{info.label}</strong> ChinaBridge Credits.
          Кредиты активны в обоих калькуляторах.
        </p>

        {/* Balance display */}
        <div style={{
          background: "rgba(0,168,107,0.08)", border: "1px solid rgba(0,168,107,0.3)",
          borderRadius: "14px", padding: "16px 20px", marginBottom: "28px",
        }}>
          <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
            Ваш баланс
          </div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "#00A86B" }}>
            {balance === null ? "…" : balance}
          </div>
          <div style={{ color: "#8899aa", fontSize: "12px" }}>расчётов доступно</div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link href="/tools/invoice" style={{
            display: "block", background: "#229ED9", color: "#fff",
            borderRadius: "12px", padding: "13px", fontWeight: 700, fontSize: "14px",
            textDecoration: "none",
          }}>
            Открыть Invoice калькулятор →
          </Link>
          <Link href="/ai-calculator" style={{
            display: "block", background: "rgba(255,255,255,0.06)",
            border: "1px solid #243a5e", color: "#fff",
            borderRadius: "12px", padding: "13px", fontWeight: 600, fontSize: "14px",
            textDecoration: "none",
          }}>
            Открыть AI калькулятор →
          </Link>
        </div>

        <p style={{ color: "#475569", fontSize: "11px", marginTop: "20px", lineHeight: 1.5 }}>
          Кредиты привязаны к вашему браузеру и не имеют срока действия.
          При возникновении вопросов: <a href="https://t.me/ChinaBridgeLID_bot" style={{ color: "#229ED9" }}>@ChinaBridgeLID_bot</a>
        </p>
      </div>
    </main>
  );
}

export default function CalcCreditsSuccessPage() {
  return (
    <Suspense fallback={
      <main style={{ background: "#0B1F3A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8899aa" }}>Загрузка…</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
