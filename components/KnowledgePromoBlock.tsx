import Link from "next/link";

const TOPICS = [
  { emoji: "🏭", text: "Как проверить поставщика на 1688" },
  { emoji: "📦", text: "Доставка в Россию: авиа vs море" },
  { emoji: "🛃", text: "Таможня и пошлины под ключ" },
  { emoji: "🛒", text: "Поставки под WB и Ozon" },
];

export default function KnowledgePromoBlock() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1f0f] to-[#0a1a1f] border border-[#1a3a2a] px-6 py-10 sm:px-10">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-emerald-400/5 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            {/* Left */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
                База знаний
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                Всё об импорте из Китая —<br className="hidden sm:block" /> в одном месте
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                15+ практических статей: поставщики, логистика, таможня, маркетплейсы.
                Бесплатно для всех.
              </p>

              {/* Topic pills */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-7">
                {TOPICS.map((t) => (
                  <span
                    key={t.text}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  >
                    <span>{t.emoji}</span>
                    <span>{t.text}</span>
                  </span>
                ))}
              </div>

              <Link
                href="/knowledge"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                📚 Читать бесплатно
              </Link>
            </div>

            {/* Right — big emoji */}
            <div className="shrink-0 hidden sm:flex w-28 h-28 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-6xl">
              📚
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
