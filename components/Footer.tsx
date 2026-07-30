"use client";

import { Send, MessageCircle, Mail, MapPin } from "lucide-react";
import { analytics } from "@/lib/analytics";

const navLinks = [
  { label: "Услуги", href: "#services" },
  { label: "Как работаем", href: "#process" },
  { label: "Кейсы", href: "#cases" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#calculator" },
];

export default function Footer() {
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contacts" className="border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
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
            <div className="flex gap-3">
              <a
                href="https://t.me/chinabridge"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.telegramClick()}
                className="p-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/10 transition-colors text-[#8899aa] hover:text-accent"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/79000000000"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.whatsappClick()}
                className="p-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/10 transition-colors text-[#8899aa] hover:text-accent"
                aria-label="WhatsApp"
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
                  href="https://t.me/chinabridge"
                  className="text-[#8899aa] hover:text-accent transition-colors"
                >
                  @chinabridge
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <a
                  href="mailto:info@chinabridge.ru"
                  className="text-[#8899aa] hover:text-accent transition-colors"
                >
                  info@chinabridge.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8899aa]">
            © {new Date().getFullYear()} ChinaBridge. Все права защищены.
          </p>
          <p className="text-xs text-[#8899aa]">
            Закупки из Китая в Казахстан и Россию
          </p>
        </div>
      </div>
    </footer>
  );
}
