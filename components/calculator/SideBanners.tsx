"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─── Left banners ─────────────────────────────────────────────────────────── */
function DeliveryBanner({ visible }: { visible: boolean }) {
  return (
    <Link href="/delivery-calculator"
      className="block w-[200px] rounded-2xl overflow-hidden border border-[#00A86B]/30 hover:border-[#00A86B]/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,168,107,0.25)] group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) scale(1)" : "translateX(-30px) scale(0.95)",
        transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
        background: "linear-gradient(145deg, #0d2137 0%, #0B1F3A 60%, #0d2a1f 100%)",
      }}
    >
      {/* Illustration area */}
      <div className="relative h-[110px] overflow-hidden" style={{ background: "linear-gradient(135deg, #00A86B22, #00d48a11)" }}>
        {/* Animated ship */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2" style={{ animation: "float 3s ease-in-out infinite" }}>
          <svg width="90" height="55" viewBox="0 0 90 55" fill="none">
            {/* Water */}
            <ellipse cx="45" cy="50" rx="44" ry="6" fill="#00A86B" opacity="0.2"/>
            {/* Hull */}
            <path d="M10 35 Q45 45 80 35 L75 42 Q45 50 15 42 Z" fill="#00A86B" opacity="0.8"/>
            {/* Body */}
            <rect x="18" y="20" width="54" height="17" rx="4" fill="#00A86B" opacity="0.6"/>
            {/* Cabin */}
            <rect x="28" y="10" width="25" height="13" rx="3" fill="#00d48a" opacity="0.7"/>
            {/* Windows */}
            <circle cx="34" cy="16" r="2.5" fill="white" opacity="0.8"/>
            <circle cx="42" cy="16" r="2.5" fill="white" opacity="0.8"/>
            <circle cx="50" cy="16" r="2.5" fill="white" opacity="0.8"/>
            {/* Chimney */}
            <rect x="56" y="7" width="6" height="12" rx="2" fill="#243a5e"/>
            {/* Smoke */}
            <circle cx="59" cy="5" r="3" fill="white" opacity="0.3" style={{ animation: "smokeRise 2s ease-in-out infinite" }}/>
            <circle cx="62" cy="2" r="2" fill="white" opacity="0.2" style={{ animation: "smokeRise 2s ease-in-out infinite 0.5s" }}/>
            {/* Flag */}
            <rect x="27" y="4" width="1.5" height="8" fill="#8899aa"/>
            <path d="M29 4 L36 6.5 L29 9 Z" fill="#00A86B"/>
            {/* Containers on deck */}
            <rect x="22" y="22" width="10" height="8" rx="1" fill="#229ED9" opacity="0.8"/>
            <rect x="34" y="22" width="10" height="8" rx="1" fill="#f59e0b" opacity="0.8"/>
            <rect x="46" y="22" width="10" height="8" rx="1" fill="#00A86B" opacity="0.9"/>
          </svg>
        </div>
        {/* Waves */}
        <div className="absolute bottom-0 left-0 right-0 h-3" style={{ background: "linear-gradient(0deg, #00A86B15, transparent)" }}/>
        {/* China flag */}
        <div className="absolute top-2 left-3 text-lg">🇨🇳</div>
        <div className="absolute top-2 right-3 text-base">→ 🇷🇺</div>
        {/* Time badge */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#00A86B]/20 border border-[#00A86B]/40 rounded-full px-2 py-0.5">
          <p className="text-[9px] text-[#00A86B] font-bold">⚡ 25-35 дней</p>
        </div>
      </div>
      {/* Text */}
      <div className="px-3 py-3">
        <p className="text-white font-bold text-sm leading-tight">Доставка из Китая</p>
        <p className="text-[#8899aa] text-[11px] mt-0.5 leading-tight">Карго · авиа · море · ж/д</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[#00A86B] text-[11px] font-semibold">от 3 USD/кг</p>
          <span className="text-[10px] text-[#00A86B] group-hover:translate-x-1 transition-transform inline-block">→</span>
        </div>
      </div>
    </Link>
  );
}

function SupplierBanner({ visible }: { visible: boolean }) {
  return (
    <Link href="/supplier-finder"
      className="block w-[200px] rounded-2xl overflow-hidden border border-[#229ED9]/30 hover:border-[#229ED9]/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,158,217,0.25)] group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) scale(1)" : "translateX(-30px) scale(0.95)",
        transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
        background: "linear-gradient(145deg, #0d1e30 0%, #0B1F3A 60%, #0d1e2d 100%)",
      }}
    >
      <div className="relative h-[100px] overflow-hidden" style={{ background: "linear-gradient(135deg, #229ED922, #1a8bc411)" }}>
        {/* Search animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-2 border-[#229ED9]/30" style={{ animation: "ping 2s ease-in-out infinite", width: 64, height: 64, left: -8, top: -8 }}/>
            <div className="absolute inset-0 rounded-full border border-[#229ED9]/20" style={{ animation: "ping 2s ease-in-out infinite 0.5s", width: 80, height: 80, left: -16, top: -16 }}/>
            {/* Main icon */}
            <div className="w-12 h-12 rounded-full bg-[#229ED9]/20 border border-[#229ED9]/40 flex items-center justify-center text-2xl">
              🏭
            </div>
          </div>
        </div>
        {/* Supplier cards floating */}
        <div className="absolute top-1.5 left-2 bg-[#229ED9]/15 border border-[#229ED9]/30 rounded-lg px-2 py-1" style={{ animation: "floatLeft 4s ease-in-out infinite" }}>
          <p className="text-[8px] text-[#229ED9] font-bold">⭐ 4.9 Alibaba</p>
        </div>
        <div className="absolute bottom-2 right-2 bg-[#229ED9]/15 border border-[#229ED9]/30 rounded-lg px-2 py-1" style={{ animation: "floatRight 4s ease-in-out infinite 1s" }}>
          <p className="text-[8px] text-[#229ED9] font-bold">✓ Gold Supplier</p>
        </div>
      </div>
      <div className="px-3 py-3">
        <p className="text-white font-bold text-sm leading-tight">Найти поставщика</p>
        <p className="text-[#8899aa] text-[11px] mt-0.5">AI поиск на 1688 · Alibaba</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[#229ED9] text-[11px] font-semibold">Бесплатно</p>
          <span className="text-[10px] text-[#229ED9] group-hover:translate-x-1 transition-transform inline-block">→</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Right banners ─────────────────────────────────────────────────────────── */
function ConsultBanner({ visible }: { visible: boolean }) {
  return (
    <a href="https://t.me/ChinaBridgeLID_bot?start=calc" target="_blank" rel="noopener noreferrer"
      className="block w-[200px] rounded-2xl overflow-hidden border border-[#229ED9]/30 hover:border-[#229ED9]/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,158,217,0.3)] group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) scale(1)" : "translateX(30px) scale(0.95)",
        transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
        background: "linear-gradient(145deg, #0d1e30 0%, #0B1F3A 60%, #0d1d2e 100%)",
      }}
    >
      <div className="relative h-[110px] overflow-hidden" style={{ background: "linear-gradient(135deg, #229ED922, #1a8bc411)" }}>
        {/* Chat bubbles animation */}
        <div className="absolute inset-0 p-3 flex flex-col gap-1.5 justify-center">
          <div className="self-start bg-[#229ED9]/20 border border-[#229ED9]/30 rounded-2xl rounded-tl-sm px-2.5 py-1.5 max-w-[80%]" style={{ animation: "bubbleIn 0.5s ease 0.3s both" }}>
            <p className="text-[9px] text-white leading-tight">Какой товар везёте?</p>
          </div>
          <div className="self-end bg-[#00A86B]/20 border border-[#00A86B]/30 rounded-2xl rounded-tr-sm px-2.5 py-1.5 max-w-[80%]" style={{ animation: "bubbleIn 0.5s ease 0.8s both" }}>
            <p className="text-[9px] text-white leading-tight">Кроссовки, 500 шт</p>
          </div>
          <div className="self-start bg-[#229ED9]/20 border border-[#229ED9]/30 rounded-2xl rounded-tl-sm px-2.5 py-1.5 max-w-[90%]" style={{ animation: "bubbleIn 0.5s ease 1.3s both" }}>
            <p className="text-[9px] text-white leading-tight">Доставим за 28 дней 🚢</p>
          </div>
        </div>
        {/* Online indicator */}
        <div className="absolute top-2 right-3 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" style={{ animation: "pulse 2s infinite" }}/>
          <p className="text-[8px] text-[#00A86B]">онлайн</p>
        </div>
      </div>
      <div className="px-3 py-3">
        <p className="text-white font-bold text-sm leading-tight">Написать менеджеру</p>
        <p className="text-[#8899aa] text-[11px] mt-0.5">Ответ в течение 5 минут</p>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#229ED9]/20 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#229ED9"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
          </div>
          <p className="text-[#229ED9] text-[11px] font-semibold">Telegram</p>
          <span className="ml-auto text-[10px] text-[#229ED9] group-hover:translate-x-1 transition-transform inline-block">→</span>
        </div>
      </div>
    </a>
  );
}

function FulfilmentBanner({ visible }: { visible: boolean }) {
  return (
    <Link href="/fulfilment"
      className="block w-[200px] rounded-2xl overflow-hidden border border-[#a78bfa]/30 hover:border-[#a78bfa]/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(167,139,250,0.25)] group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) scale(1)" : "translateX(30px) scale(0.95)",
        transition: "opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s",
        background: "linear-gradient(145deg, #1a1030 0%, #0B1F3A 60%, #15102b 100%)",
      }}
    >
      <div className="relative h-[100px] overflow-hidden" style={{ background: "linear-gradient(135deg, #a78bfa22, #7c3aed11)" }}>
        {/* Warehouse boxes animation */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          {[
            { size: 28, color: "#a78bfa", delay: "0s", x: -28 },
            { size: 36, color: "#7c3aed", delay: "0.3s", x: 0 },
            { size: 24, color: "#a78bfa", delay: "0.6s", x: 28 },
          ].map((box, i) => (
            <div key={i} className="absolute bottom-2" style={{ left: `calc(50% + ${box.x}px - ${box.size/2}px)`, animation: `floatBox 3s ease-in-out infinite ${box.delay}` }}>
              <svg width={box.size} height={box.size} viewBox="0 0 40 40">
                <rect x="2" y="12" width="36" height="26" rx="3" fill={box.color} opacity="0.7"/>
                <path d="M2 12 L20 4 L38 12" fill={box.color} opacity="0.9"/>
                <line x1="20" y1="4" x2="20" y2="38" stroke="white" strokeWidth="1" opacity="0.3"/>
                <rect x="12" y="20" width="16" height="5" rx="1.5" fill="white" opacity="0.4"/>
              </svg>
            </div>
          ))}
        </div>
        {/* Labels */}
        <div className="absolute top-2 left-2 flex gap-1">
          {["WB", "Ozon", "KZ"].map(mp => (
            <div key={mp} className="bg-[#a78bfa]/20 border border-[#a78bfa]/40 rounded px-1.5 py-0.5">
              <p className="text-[8px] text-[#a78bfa] font-bold">{mp}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-3">
        <p className="text-white font-bold text-sm leading-tight">Фулфилмент</p>
        <p className="text-[#8899aa] text-[11px] mt-0.5">Хранение · сборка · отгрузка</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[#a78bfa] text-[11px] font-semibold">от 25 ₽/ед.</p>
          <span className="text-[10px] text-[#a78bfa] group-hover:translate-x-1 transition-transform inline-block">→</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── CSS keyframes injected once ──────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(-50%); }
  50%       { transform: translateY(-6px) translateX(-50%); }
}
@keyframes floatLeft {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}
@keyframes floatRight {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(4px); }
}
@keyframes floatBox {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
@keyframes bubbleIn {
  from { opacity: 0; transform: scale(0.8) translateY(5px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes smokeRise {
  0%   { opacity: 0.3; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
}
@keyframes ping {
  0%   { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
`;

export default function SideBanners() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Left side */}
      <div className="hidden xl:flex fixed left-3 2xl:left-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-20 pointer-events-auto">
        <DeliveryBanner visible={visible} />
        <SupplierBanner visible={visible} />
      </div>

      {/* Right side */}
      <div className="hidden xl:flex fixed right-3 2xl:right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-20 pointer-events-auto">
        <ConsultBanner visible={visible} />
        <FulfilmentBanner visible={visible} />
      </div>
    </>
  );
}
