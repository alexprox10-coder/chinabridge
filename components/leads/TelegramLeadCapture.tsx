"use client";
import { useState, useEffect } from "react";

interface Props {
  source: "wb-margin-calculator" | "delivery-calculator";
  contextHint?: string; // e.g. "Ваш расчёт маржи WB"
}

const STORAGE_KEY = "cb_tg_captured";

export function TelegramLeadCapture({ source, contextHint }: Props) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setDismissed(!!localStorage.getItem(STORAGE_KEY));
    }
  }, []);

  if (!mounted || dismissed) return null;

  const handleSubmit = async () => {
    const clean = username.trim().replace(/^@/, "");
    if (!clean || clean.length < 3) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads/telegram-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean, source, contextHint }),
      });
      if (res.ok) {
        setStatus("done");
        localStorage.setItem(STORAGE_KEY, "1");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-6 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-2xl p-5 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-white font-semibold text-sm">Готово! Проверьте Telegram</p>
        <p className="text-[#8899aa] text-xs mt-1">
          Менеджер напишет вам в течение 15 минут с деталями расчёта
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-[#0d1b2e] border border-[#243a5e] hover:border-[#00A86B]/30 transition-colors rounded-2xl p-5 relative">
      <button
        onClick={() => { setDismissed(true); localStorage.setItem(STORAGE_KEY, "1"); }}
        className="absolute top-3 right-3 text-[#5a7899] hover:text-white text-xs"
      >
        ✕
      </button>

      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📬</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm mb-0.5">
            Получите расчёт в Telegram + гайд бесплатно
          </p>
          <p className="text-[#8899aa] text-xs mb-4 leading-relaxed">
            {contextHint
              ? `Отправим ${contextHint} с детальным разбором таможни и маршрутов`
              : "Отправим детальный расчёт с учётом пошлин и оптимального маршрута"
            }{" "}
            — плюс гайд «Как сэкономить 20% на доставке из Китая».
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a7899] text-sm">@</span>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full pl-7 pr-3 py-2.5 bg-[#0B1F3A] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl text-sm text-white placeholder:text-[#5a7899] outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={status === "loading" || username.trim().length < 3}
              className="px-4 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Получить →"}
            </button>
          </div>

          {status === "error" && (
            <p className="text-red-400 text-xs mt-2">Ошибка. Попробуйте ещё раз.</p>
          )}

          <p className="text-[#5a7899] text-xs mt-3">
            Нажимая кнопку, вы соглашаетесь на обработку данных.
            Без спама — только расчёт и один гайд.
          </p>
        </div>
      </div>
    </div>
  );
}
