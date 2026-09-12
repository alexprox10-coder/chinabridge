"use client";

import dynamic from "next/dynamic";

export const DynamicFunnel = dynamic(
  () => import("@/components/ai-funnel/AIEconomicsFunnel"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-10 h-10 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8899aa] text-sm">Загружаем калькулятор…</p>
      </div>
    ),
  }
);

export const DynamicSideBanners = dynamic(
  () => import("@/components/calculator/SideBanners"),
  { ssr: false }
);

export const DynamicLeftPanel = dynamic(
  () => import("@/components/ai-funnel/CalcLeftPanel"),
  { ssr: false, loading: () => null }
);

export const DynamicRightPanel = dynamic(
  () => import("@/components/ai-funnel/CalcRightPanel"),
  { ssr: false, loading: () => null }
);
