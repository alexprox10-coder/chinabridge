"use client";

import dynamic from "next/dynamic";

export const DynamicFunnel = dynamic(
  () => import("@/components/ai-funnel/AIEconomicsFunnel"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8899aa] text-sm">Загружаем калькулятор…</p>
        </div>
      </div>
    ),
  }
);

export const DynamicSideBanners = dynamic(
  () => import("@/components/calculator/SideBanners"),
  { ssr: false }
);
