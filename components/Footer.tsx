"use client";

import Link from "next/link";
import { Send, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
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
  { label: "Услуги", href: "/services" },
  { label: "FAQ", href: "/faq" },
];

const toolLinks = [
  { label: "🧮 Калькулятор доставки",  href: "/delivery-calculator" },
  { label: "🔍 AI Поиск товаров",       href: "/product-finder" },
  { label: "🏭 AI Поиск поставщиков",   href: "/supplier-finder" },
  { label: "📚 База знаний",            href: "/knowledge" },
  { label: "🤝 Партнёрская программа",  href: "/partners" },
];

const importLinks = [
  { label: "Импорт одежды из Китая",        href: "/import-clothing-from-china" },
  { label: "Импорт обуви из Китая",         href: "/import-shoes-from-china" },
  { label: "Импорт мебели из Китая",        href: "/import-furniture-from-china" },
  { label: "Импорт автозапчастей из Китая", href: "/import-auto-parts-from-china" },
  { label: "Товары для Wildberries",        href: "/import-products-for-wildberries" },
  { label: "Товары для Ozon",              href: "/import-products-for-ozon" },
];

const companyLinks = [
  { label: "О компании", href: "/requisites" },
  { label: "Реквизиты", href: "/requisites" },
  { label: "Контакты", href: "/#calculator" },
  { label: "Политика конфиденциальности", href: "/privacy" },
];

export default function Footer() {
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contacts" className="border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
                CB
              </div>
              <span className="font-bold text-lg">
                China<span className="text-accent">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-[#8899aa] leading-relaxed mb-4 max-w-xs">
              Ваш представитель в Китае. Находим производителей, проверяем
              фабрики и доставляем товары в Казахстан и Россию.
            </p>
            <p className="text-xs text-[#8899aa]/60 mb-4">
              ИП Попков Виталий Михайлович<br />
              ИНН 280114439648
            </p>
            <div className="flex gap-3">
              <a
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.telegramClick()}
                className="p-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/10 transition-colors text-[#8899aa] hover:text-accent"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/chinabridgeline"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-border hover:border-[#229ED9]/50 hover:bg-[#229ED9]/10 transition-colors text-[#8899aa] hover:text-[#229ED9]"
                aria-label="Telegram канал"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:info@chinabridge.pro"
                onClick={() => analytics.phoneClick()}
                className="p-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/10 transition-colors text-[#8899aa] hover:text-accent"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8899aa] mb-4">
              Навигация
            </h4>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-[#8899aa] hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li className="pt-1 border-t border-[#243a5e] mt-1" />
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#8899aa] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Tools */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8899aa] mb-4">
              AI Сервисы
            </h4>
            <ul className="flex flex-col gap-2">
              {toolLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#8899aa] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Import categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8899aa] mb-4">
              Импорт из Китая
            </h4>
            <ul className="flex flex-col gap-2">
              {importLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#8899aa] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8899aa] mb-4">
              Компания
            </h4>
            <ul className="flex flex-col gap-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#8899aa] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8899aa] mb-4">
              Контакты
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-sm text-[#8899aa]">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Россия, Благовещенск</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[#8899aa]">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Китай (представительство)</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <a
                  href="tel:+79145819661"
                  className="text-[#8899aa] hover:text-accent transition-colors"
                  onClick={() => analytics.phoneClick()}
                >
                  +7 (914) 581-96-61
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <a
                  href="https://wa.me/79918825647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8899aa] hover:text-[#25D366] transition-colors"
                >
                  WhatsApp +7 (991) 882-56-47
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Send className="w-4 h-4 text-accent flex-shrink-0" />
                <a
                  href="https://t.me/ChinaBridgeLID_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8899aa] hover:text-accent transition-colors"
                >
                  @ChinaBridgeLID_bot
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Send className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                <a
                  href="https://t.me/chinabridgeline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8899aa] hover:text-[#229ED9] transition-colors"
                >
                  Наш канал
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <a
                  href="mailto:info@chinabridge.pro"
                  className="text-[#8899aa] hover:text-accent transition-colors"
                >
                  info@chinabridge.pro
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8899aa]">
            © {new Date().getFullYear()} ChinaBridge. Все права защищены. ИП Попков Виталий Михайлович
          </p>
          <div className="flex items-center gap-4">
            <Link href="/client/login" className="text-xs text-[#8899aa] hover:text-white transition-colors">
              Личный кабинет
            </Link>
            <Link href="/partners" className="text-xs text-[#8899aa] hover:text-white transition-colors">
              Партнёрам
            </Link>
            <Link href="/requisites" className="text-xs text-[#8899aa] hover:text-white transition-colors">
              Реквизиты
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
