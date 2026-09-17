"use client";
import { useEffect, useState } from "react";

interface FunnelData {
  funnel: {
    calc_view: number;
    calc_done: number;
    paywall_shown: number;
    pro_click: number;
    checkout_started: number;
    payment_success: number;
    pro_activated: number;
  };
  subscriptions: {
    total: string | number;
    active: string | number;
    first_payment: string | null;
    last_payment: string | null;
  };
  pendingByStatus: Array<{ status: string; cnt: string | number }>;
  dailyPayments: Array<{ day: string; cnt: string | number }>;
  modeStats: Array<{ mode: string; country: string | null; cnt: string | number }>;
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

export default function CalcFunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/calc-funnel")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setData(d);
        else setError(d.error ?? "error");
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const f = data?.funnel;
  const steps = f ? [
    { label: "Просмотры калькулятора",    value: f.calc_view,        from: null },
    { label: "Выполнено расчётов",        value: f.calc_done,        from: f.calc_view },
    { label: "Показан Paywall",           value: f.paywall_shown,    from: f.calc_done },
    { label: "Клик PRO",                  value: f.pro_click,        from: f.paywall_shown },
    { label: "Создан платёж",             value: f.checkout_started, from: f.pro_click },
    { label: "Оплата прошла",             value: f.payment_success,  from: f.checkout_started },
    { label: "PRO активирован",           value: f.pro_activated,    from: f.payment_success },
  ] : [];

  return (
    <div className="min-h-screen bg-[#060f1e] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Воронка Pro-монетизации калькулятора</h1>
          <p className="text-[#8899aa] text-sm mt-1">Данные за 30 дней · обновляется каждые 5 мин</p>
        </div>

        {loading && <p className="text-[#8899aa]">Загрузка...</p>}
        {error && <p className="text-red-400">Ошибка: {error}</p>}

        {data && (
          <>
            {/* Funnel steps */}
            <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-[#8899aa] mb-4">Воронка конверсии (30 дней)</h2>
              <div className="space-y-3">
                {steps.map((step, i) => {
                  const dropRate = step.from && step.value < step.from
                    ? `↓ ${Math.round(((step.from - step.value) / step.from) * 100)}% отвала`
                    : null;
                  const convRate = step.from ? pct(step.value, step.from) : null;
                  const maxVal = steps[0]?.value || 1;
                  const barW = Math.round((step.value / maxVal) * 100);

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#8899aa]">{i + 1}. {step.label}</span>
                        <div className="flex items-center gap-3">
                          {convRate && (
                            <span className={`text-xs font-semibold ${Number(convRate.replace('%','')) >= 50 ? 'text-[#00A86B]' : Number(convRate.replace('%','')) >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                              {convRate}
                            </span>
                          )}
                          <span className="text-sm font-bold text-white w-16 text-right">{step.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-[#1e3a5f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00A86B] rounded-full transition-all"
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                      {dropRate && (
                        <p className="text-[10px] text-red-400 mt-0.5">{dropRate}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-[#1e3a5f] grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-[#5a7899]">Калькулятор → Paywall</p>
                  <p className="text-lg font-bold text-white">{pct(f?.paywall_shown ?? 0, f?.calc_done ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#5a7899]">Paywall → Оплата</p>
                  <p className="text-lg font-bold text-[#229ED9]">{pct(f?.checkout_started ?? 0, f?.paywall_shown ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#5a7899]">Оплата → PRO</p>
                  <p className="text-lg font-bold text-[#00A86B]">{pct(f?.pro_activated ?? 0, f?.payment_success ?? 0)}</p>
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">Подписки</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[#5a7899]">Всего</p>
                    <p className="text-2xl font-bold text-white">{Number(data.subscriptions.total ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5a7899]">Активных</p>
                    <p className="text-2xl font-bold text-[#00A86B]">{Number(data.subscriptions.active ?? 0)}</p>
                  </div>
                </div>
                {data.subscriptions.last_payment && (
                  <p className="text-[10px] text-[#5a7899] mt-3">
                    Последняя: {new Date(data.subscriptions.last_payment).toLocaleDateString("ru-RU")}
                  </p>
                )}
              </div>

              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">Статусы платежей (30д)</h2>
                <div className="space-y-2">
                  {data.pendingByStatus.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-[#8899aa]">{s.status}</span>
                      <span className="text-sm font-semibold text-white">{Number(s.cnt)}</span>
                    </div>
                  ))}
                  {data.pendingByStatus.length === 0 && (
                    <p className="text-xs text-[#5a7899]">Нет данных</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mode breakdown */}
            {(() => {
              const modes = [
                { key: "marketplace", label: "🛒 Маркетплейс" },
                { key: "wholesale",   label: "📦 Опт" },
                { key: "b2b",        label: "🏭 Для бизнеса" },
                { key: "delivery",   label: "🚚 Доставка" },
              ];
              const modeStats = data.modeStats ?? [];
              const total = modeStats.reduce((s, r) => s + Number(r.cnt), 0);
              if (modeStats.length === 0) return (
                <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5 mb-6">
                  <h2 className="text-sm font-semibold text-[#8899aa] mb-2">Разбивка по режимам (30 дней)</h2>
                  <p className="text-xs text-[#5a7899]">Данные появятся после первых выборов режима</p>
                </div>
              );
              // aggregate per mode
              const byMode: Record<string, { ru: number; kz: number; total: number }> = {};
              for (const row of modeStats) {
                const m = row.mode;
                if (!byMode[m]) byMode[m] = { ru: 0, kz: 0, total: 0 };
                const cnt = Number(row.cnt);
                byMode[m].total += cnt;
                if (row.country === "KZ") byMode[m].kz += cnt;
                else byMode[m].ru += cnt;
              }
              return (
                <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5 mb-6">
                  <h2 className="text-sm font-semibold text-[#8899aa] mb-4">Разбивка по режимам (30 дней) · {total.toLocaleString()} выборов</h2>
                  <div className="space-y-3">
                    {modes.map(({ key, label }) => {
                      const stat = byMode[key];
                      if (!stat) return null;
                      const pctVal = total > 0 ? Math.round((stat.total / total) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#8899aa]">{label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-[#5a7899]">
                                🇷🇺 {stat.ru.toLocaleString()} · 🇰🇿 {stat.kz.toLocaleString()}
                              </span>
                              <span className="text-sm font-bold text-white w-16 text-right">{stat.total.toLocaleString()}</span>
                              <span className="text-xs text-[#00A86B] w-8 text-right">{pctVal}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-[#1e3a5f] rounded-full overflow-hidden">
                            <div className="h-full bg-[#00A86B] rounded-full transition-all" style={{ width: `${pctVal}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Daily payments chart */}
            {data.dailyPayments.length > 0 && (
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-4">Платежи по дням (14 дней)</h2>
                <div className="flex items-end gap-2 h-24">
                  {data.dailyPayments.map((d, i) => {
                    const maxCnt = Math.max(...data.dailyPayments.map(x => Number(x.cnt)));
                    const h = maxCnt > 0 ? Math.round((Number(d.cnt) / maxCnt) * 80) : 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[9px] text-white font-semibold">{Number(d.cnt) > 0 ? d.cnt : ""}</span>
                        <div className="w-full bg-[#00A86B] rounded-sm" style={{ height: `${Math.max(h, 2)}px` }} />
                        <span className="text-[9px] text-[#5a7899] writing-mode-vertical">
                          {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
