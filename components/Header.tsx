"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Услуги", href: "#services" },
  { label: "Как работаем", href: "#process" },
  { label: "Кейсы", href: "#cases" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#calculator" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (href: string) => {
    setIsOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0B1F3A]/95 backdrop-blur-md border-b border-[#243a5e] shadow-lg" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-sm group-hover:bg-[#008f59] transition-colors">
              CB
            </div>
            <span className="font-bold text-lg tracking-tight">
              China<span className="text-[#00A86B]">Bridge</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <button onClick={() => scrollTo("#calculator")}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg">
              Получить расчёт <ChevronRight className="w-4 h-4" />
            </button>
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
            <button onClick={() => scrollTo("#calculator")}
              className="mt-2 px-4 py-3 bg-[#00A86B] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#008f59] transition-colors">
              Получить расчёт
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
