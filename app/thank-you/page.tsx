export const dynamic = "force-dynamic";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-[#070f1e] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0B1F3A] border border-[#00A86B]/30 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-white mb-3">Оплата прошла!</h1>
        <p className="text-[#8899aa] text-sm mb-6 leading-relaxed">
          Наш аналитик в Китае уже получил задачу.<br />
          В течение <strong className="text-white">24 часов</strong> пришлём в Telegram:
        </p>

        <div className="flex flex-col gap-2.5 mb-8 text-left">
          {[
            "3 проверенных фабрики вашего товара",
            "Цены в юанях и рублях/тенге",
            "Точный расчёт доставки до вашего города",
            "Таможенные пошлины по вашему товару",
            "Итоговую маржу с учётом всех расходов",
          ].map(item => (
            <div key={item} className="flex items-center gap-3 text-sm text-[#cdd5e0]">
              <span className="text-[#00A86B] text-base shrink-0">✅</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-bold rounded-xl text-sm transition-all mb-3"
        >
          📩 Написать менеджеру в Telegram
        </a>

        <p className="text-[11px] text-[#445566]">
          Напишите свой Telegram-ник чтобы мы могли отправить вам отчёт
        </p>

        <div className="mt-6 pt-6 border-t border-[#1a3a5e]">
          <p className="text-xs text-[#5a7899] mb-3">Пока ждёте — рассчитайте ещё один товар</p>
          <a
            href="/ai-calculator"
            className="text-sm text-[#00A86B] hover:text-[#00c47d] underline transition-colors"
          >
            Вернуться в калькулятор →
          </a>
        </div>
      </div>
    </main>
  );
}
