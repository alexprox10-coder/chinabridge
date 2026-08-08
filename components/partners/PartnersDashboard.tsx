"use client";
import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, CreditCard } from "lucide-react";
import Link from "next/link";

interface Stats {
  code: string;
  url: string;
  clicks: number;
  signups: number;
  paid_referrals: number;
  total_commission_rub: number;
  pending_commission_rub: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <p className="text-[#8899aa] text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-[#8899aa] text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}

export function PartnersDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [linkRes, statsRes] = await Promise.all([
          fetch("/api/partners/link"),
          fetch("/api/partners/stats"),
        ]);
        const linkData = await linkRes.json();
        const statsData = await statsRes.json();

        if (linkData.ok && statsData.ok) {
          setStats({
            code: linkData.code,
            url: linkData.url,
            clicks: statsData.clicks ?? 0,
            signups: statsData.signups ?? 0,
            paid_referrals: statsData.paid_referrals ?? 0,
            total_commission_rub: statsData.total_commission_rub ?? 0,
            pending_commission_rub: statsData.pending_commission_rub ?? 0,
          });
        } else {
          setError("Не удалось загрузить данные");
        }
      } catch {
        setError("Ошибка соединения");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyLink = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="card-glass rounded-2xl p-6 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass rounded-2xl p-8 text-center border border-red-900/30 bg-red-900/10">
        <p className="text-red-400 text-sm">{error}</p>
        <Link href="/login" className="text-[#00A86B] text-sm mt-3 inline-block hover:underline">
          Войти в аккаунт
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Your referral link */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1">Ваша партнёрская ссылка</h2>
        <p className="text-[#8899aa] text-xs mb-4">Поделитесь этой ссылкой — получайте комиссию с каждого клиента</p>

        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-[#8899aa] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {stats?.url ?? "Загрузка…"}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white rounded-xl transition-all flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Скопировано" : "Скопировать"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#8899aa]">
          <span>Код:</span>
          <span className="px-2 py-0.5 bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] rounded font-mono font-semibold">
            {stats?.code}
          </span>
          <a
            href={stats?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[#00A86B] hover:underline"
          >
            Открыть ссылку <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Переходов" value={stats?.clicks ?? 0} sub="по вашей ссылке" />
        <StatCard label="Регистраций" value={stats?.signups ?? 0} sub="новых аккаунтов" />
        <StatCard label="Оплативших" value={stats?.paid_referrals ?? 0} sub="клиентов" />
        <StatCard
          label="Комиссия"
          value={`${(stats?.total_commission_rub ?? 0).toLocaleString("ru-RU")} ₽`}
          sub={`${(stats?.pending_commission_rub ?? 0).toLocaleString("ru-RU")} ₽ к выплате`}
        />
      </div>

      {/* How it works */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5">Условия программы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔗",
              title: "Первый платёж",
              desc: "20% от суммы первого платежа привлечённого клиента",
            },
            {
              icon: "🔄",
              title: "Повторные платежи",
              desc: "10% от каждого следующего платежа клиента в течение 12 месяцев",
            },
            {
              icon: "💳",
              title: "Выплата",
              desc: "Раз в месяц на карту или счёт при накоплении от 3 000 ₽",
            },
          ].map(item => (
            <div key={item.title} className="bg-[#0B1F3A] rounded-xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-white text-sm font-semibold mb-1">{item.title}</p>
              <p className="text-[#8899aa] text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[#8899aa] text-[11px] mt-4">
          * Атрибуция в течение 30 дней после перехода по вашей ссылке. Выплаты — через 15 дней после завершения месяца.
        </p>
      </div>

      {/* Promo tips */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Как продвигать</h2>
        <ul className="space-y-2.5">
          {[
            "Поделитесь ссылкой в Telegram-каналах по бизнесу и импорту",
            "Разместите в Instagram/VK с кратким описанием платформы",
            "Порекомендуйте знакомым предпринимателям, которые работают с Китаем",
            "Напишите статью или видео-обзор — разместите ссылку в описании",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#8899aa]">
              <span className="w-5 h-5 rounded-full bg-[#00A86B]/20 text-[#00A86B] text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment details */}
      <PayoutDetails pendingRub={stats?.pending_commission_rub ?? 0} />
    </div>
  );
}

function PayoutDetails({ pendingRub }: { pendingRub: number }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ type: "card", details: "", name: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <CreditCard className="w-5 h-5 text-[#00A86B]" />
        <h2 className="text-white font-semibold">Реквизиты для выплаты</h2>
        {pendingRub >= 3000 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#00A86B]/20 text-[#00A86B] font-semibold">
            {pendingRub.toLocaleString("ru-RU")} ₽ к выплате
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#8899aa] text-xs mb-1.5">Способ получения</label>
          <div className="flex gap-2">
            {[
              { val: "card", label: "Карта РФ" },
              { val: "account", label: "Расчётный счёт" },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: opt.val }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  form.type === opt.val
                    ? "bg-[#00A86B]/20 border-[#00A86B]/50 text-[#00A86B]"
                    : "bg-[#0B1F3A] border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[#8899aa] text-xs mb-1.5">
            {form.type === "card" ? "Номер карты" : "Расчётный счёт (р/с)"}
          </label>
          <input
            type="text"
            value={form.details}
            onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
            placeholder={form.type === "card" ? "0000 0000 0000 0000" : "40802810ХXXXXXXXXX"}
            className="w-full px-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-white text-sm placeholder-[#8899aa]/50 focus:outline-none focus:border-[#00A86B]/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#8899aa] text-xs mb-1.5">ФИО получателя</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Иванов Иван Иванович"
            className="w-full px-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-white text-sm placeholder-[#8899aa]/50 focus:outline-none focus:border-[#00A86B]/50 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[#8899aa] text-xs">Выплата до 15 числа следующего месяца · мин. 3 000 ₽</p>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saved ? "✓ Сохранено" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
