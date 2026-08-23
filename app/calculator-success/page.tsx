"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SUBSCRIPTION_DAYS = 30;

export default function CalculatorSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    // Активируем подписку в localStorage на 30 дней
    const until = new Date();
    until.setDate(until.getDate() + SUBSCRIPTION_DAYS);
    localStorage.setItem("cb_paid_until", until.toISOString());
    setStatus("ok");

    const t = setTimeout(() => router.push("/ai-calculator"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-4">
      <div className="card-glass rounded-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        {status === "loading" && (
          <div className="w-16 h-16 rounded-full border-2 border-[#00A86B]/30 border-t-[#00A86B] animate-spin" />
        )}
        {status === "ok" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-4xl">
              ✅
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Оплата прошла!</h1>
              <p className="text-sm text-[#8899aa]">
                Подписка активна на 30 дней. Безлимитные расчёты включены.
              </p>
            </div>
            <p className="text-xs text-[#5a7899]">Перенаправляем на калькулятор...</p>
          </>
        )}
      </div>
    </div>
  );
}
