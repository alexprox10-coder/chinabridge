interface Rates {
  CNY_RUB: number;
  CNY_KZT: number;
  USD_RUB: number;
  USD_CNY: number;
  updated: string;
}

async function fetchRates(): Promise<Rates | null> {
  try {
    const [cnyRes, usdRes] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=CNY&to=RUB,KZT", {
        next: { revalidate: 3600 },
      }),
      fetch("https://api.frankfurter.app/latest?from=USD&to=RUB,CNY", {
        next: { revalidate: 3600 },
      }),
    ]);
    if (!cnyRes.ok || !usdRes.ok) return null;
    const [cny, usd] = await Promise.all([cnyRes.json(), usdRes.json()]);
    return {
      CNY_RUB: cny.rates?.RUB ?? 0,
      CNY_KZT: cny.rates?.KZT ?? 0,
      USD_RUB: usd.rates?.RUB ?? 0,
      USD_CNY: usd.rates?.CNY ?? 0,
      updated: cny.date ?? "",
    };
  } catch {
    return null;
  }
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const PAIRS = (r: Rates) => [
  { from: "🇨🇳 CNY", to: "🇷🇺 RUB", rate: r.CNY_RUB, hint: "1 юань" },
  { from: "🇨🇳 CNY", to: "🇰🇿 KZT", rate: r.CNY_KZT, hint: "1 юань" },
  { from: "🇺🇸 USD", to: "🇷🇺 RUB", rate: r.USD_RUB, hint: "1 доллар" },
  { from: "🇺🇸 USD", to: "🇨🇳 CNY", rate: r.USD_CNY, hint: "1 доллар" },
];

export default async function CurrencyRates() {
  const rates = await fetchRates();

  if (!rates) return null;

  const pairs = PAIRS(rates);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Курсы валют</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Обновлено: {rates.updated ? new Date(rates.updated).toLocaleDateString("ru-RU") : "—"}
          </p>
        </div>
        <span className="text-xl">💱</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {pairs.map((p) => (
          <div
            key={`${p.from}-${p.to}`}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-slate-500">{p.from}</span>
              <span className="text-slate-300 text-xs">→</span>
              <span className="text-xs text-slate-500">{p.to}</span>
            </div>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {fmt(p.rate)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{p.hint}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-3 text-center">
        Справочные курсы · Источник: Frankfurter / ECB
      </p>
    </div>
  );
}
