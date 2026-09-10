"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Phase = "waiting" | "code_input" | "verifying" | "success" | "no_code" | "error";

export default function CalculatorSuccessPage() {
  const router = useRouter();
  const [phase,   setPhase]   = useState<Phase>("waiting");
  const [code,    setCode]    = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [opId,    setOpId]    = useState("");
  const [hasTg,   setHasTg]   = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    // Read operationId from localStorage (saved by PaywallBlock) or URL ?op=
    const params = new URLSearchParams(window.location.search);
    const urlOp  = params.get("op") ?? "";
    let storedOp = "";
    try { storedOp = localStorage.getItem("cb_pending_op_id") ?? ""; } catch { /* ignore */ }
    const op = urlOp || storedOp;
    setOpId(op);

    if (!op) {
      // No operation ID — just activate via cookie (fallback for old links)
      activateCookieDirect();
      return;
    }

    startPolling(op);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling(op: string) {
    pollCount.current = 0;
    poll(op);
  }

  function poll(op: string) {
    pollCount.current += 1;
    if (pollCount.current > 30) {
      // 30 × 3s = 90s timeout — activate via cookie fallback
      activateCookieDirect();
      return;
    }

    fetch(`/api/calc/payment-status?op=${encodeURIComponent(op)}`)
      .then(r => r.json())
      .then((d: { status?: string; hasTelegram?: boolean }) => {
        if (d.status === "APPROVED" || d.status === "code_sent" || d.status === "verified") {
          setHasTg(!!d.hasTelegram);
          if (d.hasTelegram) {
            setPhase("code_input");
          } else {
            // No telegram — activate via cookie directly
            activateCookieDirect();
          }
        } else if (d.status === "DECLINED" || d.status === "EXPIRED") {
          setPhase("error");
        } else {
          // Still pending — retry
          pollRef.current = setTimeout(() => poll(op), 3000);
        }
      })
      .catch(() => {
        pollRef.current = setTimeout(() => poll(op), 3000);
      });
  }

  function activateCookieDirect() {
    // Fallback: set cookie via set-pro endpoint
    fetch("/api/calc/set-pro", { method: "POST" })
      .then(() => {
        try { localStorage.removeItem("cb_pending_op_id"); } catch { /* ignore */ }
        try { localStorage.setItem("cb_paid_until", new Date(Date.now() + 30 * 86400_000).toISOString()); } catch { /* ignore */ }
        setPhase("success");
        setTimeout(() => router.push("/ai-calculator?pay=success"), 2000);
      })
      .catch(() => setPhase("error"));
  }

  async function handleVerifyCode() {
    if (code.replace(/\s/g, "").length !== 6) {
      setCodeErr("Введите 6-значный код");
      return;
    }
    setPhase("verifying");
    setCodeErr("");

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
        setTimeout(() => router.push("/ai-calculator?pay=success"), 2500);
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
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-6 text-center">

        {phase === "waiting" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <h1 className="text-lg font-bold text-white mb-2">Подтверждаем оплату...</h1>
            <p className="text-sm text-[#8899aa]">Проверяем статус платежа. Это занимает 5–15 секунд.</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00A86B] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}

        {phase === "code_input" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-lg font-bold text-white mb-2">Оплата прошла!</h1>
            <p className="text-sm text-[#8899aa] mb-5 leading-relaxed">
              Бот <span className="text-white font-semibold">@ChinaBridgeLID_bot</span> отправил вам
              6-значный код. Введите его ниже для активации PRO.
            </p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="_ _ _ _ _ _"
              maxLength={7}
              value={code}
              onChange={e => { setCode(e.target.value.replace(/[^0-9\s]/g, "")); setCodeErr(""); }}
              className="w-full px-4 py-3 bg-[#0B1F3A] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl text-white text-xl text-center font-mono tracking-widest outline-none mb-2"
              onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
            />

            {codeErr && <p className="text-xs text-red-400 mb-3">{codeErr}</p>}

            <button
              onClick={handleVerifyCode}
              className="w-full py-3 bg-[#00A86B] hover:bg-[#009560] text-white font-semibold rounded-xl transition-colors mb-3"
            >
              Активировать PRO →
            </button>

            <p className="text-[10px] text-[#5a7899] leading-relaxed">
              Не получили код? Убедитесь, что написали боту{" "}
              <a
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00A86B] underline"
              >
                @ChinaBridgeLID_bot
              </a>{" "}
              хотя бы одно сообщение (для разблокировки), затем{" "}
              <button onClick={() => { setPhase("waiting"); startPolling(opId); }} className="underline">
                повторите
              </button>.
            </p>
          </>
        )}

        {phase === "verifying" && (
          <>
            <div className="text-4xl mb-4 animate-spin">🔑</div>
            <h1 className="text-lg font-bold text-white mb-2">Проверяем код...</h1>
            <p className="text-sm text-[#8899aa]">Секунду...</p>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-white mb-2">PRO активирован!</h1>
            <p className="text-sm text-[#8899aa] mb-1">Безлимитные расчёты включены на 30 дней.</p>
            <p className="text-xs text-[#5a7899]">Переходим к калькулятору...</p>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-lg font-bold text-white mb-2">Что-то пошло не так</h1>
            <p className="text-sm text-[#8899aa] mb-4">Платёж мог быть отклонён или истёк. Обратитесь в поддержку.</p>
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 bg-[#229ED9] text-white text-sm font-semibold rounded-xl text-center"
            >
              Написать в поддержку
            </a>
            <button
              onClick={() => router.push("/ai-calculator")}
              className="mt-3 text-xs text-[#5a7899] underline"
            >
              Вернуться к калькулятору
            </button>
          </>
        )}

      </div>
    </div>
  );
}
