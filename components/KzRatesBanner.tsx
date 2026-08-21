export default function KzRatesBanner() {
  return (
    <div className="bg-gradient-to-r from-[#00A86B]/10 to-[#006644]/10 border-y border-[#00A86B]/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Rates */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="text-xs text-[#8899aa] font-medium uppercase tracking-wide hidden sm:block">Доставка в Казахстан:</span>
          {[
            { icon: "🚗", mode: "Авто",  price: "от $3/кг", days: "15–20 дн" },
            { icon: "🚂", mode: "Ж/Д",   price: "от $4/кг", days: "12–15 дн" },
            { icon: "✈️", mode: "Авиа",  price: "от $15/кг", days: "5–7 дн"  },
          ].map(r => (
            <div key={r.mode} className="flex items-center gap-1.5">
              <span className="text-sm">{r.icon}</span>
              <span className="text-xs font-semibold text-white">{r.mode}</span>
              <span className="text-xs text-[#00A86B] font-bold">{r.price}</span>
              <span className="text-[10px] text-[#8899aa]">· {r.days}</span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#229ED9] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#1a8bbf] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Узнать цену
        </a>
      </div>
    </div>
  );
}
