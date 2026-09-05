"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

export default function NotFound() {
  useEffect(() => {
    trackGAEvent("page_not_found", {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      event_category: "error",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#040d1a] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 w-16 h-16 rounded-2xl bg-[#00A86B]/15 border border-[#00A86B]/30 flex items-center justify-center">
        <span className="text-3xl">📦</span>
      </div>
      <h1 className="text-5xl font-bold text-white mb-3">404</h1>
      <p className="text-xl font-semibold text-white mb-2">Страница не найдена</p>
      <p className="text-[#8899aa] mb-10 max-w-sm">
        Возможно, ссылка устарела или была перемещена.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
        >
          На главную
        </Link>
        <Link
          href="/#calculator"
          className="px-6 py-3 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white rounded-xl transition-all"
        >
          Рассчитать доставку
        </Link>
      </div>
      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-[#8899aa]">
        <Link href="/delivery" className="hover:text-white transition-colors">Доставка из Китая</Link>
        <Link href="/ai-calculator" className="hover:text-white transition-colors">Калькулятор маржи</Link>
        <Link href="/contacts" className="hover:text-white transition-colors">Контакты</Link>
        <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
      </div>
    </div>
  );
}
