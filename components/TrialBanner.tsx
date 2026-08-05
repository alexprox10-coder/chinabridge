"use client";
import { useEffect, useState } from "react";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    // Read trial start from cookie
    const match = document.cookie.match(/cb_trial_start=([^;]+)/);
    if (!match) return;
    const start = new Date(decodeURIComponent(match[1]));
    const trialEnd = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff);
  }, []);

  if (daysLeft === null || daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 3;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
      isUrgent
        ? "bg-red-900/50 border-b border-red-700/60 text-red-200"
        : "bg-amber-900/30 border-b border-amber-700/40 text-amber-200"
    }`}>
      <div className="flex items-center gap-2">
        <span>{isUrgent ? "⚠️" : "⏰"}</span>
        <span>
          {isUrgent
            ? `Пробный период заканчивается через ${daysLeft} дн. — обновите тариф, чтобы не потерять данные`
            : `Пробный период: осталось ${daysLeft} из 14 дней`}
        </span>
      </div>
      <a href="/settings/billing"
        className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
          isUrgent
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white"
        }`}>
        Выбрать тариф →
      </a>
    </div>
  );
}
