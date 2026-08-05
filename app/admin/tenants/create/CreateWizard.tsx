"use client";
import { useState } from "react";
import type { BillingPlan, TenantCountry, Currency } from "@/lib/multitenant/types";
import { PLAN_CONFIG } from "@/lib/multitenant/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardForm {
  // Step 1: Company
  companyName: string;
  slug: string;
  description: string;
  industry: "logistics" | "cargo" | "ved" | "wholesale" | "retail" | "other";
  brandColor: string;
  // Step 2: Locale
  country: TenantCountry;
  currency: Currency;
  language: "ru" | "en";
  timezone: string;
  // Step 3: Plan
  plan: BillingPlan;
  owner: string;
  // Step 4: Confirm (read-only summary)
}

const STEPS = [
  { id: 1, title: "Компания",    icon: "🏢", desc: "Название, slug, описание" },
  { id: 2, title: "Локализация", icon: "🌍", desc: "Страна, валюта, язык" },
  { id: 3, title: "Тариф",       icon: "💳", desc: "План и владелец" },
  { id: 4, title: "Запуск",      icon: "🚀", desc: "Создание AI Company" },
];

const COUNTRIES: { code: TenantCountry; label: string; flag: string }[] = [
  { code: "RU", label: "Россия",         flag: "🇷🇺" },
  { code: "KZ", label: "Казахстан",      flag: "🇰🇿" },
  { code: "BY", label: "Беларусь",       flag: "🇧🇾" },
  { code: "UZ", label: "Узбекистан",     flag: "🇺🇿" },
  { code: "KG", label: "Кыргызстан",     flag: "🇰🇬" },
  { code: "AE", label: "ОАЭ",            flag: "🇦🇪" },
  { code: "CN", label: "Китай",          flag: "🇨🇳" },
  { code: "OTHER", label: "Другая",      flag: "🌍" },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Europe/Moscow",    label: "Москва (UTC+3)" },
  { value: "Europe/Minsk",     label: "Минск (UTC+3)" },
  { value: "Asia/Almaty",      label: "Алматы (UTC+5)" },
  { value: "Asia/Tashkent",    label: "Ташкент (UTC+5)" },
  { value: "Asia/Bishkek",     label: "Бишкек (UTC+6)" },
  { value: "Asia/Dubai",       label: "Дубай (UTC+4)" },
  { value: "Asia/Shanghai",    label: "Шанхай (UTC+8)" },
];

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "RUB", label: "₽ Рубль" },
  { code: "KZT", label: "₸ Тенге" },
  { code: "USD", label: "$ Доллар" },
  { code: "EUR", label: "€ Евро" },
  { code: "AED", label: "AED Дирхам" },
  { code: "CNY", label: "¥ Юань" },
];

const INDUSTRIES: { value: WizardForm["industry"]; label: string }[] = [
  { value: "cargo",     label: "Карго-доставка" },
  { value: "logistics", label: "Логистика" },
  { value: "ved",       label: "ВЭД-агентство" },
  { value: "wholesale", label: "Оптовая торговля" },
  { value: "retail",    label: "Розница" },
  { value: "other",     label: "Другое" },
];

const PRESET_COLORS = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2", "#db2777", "#65a30d"];

// ─── Auto-slug ────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/gi, c => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

// ─── Components ───────────────────────────────────────────────────────────────

function StepIndicator({ step, current }: { step: typeof STEPS[0]; current: number }) {
  const done    = step.id < current;
  const active  = step.id === current;
  return (
    <div className={`flex items-center gap-2 ${step.id <= current ? "opacity-100" : "opacity-40"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? "bg-emerald-600 text-white" : active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"}`}>
        {done ? "✓" : step.id}
      </div>
      <div className="hidden sm:block">
        <div className={`text-sm font-medium ${active ? "text-white" : done ? "text-emerald-400" : "text-slate-500"}`}>{step.title}</div>
        <div className="text-slate-600 text-xs">{step.desc}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium flex items-center gap-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-slate-500 text-xs">{hint}</p>}
    </div>
  );
}

// ─── AI Module deploy animation ───────────────────────────────────────────────

const AI_MODULES = [
  { id: "crm",       icon: "👥", label: "CRM система" },
  { id: "sales",     icon: "💼", label: "Sales AI" },
  { id: "marketing", icon: "📢", label: "Marketing AI" },
  { id: "content",   icon: "✍️", label: "Content AI" },
  { id: "analytics", icon: "📊", label: "Analytics AI" },
  { id: "operations",icon: "⚙️", label: "Operations AI" },
  { id: "finance",   icon: "💰", label: "Finance AI" },
  { id: "strategy",  icon: "🎯", label: "Strategy AI" },
  { id: "ceo",       icon: "👑", label: "CEO AI Command Center" },
  { id: "calculator",icon: "🧮", label: "Калькулятор доставки" },
  { id: "client",    icon: "🖥️", label: "Кабинет клиента" },
  { id: "partner",   icon: "🤝", label: "Кабинет партнёра" },
];

function DeployAnimation({ companyName, onDone }: { companyName: string; onDone: () => void }) {
  const [step, setStep] = useState(0);

  useState(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setStep(i);
      if (i >= AI_MODULES.length) {
        clearInterval(iv);
        setTimeout(onDone, 800);
      }
    }, 220);
    return () => clearInterval(iv);
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">🚀</div>
        <div className="text-white font-bold text-lg">Развёртывание AI Company</div>
        <div className="text-slate-400 text-sm">«{companyName}»</div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {AI_MODULES.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${i < step ? "bg-emerald-900/20 border border-emerald-800/40" : i === step ? "bg-blue-900/20 border border-blue-800/40" : "bg-slate-900 border border-slate-800 opacity-40"}`}>
            <span className="text-lg">{m.icon}</span>
            <span className={`text-sm flex-1 ${i < step ? "text-emerald-300" : i === step ? "text-blue-300" : "text-slate-500"}`}>{m.label}</span>
            <span className="text-xs">
              {i < step ? "✅" : i === step ? <span className="animate-spin inline-block">⟳</span> : "⏳"}
            </span>
          </div>
        ))}
      </div>
      <div className="text-center text-slate-400 text-xs">
        {step}/{AI_MODULES.length} модулей активировано
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function CreateWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [deploying,   setDeploying]   = useState(false);
  const [done,        setDone]        = useState(false);
  const [createdId,   setCreatedId]   = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [slugManual,  setSlugManual]  = useState(false);

  const [form, setForm] = useState<WizardForm>({
    companyName: "",
    slug:        "",
    description: "",
    industry:    "cargo",
    brandColor:  "#2563eb",
    country:     "RU",
    currency:    "RUB",
    language:    "ru",
    timezone:    "Europe/Moscow",
    plan:        "trial",
    owner:       "",
  });

  const set = (patch: Partial<WizardForm>) => setForm(f => ({ ...f, ...patch }));

  const handleNameChange = (name: string) => {
    set({ companyName: name, ...(!slugManual && { slug: toSlug(name) }) });
  };

  const canNext = (): boolean => {
    if (currentStep === 1) return form.companyName.length >= 2 && /^[a-z0-9-]{2,32}$/.test(form.slug);
    if (currentStep === 2) return !!form.country && !!form.currency && !!form.language;
    if (currentStep === 3) return form.owner.includes("@");
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res  = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка создания");
      setCreatedId(data.tenant.id);
      setDeploying(true);
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  };

  if (deploying && !done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <DeployAnimation companyName={form.companyName} onDone={() => { setDeploying(false); setDone(true); }} />
      </div>
    );
  }

  if (done && createdId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Компания создана!</h2>
          <p className="text-slate-400">«{form.companyName}» готова к работе.</p>
          <p className="text-slate-500 text-sm mt-1">Все AI-модули активированы. Время запуска: ~10 сек.</p>
        </div>
        <div className="bg-slate-900 border border-emerald-700/50 rounded-xl p-4 space-y-2 text-left">
          <div className="text-emerald-400 text-sm font-medium">✅ Что создано:</div>
          {AI_MODULES.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-xs text-slate-300">
              <span>{m.icon}</span> {m.label}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <a href={`/admin/tenants/${createdId}`}
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
            Открыть управление →
          </a>
          <a href="/admin/tenants"
            className="block w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">
            Все компании
          </a>
          <a href="/admin/tenants/create"
            className="block w-full py-2 text-slate-500 hover:text-slate-300 text-sm">
            + Создать ещё одну компанию
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
          <a href="/admin/tenants" className="hover:text-slate-200">Компании</a>
          <span>›</span>
          <span className="text-slate-200">Новая компания</span>
        </div>
        <h1 className="text-2xl font-bold text-white">➕ Создать компанию</h1>
        <p className="text-slate-400 text-sm mt-1">4 шага · ~2 минуты · AI Company OS развернётся автоматически</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        {STEPS.map((step, i) => (
          <>
            <StepIndicator key={step.id} step={step} current={currentStep} />
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${step.id < currentStep ? "bg-emerald-700" : "bg-slate-800"}`} />
            )}
          </>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5">
        {/* ─── Step 1: Company ─── */}
        {currentStep === 1 && (
          <>
            <div>
              <div className="text-white font-bold text-lg mb-1">🏢 О компании</div>
              <div className="text-slate-400 text-sm">Как называется карго-компания?</div>
            </div>
            <Field label="Название компании" required hint="Официальное название: ООО АзияКарго, SilkRoad Logistics, etc.">
              <input value={form.companyName} onChange={e => handleNameChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="ООО АзияКарго" />
            </Field>
            <Field label="URL-slug (поддомен)" required hint="Только латиница, цифры, дефис. Используется в URL и поддомене.">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">chinabridge.pro/</span>
                <input value={form.slug}
                  onChange={e => { setSlugManual(true); set({ slug: toSlug(e.target.value) }); }}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="aziyacargo" />
              </div>
              {form.slug && !/^[a-z0-9-]{2,32}$/.test(form.slug) && (
                <p className="text-red-400 text-xs">Только строчные латиница/цифры/дефис, 2–32 символа</p>
              )}
            </Field>
            <Field label="Описание" hint="Кратко: чем занимается компания, какие маршруты, рынки.">
              <textarea value={form.description} onChange={e => set({ description: e.target.value })}
                rows={2}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Грузоперевозки из Китая. Специализация: сборные грузы, выкуп 1688, таможня." />
            </Field>
            <Field label="Отрасль">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INDUSTRIES.map(ind => (
                  <button key={ind.value} onClick={() => set({ industry: ind.value })}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${form.industry === ind.value ? "bg-blue-700 text-white border border-blue-500" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"}`}>
                    {ind.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Фирменный цвет">
              <div className="flex items-center gap-3">
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => set({ brandColor: c })}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${form.brandColor === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <input type="color" value={form.brandColor} onChange={e => set({ brandColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
              </div>
            </Field>
          </>
        )}

        {/* ─── Step 2: Locale ─── */}
        {currentStep === 2 && (
          <>
            <div>
              <div className="text-white font-bold text-lg mb-1">🌍 Локализация</div>
              <div className="text-slate-400 text-sm">Где работает компания?</div>
            </div>
            <Field label="Страна" required>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => set({ country: c.code })}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${form.country === c.code ? "bg-blue-700 text-white border border-blue-500" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"}`}>
                    <span>{c.flag}</span> {c.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Валюта" required>
                <select value={form.currency} onChange={e => set({ currency: e.target.value as Currency })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Язык интерфейса">
                <select value={form.language} onChange={e => set({ language: e.target.value as "ru" | "en" })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none">
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </Field>
            </div>
            <Field label="Часовой пояс">
              <select value={form.timezone} onChange={e => set({ timezone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none">
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </Field>
          </>
        )}

        {/* ─── Step 3: Plan ─── */}
        {currentStep === 3 && (
          <>
            <div>
              <div className="text-white font-bold text-lg mb-1">💳 Тарифный план</div>
              <div className="text-slate-400 text-sm">Выберите план и укажите email владельца</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["trial", "starter", "pro", "enterprise"] as BillingPlan[]).map(plan => {
                const cfg = PLAN_CONFIG[plan];
                return (
                  <button key={plan} onClick={() => set({ plan })}
                    className={`p-4 rounded-xl text-left border transition-all ${form.plan === plan ? "border-blue-500 bg-blue-900/20" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-bold capitalize">{cfg.label}</div>
                      <div className="text-slate-300 text-sm font-medium">
                        {plan === "trial" ? "Бесплатно" : `${cfg.price.toLocaleString("ru")}₽/мес`}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs space-y-0.5">
                      <div>👥 до {cfg.maxUsers === 999 ? "∞" : cfg.maxUsers} пользователей</div>
                      <div>🤖 {cfg.aiDepts} AI-отделов</div>
                      {plan === "trial" && <div>⏳ 14 дней пробного периода</div>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cfg.features.slice(0, 3).map(f => (
                        <span key={f} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <Field label="Email владельца" required hint="На этот адрес придут данные для входа">
              <input type="email" value={form.owner} onChange={e => set({ owner: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="owner@company.ru" />
            </Field>
          </>
        )}

        {/* ─── Step 4: Confirm ─── */}
        {currentStep === 4 && (
          <>
            <div>
              <div className="text-white font-bold text-lg mb-1">🚀 Подтверждение</div>
              <div className="text-slate-400 text-sm">Проверьте данные перед запуском</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 text-sm">
              {[
                ["🏢 Компания",       form.companyName],
                ["🔗 Slug",           form.slug],
                ["🌍 Страна",         form.country],
                ["💱 Валюта",         form.currency],
                ["💳 Тариф",          PLAN_CONFIG[form.plan].label],
                ["📧 Владелец",       form.owner],
                ["🏭 Отрасль",        form.industry],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-100 font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 space-y-2">
              <div className="text-blue-300 text-sm font-medium">🤖 Будет автоматически создано:</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
                {AI_MODULES.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5">
                    <span>{m.icon}</span> {m.label}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)}
          disabled={currentStep === 1}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-sm">
          ← Назад
        </button>
        <div className="flex gap-1">
          {STEPS.map(s => (
            <div key={s.id}
              className={`w-2 h-2 rounded-full transition-all ${s.id === currentStep ? "bg-blue-500 w-6" : s.id < currentStep ? "bg-emerald-500" : "bg-slate-700"}`} />
          ))}
        </div>
        {currentStep < 4 ? (
          <button
            onClick={() => canNext() && setCurrentStep(s => s + 1)}
            disabled={!canNext()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            Далее →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white rounded-lg text-sm font-medium">
            {submitting ? <><span className="animate-spin inline-block mr-1">⟳</span> Создаём...</> : "🚀 Создать компанию"}
          </button>
        )}
      </div>
    </div>
  );
}
