"use client";

import Link from "next/link";
import { Send, MessageCircle, Mail, MapPin } from "lucide-react";
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
  { label: "🇰🇿 Доставка для Kaspi.kz", href: "/kaspi-china" },
  { label: "🧮 Калькулятор доставки",    href: "/delivery-calculator" },
  { label: "🔍 AI Поиск товаров",        href: "/product-finder" },
  { label: "🏭 AI Поиск поставщиков",    href: "/supplier-finder" },
  { label: "📚 База знаний",             href: "/knowledge" },
  { label: "🤝 Партнёрская программа",   href: "/partners" },
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
                href="https://wa.me/79145889874"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-border hover:border-[#25D366]/50 hover:bg-[#25D366]/10 transition-colors text-[#8899aa] hover:text-[#25D366]"
                aria-label="WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
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
                href="https://wa.me/79145889874"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-border hover:border-[#25D366]/50 hover:bg-[#25D366]/10 transition-colors text-[#8899aa] hover:text-[#25D366]"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" className="flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                <a
                  href="https://wa.me/79145889874"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8899aa] hover:text-[#25D366] transition-colors"
                >
                  WhatsApp
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
                  href="https://wa.me/79145889874"
                  target="_blank"
                  rel="noopener noreferrer"
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
            © {new Date().getFullYear()} ChinaBridge. Все права защищены. ИНН 280114439648
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
