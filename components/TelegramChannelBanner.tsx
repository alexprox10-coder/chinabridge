"use client";

import Link from "next/link";
import { Send } from "lucide-react";

export default function TelegramChannelBanner() {
  return (
    <section className="py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1f3c] to-[#0d2a4a] border border-[#243a5e] px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#229ED9]/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-[#229ED9]/5 blur-xl pointer-events-none" />

          {/* Icon */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center">
            <Send className="w-7 h-7 text-[#229ED9]" />
          </div>

          {/* Text */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#229ED9] mb-1">
              Telegram-канал
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Подпишитесь на ChinaBridge
            </h3>
            <p className="text-[#8899aa] text-sm leading-relaxed">
              Советы по импорту, кейсы клиентов, новости рынка и эксклюзивные офферы — раньше всех
            </p>
          </div>

          {/* CTA */}
          <a
            href="https://t.me/chinabridgeline"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#229ED9] hover:bg-[#1a8bc4] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#229ED9]/20"
          >
            <Send className="w-4 h-4" />
            Подписаться
          </a>
        </div>
      </div>
    </section>
  );
}
