"use client";
import { useState } from "react";
import Link from "next/link";

function PinDots({ value }: { value: string }) {
  return (
    <div className="flex gap-2 justify-center my-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
            i < value.length ? "border-emerald-500 bg-emerald-900/30 text-emerald-400" : "border-slate-700 bg-slate-800 text-slate-600"
          }`}
        >
          {i < value.length ? "●" : "·"}
        </div>
      ))}
    </div>
  );
}

const COUNTRIES = [
  { code: "RU", label: "🇷🇺 Россия" },
  { code: "KZ", label: "🇰🇿 Казахстан" },
  { code: "BY", label: "🇧🇾 Беларусь" },
  { code: "UZ", label: "🇺🇿 Узбекистан" },
  { code: "KG", label: "🇰🇬 Кыргызстан" },
  { code: "AE", label: "🇦🇪 ОАЭ" },
  { code: "OTHER", label: "🌍 Другая" },
];

const EMPLOYEES = ["1–5", "6–15", "16–50", "51–200", "200+"];

export default function SignupForm() {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [pin,     setPin]     = useState("");
  const [pinConf, setPinConf] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    email:       "",
    password:    "",
    country:     "RU",
    telegram:    "",
    employees:   "1–5",
    industry:    "cargo",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canStep1 = form.companyName.length >= 2 && form.email.includes("@") && form.password.length >= 6;
  const canStep2 = !!form.country;
  const canStep3 = pin.length >= 4 && pin === pinConf;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pin }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка регистрации");
      // Redirect to onboarding
      window.location.href = "/onboarding";
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/platform" className="inline-block">
          <span className="text-2xl font-bold text-white">China<span className="text-emerald-400">Bridge</span></span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-emerald-800 text-emerald-400">Platform</span>
        </Link>
        <h1 className="text-xl font-bold text-white mt-4">Создать аккаунт</h1>
        <p className="text-slate-400 text-sm mt-1">14 дней бесплатно · Без карты</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? "bg-emerald-500" : "bg-slate-800"}`} />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        {/* Step 1: Company + Auth */}
        {step === 1 && (
          <>
            <div className="text-white font-semibold mb-2">1. Данные компании</div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Название компании *</label>
              <input value={form.companyName} onChange={e => set("companyName", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="ООО АзияКарго" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="owner@company.ru" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Пароль * (мин. 6 символов)</label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••" />
            </div>
            <button onClick={() => canStep1 && setStep(2)} disabled={!canStep1}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold">
              Далее →
            </button>
          </>
        )}

        {/* Step 2: Locale */}
        {step === 2 && (
          <>
            <div className="text-white font-semibold mb-2">2. О компании</div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Страна *</label>
              <select value={form.country} onChange={e => set("country", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Telegram (необязательно)</label>
              <input value={form.telegram} onChange={e => set("telegram", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="@username" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Количество сотрудников</label>
              <div className="flex gap-2 flex-wrap">
                {EMPLOYEES.map(e => (
                  <button key={e} onClick={() => set("employees", e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.employees === e ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm">← Назад</button>
              <button onClick={() => canStep2 && setStep(3)} disabled={!canStep2}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold">
                Далее →
              </button>
            </div>
          </>
        )}

        {/* Step 3: PIN creation */}
        {step === 3 && (
          <>
            <div className="text-white font-semibold mb-1">3. Создайте PIN-код</div>
            <p className="text-slate-400 text-xs mb-4">Этот код нужен для входа в ваш кабинет. Запомните его — он не восстанавливается.</p>
            <div>
              <label className="text-slate-400 text-xs block mb-1">PIN-код (4–6 цифр) *</label>
              <div className="relative cursor-pointer" onClick={() => document.getElementById("pin-input")?.focus()}>
                <PinDots value={pin} />
              </div>
              <input
                id="pin-input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 mt-2"
                placeholder="Введите 4-6 цифр"
              />
            </div>
            <div className="mt-3">
              <label className="text-slate-400 text-xs block mb-1">Повторите PIN *</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinConf}
                onChange={e => setPinConf(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none transition ${
                  pinConf && pin !== pinConf ? "border-red-500" : "border-slate-600 focus:border-emerald-500"
                }`}
                placeholder="Повторите PIN"
              />
              {pinConf && pin !== pinConf && <p className="text-red-400 text-xs mt-1">PIN не совпадает</p>}
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setStep(2)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm">← Назад</button>
              <button onClick={() => canStep3 && setStep(4)} disabled={!canStep3}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold">
                Далее →
              </button>
            </div>
          </>
        )}

        {/* Step 4: Confirm + Submit */}
        {step === 4 && (
          <>
            <div className="text-white font-semibold mb-2">4. Подтверждение</div>
            <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
              {[
                ["🏢 Компания", form.companyName],
                ["📧 Email",    form.email],
                ["🌍 Страна",   form.country],
                ["💳 Тариф",    "Trial · 14 дней бесплатно"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-slate-400">{l}</span>
                  <span className="text-slate-100 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-300">
              🚀 После регистрации автоматически создадутся все AI-модули вашей компании
            </div>
            {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-xs">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm">← Назад</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white rounded-xl text-sm font-semibold">
                {loading ? <span className="animate-spin inline-block">⟳</span> : "🚀 Создать компанию"}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-slate-500 text-xs mt-4">
        Уже есть аккаунт? <Link href="/admin/login" className="text-emerald-400 hover:text-emerald-300">Войти →</Link>
      </p>
      <p className="text-center text-slate-600 text-xs mt-2">
        Регистрируясь, вы принимаете <Link href="/terms" className="hover:text-slate-400">условия использования</Link>
      </p>
    </div>
  );
}
