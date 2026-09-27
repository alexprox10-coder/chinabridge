"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Phase = "waiting" | "code_input" | "verifying" | "success" | "no_code" | "error";

export default function InvoiceSuccessPage() {
  const router = useRouter();
  const [phase,   setPhase]   = useState<Phase>("waiting");
  const [code,    setCode]    = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [opId,    setOpId]    = useState("");
  const pollRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const urlOp   = params.get("op") ?? "";
    let storedOp  = "";
    try { storedOp = localStorage.getItem("cb_pending_op_id") ?? ""; } catch { /* ignore */ }
    const op = urlOp || storedOp;
    setOpId(op);

    if (!op) { activateCookieDirect(""); return; }
    startPolling(op);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling(op: string) { pollCount.current = 0; poll(op); }

  function poll(op: string) {
    pollCount.current += 1;
    if (pollCount.current > 30) { activateCookieDirect(op); return; }

    fetch(`/api/calc/payment-status?op=${encodeURIComponent(op)}`)
      .then(r => r.json())
      .then((d: { status?: string; hasTelegram?: boolean }) => {
        if (d.status === "APPROVED" || d.status === "code_sent" || d.status === "auto_verified" || d.status === "verified") {
          if (d.hasTelegram) { setPhase("code_input"); }
          else { activateCookieDirect(op); }
        } else if (d.status === "DECLINED" || d.status === "EXPIRED") {
          setPhase("error");
        } else {
          pollRef.current = setTimeout(() => poll(op), 3000);
        }
      })
      .catch(() => { pollRef.current = setTimeout(() => poll(op), 3000); });
  }

  function activateCookieDirect(op: string) {
    if (op) {
      fetch("/api/auth/calc-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId: op }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            try { localStorage.removeItem("cb_pending_op_id"); } catch { /* ignore */ }
            try { localStorage.setItem("cb_paid_until", d.paidUntil); } catch { /* ignore */ }
            setPhase("success");
            setTimeout(() => router.push("/tools/invoice?pay=success"), 2000);
          } else {
            fetch("/api/calc/check-paid")
              .then(r => r.json())
              .then((pd: { isPaid?: boolean }) => {
                if (pd.isPaid) {
                  setPhase("success");
                  setTimeout(() => router.push("/tools/invoice?pay=success"), 2000);
                } else {
                  setPhase("no_code");
                }
              });
          }
        })
        .catch(() => setPhase("error"));
    } else {
      fetch("/api/calc/check-paid")
        .then(r => r.json())
        .then((d: { isPaid?: boolean }) => {
          if (d.isPaid) {
            setPhase("success");
            setTimeout(() => router.push("/tools/invoice?pay=success"), 2000);
          } else {
            setPhase("error");
          }
        })
        .catch(() => setPhase("error"));
    }
  }

  async function handleVerifyCode() {
    if (code.replace(/\s/g, "").length !== 6) { setCodeErr("Введите 6-значный код"); return; }
    setPhase("verifying"); setCodeErr("");
    try {
      const res  = await fetch("/api/auth/calc-verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ operationId: opId, code: code.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        try { localStorage.removeItem("cb_pending_op_id"); } catch { /* ignore */ }
        try { localStorage.setItem("cb_paid_until", data.paidUntil); } catch { /* ignore */ }
        setPhase("success");
        setTimeout(() => router.push("/tools/invoice?pay=success"), 2500);
      } else {
        setPhase("code_input");
        setCodeErr(
          data.error === "wrong_code"    ? "Неверный код. Проверьте сообщение от бота." :
          data.error === "code_expired"  ? "Код истёк. Обратитесь в поддержку." :
          data.error === "code_not_sent" ? "Код ещё не отправлен. Подождите 10–30 секунд." :
          "Ошибка. Попробуйте ещё раз."
        );
      }
    } catch {
      setPhase("code_input");
      setCodeErr("Ошибка сети. Попробуйте ещё раз.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "360px", background: "#0b1a2e", border: "1px solid #1e3a5f", borderRadius: "20px", padding: "28px", textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#fff" }}>

        {phase === "waiting" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Подтверждаем оплату...</h1>
            <p style={{ fontSize: "14px", color: "#8899aa" }}>Проверяем статус платежа. 5–15 секунд.</p>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "6px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00A86B", animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}

        {phase === "code_input" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Оплата прошла!</h1>
            <p style={{ fontSize: "14px", color: "#8899aa", marginBottom: "20px", lineHeight: 1.6 }}>
              Бот <strong style={{ color: "#fff" }}>@ChinaBridgeLID_bot</strong> отправил вам 6-значный код. Введите его для активации PRO.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="_ _ _ _ _ _"
              maxLength={7}
              value={code}
              onChange={e => { setCode(e.target.value.replace(/[^0-9\s]/g, "")); setCodeErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
              style={{ width: "100%", padding: "14px", background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "12px", color: "#fff", fontSize: "22px", textAlign: "center", fontFamily: "monospace", letterSpacing: "6px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }}
            />
            {codeErr && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "10px" }}>{codeErr}</p>}
            <button
              onClick={handleVerifyCode}
              style={{ width: "100%", padding: "14px", background: "#00A86B", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer", marginBottom: "12px" }}
            >
              Активировать PRO →
            </button>
            <p style={{ fontSize: "11px", color: "#5a7899", lineHeight: 1.6 }}>
              Не получили код?{" "}
              <a href="https://t.me/ChinaBridgeLID_bot?start=calc" target="_blank" rel="noopener noreferrer" style={{ color: "#00A86B" }}>
                @ChinaBridgeLID_bot
              </a>{" "}
              — напишите боту хотя бы одно сообщение, затем{" "}
              <button onClick={() => { setPhase("waiting"); startPolling(opId); }} style={{ background: "none", border: "none", color: "#8899aa", textDecoration: "underline", cursor: "pointer", fontSize: "11px", padding: 0 }}>
                повторите
              </button>.
            </p>
          </>
        )}

        {phase === "verifying" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔑</div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Проверяем код...</h1>
          </>
        )}

        {phase === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>PRO активирован!</h1>
            <p style={{ fontSize: "14px", color: "#8899aa", marginBottom: "4px" }}>Безлимитные распознавания включены на 30 дней.</p>
            <p style={{ fontSize: "12px", color: "#5a7899" }}>Возвращаемся к инструменту...</p>
          </>
        )}

        {(phase === "no_code" || phase === "error") && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
              {phase === "no_code" ? "Оплата получена" : "Что-то пошло не так"}
            </h1>
            <p style={{ fontSize: "14px", color: "#8899aa", marginBottom: "16px" }}>
              {phase === "no_code"
                ? "Оплата зафиксирована. Для активации напишите боту — мы активируем PRO вручную в течение 15 минут."
                : "Платёж мог быть отклонён или истёк. Обратитесь в поддержку."}
            </p>
            <a
              href="https://t.me/ChinaBridgeLID_bot?start=pro_invoice"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", padding: "12px", background: "#229ED9", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}
            >
              Написать в поддержку
            </a>
            <button
              onClick={() => router.push("/tools/invoice")}
              style={{ background: "none", border: "none", color: "#5a7899", fontSize: "12px", textDecoration: "underline", cursor: "pointer" }}
            >
              Вернуться к инструменту
            </button>
          </>
        )}

      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
