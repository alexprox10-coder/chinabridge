"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, User, ChevronDown } from "lucide-react";
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
  { label: "Блог", href: "/blog" },
  { label: "Доставка", href: "/delivery" },
];

const toolLinks = [
  { icon: "🧮", label: "Калькулятор доставки", href: "/delivery-calculator" },
  { icon: "🔍", label: "AI Поиск товаров",     href: "/product-finder" },
  { icon: "🏭", label: "AI Поиск поставщиков", href: "/supplier-finder" },
  { icon: "📊", label: "Аудит импорта",         href: "/import-audit" },
  { icon: "📚", label: "База знаний",           href: "/knowledge" },
  { icon: "🤝", label: "Партнёрам",             href: "/partners" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

            {/* AI Tools dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen(v => !v)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                AI Сервисы
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-[#0f2644] border border-[#243a5e] rounded-2xl shadow-xl py-2 z-50">
                  {toolLinks.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      onClick={() => setToolsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#8899aa] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">{t.icon}</span>
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center">
            <Link href="/client/login"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg">
              <User className="w-4 h-4" /> Личный кабинет
            </Link>
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
              <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#8899aa]/60">AI Сервисы</p>
              {toolLinks.map((t) => (
                <Link key={t.href} href={t.href} onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#8899aa] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <span>{t.icon}</span>{t.label}
                </Link>
              ))}
            </div>
            <Link href="/client/login" onClick={() => setIsOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-[#00A86B] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#008f59] transition-colors">
              <User className="w-4 h-4" /> Личный кабинет
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
