interface CbrValute {
  Value: number;
  Nominal: number;
  CharCode: string;
}

interface CbrResponse {
  Date: string;
  Valute: Record<string, CbrValute>;
}

interface Rates {
  CNY_RUB: number;
  KZT_RUB: number;
  USD_RUB: number;
  EUR_RUB: number;
  date: string;
}

const STATIC_RATES: Rates = {
  CNY_RUB: 11.5,
  KZT_RUB: 0.019,
  USD_RUB: 87.5,
  EUR_RUB: 96.0,
  date: "",
};

async function fetchRates(): Promise<Rates> {
  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return STATIC_RATES;
    const data: CbrResponse = await res.json();
    const v = data.Valute;
    const cny = v["CNY"];
    const kzt = v["KZT"];
    const usd = v["USD"];
    const eur = v["EUR"];
    return {
      CNY_RUB: cny ? cny.Value / cny.Nominal : STATIC_RATES.CNY_RUB,
      KZT_RUB: kzt ? kzt.Value / kzt.Nominal : STATIC_RATES.KZT_RUB,
      USD_RUB: usd ? usd.Value / usd.Nominal : STATIC_RATES.USD_RUB,
      EUR_RUB: eur ? eur.Value / eur.Nominal : STATIC_RATES.EUR_RUB,
      date: data.Date ?? "",
    };
  } catch {
    return STATIC_RATES;
  }
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export default async function CurrencyRates() {
  const r = await fetchRates();

  // CNY/KZT cross-rate: сколько тенге за 1 юань
  const CNY_KZT = r.KZT_RUB > 0 ? r.CNY_RUB / r.KZT_RUB : 0;

  const pairs = [
    { flag1: "🇨🇳", from: "CNY", flag2: "🇷🇺", to: "RUB", rate: r.CNY_RUB, hint: "1 юань" },
    { flag1: "🇨🇳", from: "CNY", flag2: "🇰🇿", to: "KZT", rate: CNY_KZT, hint: "1 юань", dec: 1 },
    { flag1: "🇺🇸", from: "USD", flag2: "🇷🇺", to: "RUB", rate: r.USD_RUB, hint: "1 доллар" },
    { flag1: "🇪🇺", from: "EUR", flag2: "🇷🇺", to: "RUB", rate: r.EUR_RUB, hint: "1 евро" },
  ];

  const dateLabel = r.date
    ? new Date(r.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "справочные";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Курсы валют</h2>
          <p className="text-xs text-slate-400 mt-0.5">ЦБ РФ · {dateLabel}</p>
        </div>
        <span className="text-xl">💱</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {pairs.map((p) => (
          <div
            key={`${p.from}-${p.to}`}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-1 mb-1 text-xs text-slate-500">
              <span>{p.flag1}</span>
              <span className="font-medium text-slate-700">{p.from}</span>
              <span className="text-slate-300 mx-0.5">→</span>
              <span>{p.flag2}</span>
              <span className="font-medium text-slate-700">{p.to}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">
              {fmt(p.rate, p.dec ?? 2)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{p.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
