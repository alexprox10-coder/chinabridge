"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SUBSCRIPTION_DAYS = 30;

export default function CalculatorSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    (async () => {
      try {
        // Activate server-side subscription (writes to Neon for logged-in users)
        const res = await fetch("/api/payments/activate-subscription", { method: "POST" });
        const data = await res.json();

        // Reset server-side IP rate limit + set anon paid cookie for bypass
        await Promise.allSettled([
          fetch("/api/calc/reset", { method: "POST" }),
          fetch("/api/calc/activate-anon", { method: "POST" }),
        ]);

        // Always set localStorage as fallback
        const until = new Date();
        until.setDate(until.getDate() + SUBSCRIPTION_DAYS);
        try {
          localStorage.setItem("cb_paid_until", until.toISOString());
          localStorage.removeItem("cb_paywall_active");
          localStorage.removeItem("cb_calc_uses");
        } catch { /* ignore */ }

        // Notify manager in Telegram
        try {
          const tgMsg = data.clientId
            ? `💳 <b>Оплата PRO-подписки</b>\n\n✅ Клиент: ${data.clientId}\n💰 1 990 ₽/мес\n📅 до: ${until.toLocaleDateString("ru-RU")}`
            : `💳 <b>Оплата PRO-подписки (анон)</b>\n\n💰 1 990 ₽/мес\n📅 до: ${until.toLocaleDateString("ru-RU")}`;
          fetch("/api/telegram/lid-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _internal_notify: tgMsg }),
          }).catch(() => {});
        } catch { /* ignore */ }

        setStatus("ok");

        // Countdown then redirect to calculator (always — not dashboard)
        let c = 4;
        setCountdown(c);
        const t = setInterval(() => {
          c -= 1;
          setCountdown(c);
          if (c <= 0) {
            clearInterval(t);
            router.push("/ai-calculator?pay=ok");
          }
        }, 1000);
        return () => clearInterval(t);
      } catch {
        setStatus("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-4">
      <div className="card-glass rounded-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-[#00A86B]/30 border-t-[#00A86B] animate-spin" />
            <p className="text-sm text-[#8899aa]">Активируем подписку...</p>
          </>
        )}
        {status === "ok" && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-5xl">✅</div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Оплата прошла!</h1>
              <p className="text-[#00A86B] font-semibold text-base mb-1">PRO-подписка активна 30 дней</p>
              <p className="text-sm text-[#8899aa]">Безлимитные расчёты включены прямо сейчас.</p>
            </div>

            <div className="w-full rounded-xl bg-[#00A86B]/10 border border-[#00A86B]/30 p-4 text-left space-y-1.5">
              {["Безлимитные расчёты AI-калькулятора", "AI-анализ ссылок с 1688 / Alibaba", "История расчётов и сохранение", "Все маркетплейсы: WB, Ozon, Kaspi"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-[#00A86B] text-xs">✓</span>
                  <span className="text-white">{f}</span>
                </div>
              ))}
            </div>

            <a
              href="/ai-calculator?pay=ok"
              className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl text-sm transition-colors"
            >
              Открыть калькулятор →
            </a>

            <p className="text-xs text-[#5a7899]">
              Автоматический переход через {countdown} сек...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">⚠️</div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Что-то пошло не так</h1>
              <p className="text-sm text-[#8899aa]">Напишите нам — вручную активируем доступ.</p>
            </div>
            <a href="https://t.me/ChinaBridgeLID_bot" className="bg-[#229ED9] text-white font-bold px-6 py-3 rounded-xl text-sm">
              Написать в Telegram
            </a>
          </>
        )}
      </div>
    </div>
  );
}
