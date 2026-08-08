import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Партнёрская программа ChinaBridge — зарабатывайте на рекомендациях",
  description:
    "Рекомендуйте ChinaBridge — получайте 20% с первого платежа и 10% с повторных. Выплаты ежемесячно. Присоединяйтесь бесплатно.",
};

const STEPS = [
  {
    n: "01",
    title: "Зарегистрируйтесь",
    desc: "Создайте аккаунт на ChinaBridge бесплатно. В настройках профиля получите личную реферальную ссылку.",
  },
  {
    n: "02",
    title: "Приглашайте клиентов",
    desc: "Поделитесь ссылкой с предпринимателями, которые работают с Китаем или планируют начать.",
  },
  {
    n: "03",
    title: "Получайте комиссию",
    desc: "20% с первого платежа каждого привлечённого клиента + 10% с повторных в течение 12 месяцев.",
  },
];

const FAQS = [
  {
    q: "Сколько можно заработать?",
    a: "Зависит от количества клиентов. При среднем чеке 15 000 ₽/мес: 5 клиентов = 3 000–7 500 ₽ ежемесячно.",
  },
  {
    q: "Когда и как выплачивается комиссия?",
    a: "Раз в месяц, не позднее 15 числа за предыдущий месяц. Минимум для выплаты — 3 000 ₽. На карту или расчётный счёт.",
  },
  {
    q: "Сколько действует атрибуция?",
    a: "30 дней: если привлечённый пользователь зарегистрируется в течение 30 дней после перехода по вашей ссылке, он будет закреплён за вами.",
  },
  {
    q: "Могу ли я рекламировать платно?",
    a: "Да — контекстная реклама, таргетинг, Telegram Ads разрешены. Нельзя: использовать чужие бренды и trademark-домены, спам, misleading-рекламу.",
  },
  {
    q: "Есть ли ограничения по количеству рефералов?",
    a: "Нет. Привлекайте неограниченное количество клиентов — комиссия сохраняется для каждого.",
  },
];

export default function PartnersPage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-20">

          {/* Hero */}
          <section className="text-center">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-4">
              Партнёрская программа
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Зарабатывайте на <span className="text-gradient">рекомендациях</span>
            </h1>
            <p className="text-[#8899aa] text-lg max-w-2xl mx-auto mb-8">
              Рекомендуйте ChinaBridge предпринимателям — получайте <strong className="text-white">20% с первого платежа</strong> и{" "}
              <strong className="text-white">10% с повторных</strong> в течение 12 месяцев.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="px-8 py-4 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-lg"
              >
                Начать зарабатывать
              </Link>
              <Link
                href="/settings/partners"
                className="px-8 py-4 border border-[#243a5e] hover:border-[#00A86B]/50 text-white rounded-xl transition-all hover:bg-white/5"
              >
                Мои рефералы →
              </Link>
            </div>
          </section>

          {/* Commission highlights */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { value: "20%", label: "с первого платежа", sub: "от каждого привлечённого клиента" },
                { value: "10%", label: "с повторных",        sub: "в течение 12 месяцев после первого платежа" },
                { value: "30", label: "дней атрибуция",     sub: "переход по ссылке → регистрация" },
              ].map(item => (
                <div
                  key={item.label}
                  className="card-glass rounded-2xl p-7 text-center border border-[#00A86B]/10"
                >
                  <p className="text-5xl font-bold text-[#00A86B] mb-2">{item.value}</p>
                  <p className="text-white font-semibold mb-1">{item.label}</p>
                  <p className="text-[#8899aa] text-xs">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-2xl font-bold text-white text-center mb-10">Как это работает</h2>
            <div className="space-y-6">
              {STEPS.map(step => (
                <div key={step.n} className="card-glass rounded-2xl p-6 flex gap-6 items-start">
                  <div className="text-4xl font-bold text-[#00A86B]/30 shrink-0 w-14 text-center leading-none mt-1">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-[#8899aa] text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="card-glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Вопросы и ответы</h2>
            <div className="space-y-6">
              {FAQS.map(item => (
                <div key={item.q}>
                  <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                  <p className="text-[#8899aa] text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="card-glass rounded-3xl p-10 text-center bg-gradient-to-br from-[#00A86B]/10 to-transparent border border-[#00A86B]/20">
            <h2 className="text-3xl font-bold text-white mb-3">Готовы начать?</h2>
            <p className="text-[#8899aa] mb-6 max-w-md mx-auto">
              Зарегистрируйтесь бесплатно — ваша реферальная ссылка будет готова за 30 секунд.
            </p>
            <Link
              href="/signup"
              className="inline-block px-10 py-4 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-lg"
            >
              Создать аккаунт бесплатно
            </Link>
            <p className="text-[#8899aa] text-xs mt-4">Регистрация бесплатная · Ссылка готова за 30 секунд</p>
          </section>

        </div>
      </div>
      <Footer />
    </main>
  );
}
