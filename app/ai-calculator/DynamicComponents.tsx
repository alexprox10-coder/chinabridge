"use client";

import dynamic from "next/dynamic";

export const DynamicFunnel = dynamic(
  () => import("@/components/ai-funnel/AIEconomicsFunnel"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8899aa] text-sm">Загружаем калькулятор…</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3 text-center">
          <p className="text-xs text-[#556677]">Не хотите ждать?</p>
          <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl text-sm transition-all">
            🚀 Написать менеджеру в Telegram
          </a>
          <p className="text-[10px] text-[#445566]">Ответим за 5 минут · рассчитаем маржу бесплатно</p>
        </div>
      </div>
    ),
  }
);

export const DynamicSideBanners = dynamic(
  () => import("@/components/calculator/SideBanners"),
  { ssr: false }
);
