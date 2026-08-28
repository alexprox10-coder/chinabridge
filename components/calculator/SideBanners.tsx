"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LEFT_BANNERS = [
  {
    href: "/delivery-calculator",
    emoji: "🚢",
    title: "Расчёт доставки",
    sub: "Из Китая за 30 сек",
    color: "#00A86B",
    delay: 0,
  },
  {
    href: "/supplier-finder",
    emoji: "🔍",
    title: "Найти поставщика",
    sub: "AI поиск на 1688",
    color: "#229ED9",
    delay: 150,
  },
  {
    href: "/kaspi-china",
    emoji: "🇰🇿",
    title: "Kaspi из Китая",
    sub: "Доставка в КЗ",
    color: "#f59e0b",
    delay: 300,
  },
];

const RIGHT_BANNERS = [
  {
    href: "https://t.me/ChinaBridgeLID_bot?start=calc",
    external: true,
    emoji: "💬",
    title: "Консультация",
    sub: "Ответ за 5 минут",
    color: "#229ED9",
    delay: 0,
  },
  {
    href: "/fulfilment",
    emoji: "📦",
    title: "Фулфилмент",
    sub: "WB · Ozon · Kaspi",
    color: "#00A86B",
    delay: 150,
  },
  {
    href: "/import-china-kazakhstan",
    emoji: "✈️",
    title: "Импорт под ключ",
    sub: "Таможня включена",
    color: "#a78bfa",
    delay: 300,
  },
];

interface Banner {
  href: string;
  external?: boolean;
  emoji: string;
  title: string;
  sub: string;
  color: string;
  delay: number;
}

function BannerCard({ b, visible }: { b: Banner; visible: boolean }) {
  const style = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(-20px)",
    transition: `opacity 0.5s ease ${b.delay}ms, transform 0.5s ease ${b.delay}ms`,
  };

  const inner = (
    <div
      className="group flex items-center gap-2.5 bg-[#0B1F3A]/90 border border-white/8 hover:border-white/20 rounded-xl px-3 py-2.5 cursor-pointer backdrop-blur-sm w-[160px] hover:shadow-lg transition-all duration-200"
      style={{
        boxShadow: `0 0 0 0 ${b.color}00`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 18px 2px ${b.color}33`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${b.color}55`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ background: `${b.color}22`, border: `1px solid ${b.color}44` }}
      >
        {b.emoji}
      </div>
      <div className="min-w-0">
        <p className="text-white text-[11px] font-semibold leading-tight truncate group-hover:text-white transition-colors">{b.title}</p>
        <p className="text-[#8899aa] text-[10px] leading-tight truncate">{b.sub}</p>
      </div>
    </div>
  );

  if (b.external) {
    return (
      <a href={b.href} target="_blank" rel="noopener noreferrer" style={style} className="block">
        {inner}
      </a>
    );
  }

  return (
    <Link href={b.href} style={style} className="block">
      {inner}
    </Link>
  );
}

export default function SideBanners() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Left side */}
      <div className="hidden xl:flex fixed left-4 2xl:left-8 top-1/2 -translate-y-1/2 flex-col gap-2.5 z-20">
        <p className="text-[9px] text-[#5a7899] uppercase tracking-widest mb-1 text-center">Услуги</p>
        {LEFT_BANNERS.map(b => (
          <BannerCard key={b.href} b={b} visible={visible} />
        ))}
      </div>

      {/* Right side */}
      <div className="hidden xl:flex fixed right-4 2xl:right-8 top-1/2 -translate-y-1/2 flex-col gap-2.5 z-20">
        <p className="text-[9px] text-[#5a7899] uppercase tracking-widest mb-1 text-center">Помощь</p>
        {RIGHT_BANNERS.map(b => (
          <BannerCard key={b.href} b={{ ...b, delay: b.delay + 400 }} visible={visible} />
        ))}
      </div>
    </>
  );
}
