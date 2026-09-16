"use client";

import Link from "next/link";
import { analytics } from "@/lib/analytics";

export type CTAType = "CALCULATOR" | "DELIVERY" | "LEAD" | "TELEGRAM";

interface Props {
  type: CTAType;
  country?: "RU" | "KZ";
  vertical?: string;
  page: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

const TgIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.652-.64.135-.954l11.57-4.461c.537-.194 1.006.131.969.06z" />
  </svg>
);

function buildCalcUrl(country?: string, vertical?: string, page?: string) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (vertical) params.set("vertical", vertical);
  if (page) params.set("from", page);
  const qs = params.toString();
  return `/ai-calculator${qs ? `?${qs}` : ""}`;
}

export function PrimaryConversionCTA({ type, country, vertical, page, label, sublabel, className = "" }: Props) {
  const track = (ctaType: string) => {
    analytics.serviceCtaClick({ page, country, vertical, cta_type: ctaType });
  };

  if (type === "CALCULATOR") {
    const href = buildCalcUrl(country, vertical, page);
    return (
      <Link
        href={href}
        onClick={() => { track("calculator"); analytics.calculatorStart(); }}
        className={`flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition shadow-lg shadow-[#00A86B]/20 ${className}`}
      >
        🤖 {label ?? "Рассчитать поставку бесплатно"}
      </Link>
    );
  }

  if (type === "DELIVERY") {
    return (
      <a
        href="https://t.me/ChinaBridgeLID_bot"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { track("delivery"); analytics.deliveryRequestStart({ page, country, vertical }); analytics.telegramClick(); }}
        className={`flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition shadow-lg shadow-[#00A86B]/20 ${className}`}
      >
        🚚 {label ?? "Получить расчёт поставки"}
      </a>
    );
  }

  if (type === "TELEGRAM") {
    return (
      <a
        href="https://t.me/ChinaBridgeLID_bot"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { track("telegram"); analytics.telegramClick(); }}
        className={`flex items-center justify-center gap-2 w-full border border-[#1a3a5c] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white font-medium py-3.5 rounded-xl transition text-sm ${className}`}
      >
        <TgIcon />
        {label ?? "Написать AI-консультанту в Telegram"}
      </a>
    );
  }

  // LEAD — simple form trigger (defaults to calculator)
  const href = buildCalcUrl(country, vertical, page);
  return (
    <Link
      href={href}
      onClick={() => { track("lead"); analytics.calculatorStart(); }}
      className={`flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition shadow-lg shadow-[#00A86B]/20 ${className}`}
    >
      📋 {label ?? "Оставить заявку"}
    </Link>
  );
}

// Sticky bottom mobile CTA — fixed at bottom on mobile
export function StickyMobileCTA({ type = "CALCULATOR", country, vertical, page, label }: Omit<Props, "className">) {
  const calcUrl = buildCalcUrl(country, vertical, page);
  const track = () => analytics.stickyCtaClick({ page, country, vertical });

  if (type === "TELEGRAM") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#060f1e]/97 backdrop-blur border-t border-[#1a2d47] px-4 py-3 safe-bottom">
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { track(); analytics.telegramClick(); }}
          className="flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] text-white font-bold py-3.5 rounded-xl text-sm transition active:scale-95"
        >
          🤖 {label ?? "Получить расчёт бесплатно"}
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#060f1e]/97 backdrop-blur border-t border-[#1a2d47] px-4 py-3 safe-bottom">
      <Link
        href={calcUrl}
        onClick={() => { track(); analytics.calculatorStart(); }}
        className="flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] text-white font-bold py-3.5 rounded-xl text-sm transition active:scale-95"
      >
        🤖 {label ?? "Получить расчёт бесплатно"}
      </Link>
    </div>
  );
}
