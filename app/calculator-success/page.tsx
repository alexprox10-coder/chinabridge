"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SUBSCRIPTION_DAYS = 30;

export default function CalculatorSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Activate server-side subscription (writes to Neon for logged-in users)
        const res = await fetch("/api/payments/activate-subscription", { method: "POST" });
        const data = await res.json();
        setIsLoggedIn(!!data.clientId);

        // Reset server-side IP rate limit + set anon paid cookie for bypass
        fetch("/api/calc/reset", { method: "POST" }).catch(() => {});
        fetch("/api/calc/activate-anon", { method: "POST" }).catch(() => {});

        // Always set localStorage as fallback
        const until = new Date();
        until.setDate(until.getDate() + SUBSCRIPTION_DAYS);
        localStorage.setItem("cb_paid_until", until.toISOString());
        localStorage.removeItem("cb_paywall_active");
        localStorage.removeItem("cb_calc_uses");

        setStatus("ok");

        // Redirect: logged-in → ЛК dashboard, anonymous → calculator
        const target = data.clientId ? "/client/dashboard?subscribed=calculator" : "/ai-calculator";
        setTimeout(() => router.push(target), 3000);
      } catch {
        setStatus("error");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-4">
      <div className="card-glass rounded-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        {status === "loading" && (
          <div className="w-16 h-16 rounded-full border-2 border-[#00A86B]/30 border-t-[#00A86B] animate-spin" />
        )}
        {status === "ok" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-4xl">✅</div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Оплата прошла!</h1>
              <p className="text-sm text-[#8899aa]">
                Подписка активна на 30 дней. Безлимитные расчёты включены.
              </p>
            </div>
            <p className="text-xs text-[#5a7899]">
              {isLoggedIn
                ? "Перенаправляем в личный кабинет..."
                : "Перенаправляем на калькулятор..."}
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
