"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";

const navLinks = [
  { label: "Услуги", href: "#services" },
  { label: "Как работаем", href: "#process" },
  { label: "Кейсы", href: "#cases" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#calculator" },
];

const pageLinks = [
  { label: "🇰🇿 Kaspi", href: "/kaspi-china" },
  { label: "Блог", href: "/blog" },
  { label: "Партнёрам", href: "/partners" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const pathname = usePathname();
  const isHome = pathname === "/";

  const scrollTo = (href: string) => {
    setIsOpen(false);
    if (isHome) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/" + href;
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0B1F3A]/95 backdrop-blur-md border-b border-[#243a5e] shadow-lg" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-sm group-hover:bg-[#008f59] transition-colors">
              CB
            </div>
            <span className="font-bold text-lg tracking-tight">
              China<span className="text-[#00A86B]">Bridge</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {link.label}
              </button>
            ))}
            {pageLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {link.label}
              </Link>
            ))}

            <Link href="/ai-calculator"
              className="px-4 py-2 text-sm text-[#00A86B] hover:text-white font-semibold transition-colors rounded-lg hover:bg-white/5">
              🤖 AI-калькулятор
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/client/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 border border-[#243a5e] hover:border-[#00A86B]/50 text-[#8899aa] hover:text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Личный кабинет
            </Link>
            <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white text-sm font-semibold rounded-lg transition-all whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Написать менеджеру
            </a>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0f2644] border-t border-[#243a5e]">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollTo(link.href)}
                className="text-left px-4 py-3 text-sm text-[#8899aa] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                {link.label}
              </button>
            ))}
            {pageLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-sm text-[#8899aa] hover:text-white hover:bg-white/5 rounded-lg transition-colors block">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-1 border-t border-[#243a5e]">
              <Link href="/ai-calculator" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#00A86B] font-semibold hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                🤖 AI-калькулятор маржи
              </Link>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/client/dashboard" onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-[#243a5e] text-[#8899aa] text-sm font-medium rounded-xl text-center hover:border-[#00A86B]/50 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Личный кабинет
              </Link>
              <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#229ED9] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#1a8bbf] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Написать менеджеру
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
