import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Stat {
  value: string;
  label: string;
}

interface FaqItem {
  q: string;
  a: string;
}

export interface CategoryPageData {
  badge: string;
  h1: string;
  h1highlight: string;
  h1rest?: string;
  intro: string;
  stats: Stat[];
  benefits: string[];
  faq: FaqItem[];
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
  related?: { label: string; href: string }[];
}

export function CategoryPage({ data }: { data: CategoryPageData }) {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16">

          {/* Hero */}
          <section className="text-center">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-4">
              {data.badge}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {data.h1}
              <span className="text-gradient"> {data.h1highlight}</span>
              {data.h1rest && ` ${data.h1rest}`}
            </h1>
            <p className="text-[#8899aa] text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              {data.intro}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={data.cta_primary_href}
                className="px-6 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
              >
                {data.cta_primary_text}
              </Link>
              <Link
                href={data.cta_secondary_href}
                className="px-6 py-3 border border-[#243a5e] hover:border-[#00A86B]/50 text-white rounded-xl transition-all hover:bg-white/5"
              >
                {data.cta_secondary_text}
              </Link>
            </div>
          </section>

          {/* Stats */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.stats.map((s, i) => (
                <div key={i} className="card-glass rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold text-[#00A86B] mb-1">{s.value}</p>
                  <p className="text-[#8899aa] text-xs leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="card-glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Почему ChinaBridge?</h2>
            <ul className="space-y-3">
              {data.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[#8899aa] text-sm leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 text-[#00A86B] text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          {/* Tools promo */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Инструменты для импортёра</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "🧮", label: "Калькулятор доставки", desc: "Рассчитайте стоимость за секунды", href: "/delivery-calculator" },
                { icon: "🔍", label: "AI Поиск товаров",    desc: "Найдите товар с ценами и MOQ",     href: "/product-finder" },
                { icon: "🏭", label: "AI Поиск поставщиков", desc: "Supplier Score и анализ рисков",   href: "/supplier-finder" },
              ].map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="card-glass rounded-2xl p-5 hover:border-[#00A86B]/40 border border-transparent transition-all group"
                >
                  <div className="text-3xl mb-3">{tool.icon}</div>
                  <p className="text-white font-semibold text-sm group-hover:text-[#00A86B] transition-colors">{tool.label}</p>
                  <p className="text-[#8899aa] text-xs mt-1">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="card-glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Часто задаваемые вопросы</h2>
            <div className="space-y-6">
              {data.faq.map((item, i) => (
                <div key={i}>
                  <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                  <p className="text-[#8899aa] text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related pages */}
          {data.related && data.related.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Смотрите также</h2>
              <div className="flex flex-wrap gap-2">
                {data.related.map(r => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="px-4 py-2 bg-white/5 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-[#00A86B] text-sm rounded-xl transition-all"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Final CTA */}
          <section className="card-glass rounded-3xl p-10 text-center bg-gradient-to-br from-[#00A86B]/10 to-transparent border border-[#00A86B]/20">
            <h2 className="text-3xl font-bold text-white mb-3">Начните импортировать выгодно</h2>
            <p className="text-[#8899aa] mb-6">Менеджер ответит за 15 минут. Первая консультация бесплатно.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
              >
                Начать 14 дней бесплатно
              </Link>
              <a
                href="https://t.me/chinabridge"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-white rounded-xl transition-all hover:bg-white/5"
              >
                Написать в Telegram
              </a>
            </div>
          </section>

        </div>
      </div>
      <Footer />
    </main>
  );
}
