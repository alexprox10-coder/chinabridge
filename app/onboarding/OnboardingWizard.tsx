"use client";
import { useState, useEffect, useRef } from "react";

const STEPS = [
  { id: "logo",     icon: "🖼️",  label: "Логотип" },
  { id: "brand",    icon: "🎨",  label: "Брендинг" },
  { id: "contacts", icon: "📞",  label: "Контакты" },
  { id: "currency", icon: "💱",  label: "Валюта" },
  { id: "route",    icon: "🚢",  label: "Маршрут" },
  { id: "telegram", icon: "✈️",  label: "Telegram" },
  { id: "email",    icon: "📧",  label: "Email" },
  { id: "done",     icon: "🚀",  label: "Готово!" },
];

const CURRENCIES = ["RUB", "USD", "EUR", "KZT", "AED", "CNY"];
const MAIN_ROUTES = ["Китай → Россия", "Китай → Казахстан", "Китай → СНГ", "Китай → ОАЭ", "Другой маршрут"];

export default function OnboardingWizard() {
  const [step,        setStep]        = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [companyName, setCompanyName] = useState("Ваша компания");
  const [logoError,   setLogoError]   = useState("");
  const [dragging,    setDragging]    = useState(false);
  const [seedState,   setSeedState]   = useState<"idle" | "loading" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm]               = useState({
    logo:         "",
    brandColor:   "#2563eb",
    contactPhone: "",
    contactWhatsapp: "",
    currency:     "RUB",
    mainRoute:    "Китай → Россия",
    telegram:     "",
    contactEmail: "",
  });

  useEffect(() => {
    const m = document.cookie.match(/cb_company_name=([^;]+)/);
    if (m) setCompanyName(decodeURIComponent(m[1]));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleLogoFile(file: File) {
    setLogoError("");
    if (!file.type.startsWith("image/")) {
      setLogoError("Только изображения (JPEG, PNG, SVG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Файл слишком большой. Максимум 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => set("logo", e.target?.result as string);
    reader.readAsDataURL(file);
  }

  const isLast = step === STEPS.length - 1;

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } finally { setSaving(false); }
  }

  async function finish() {
    await save();
    window.location.href = "/admin";
  }


  return (
    <div className="w-full max-w-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🏗️</div>
        <h1 className="text-2xl font-bold text-white">Настройка компании</h1>
        <p className="text-slate-400 text-sm mt-1">{companyName} — шаг {step + 1} из {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-emerald-500" : "bg-slate-800"}`} />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => i < step && setStep(i)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg flex-shrink-0 text-xs transition-colors ${
              i === step ? "bg-slate-800 text-white" : i < step ? "text-emerald-400 cursor-pointer" : "text-slate-600"
            }`}>
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5">
        {/* Step: Logo */}
        {step === 0 && (
          <>
            <div className="text-white font-semibold">🖼️ Логотип компании</div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleLogoFile(f);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-emerald-500 bg-emerald-900/20"
                  : "border-slate-600 hover:border-emerald-600 hover:bg-slate-800/50"
              }`}
            >
              {form.logo ? (
                <div className="space-y-2">
                  <img
                    src={form.logo}
                    alt="logo"
                    className="h-16 mx-auto rounded object-contain"
                    onError={() => set("logo", "")}
                  />
                  <div className="text-emerald-400 text-xs">✓ Логотип загружен · нажмите чтобы заменить</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl">📁</div>
                  <div className="text-slate-300 text-sm font-medium">Нажмите или перетащите файл</div>
                  <div className="text-slate-500 text-xs">JPEG, PNG, SVG · до 2 МБ</div>
                </div>
              )}
            </div>

            {logoError && <div className="text-red-400 text-xs">{logoError}</div>}

            <div>
              <label className="text-slate-400 text-xs block mb-1">Или укажите URL логотипа</label>
              <input
                value={form.logo.startsWith("data:") ? "" : form.logo}
                onChange={e => { setLogoError(""); set("logo", e.target.value); }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </>
        )}

        {/* Step: Brand */}
        {step === 1 && (
          <>
            <div className="text-white font-semibold">🎨 Брендовый цвет</div>
            <div className="flex items-center gap-4">
              <input type="color" value={form.brandColor} onChange={e => set("brandColor", e.target.value)}
                className="w-16 h-16 rounded-xl border-2 border-slate-600 cursor-pointer" />
              <div>
                <div className="text-white font-mono">{form.brandColor}</div>
                <div className="text-slate-400 text-xs mt-0.5">Используется в логотипе и интерфейсе</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["#2563eb","#16a34a","#dc2626","#7c3aed","#ea580c","#0891b2"].map(c => (
                <button key={c} onClick={() => set("brandColor", c)}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.brandColor === c ? "white" : "transparent" }} />
              ))}
            </div>
          </>
        )}

        {/* Step: Contacts */}
        {step === 2 && (
          <>
            <div className="text-white font-semibold">📞 Контактные данные</div>
            {[
              { key: "contactPhone",    label: "Телефон",   placeholder: "+7 (XXX) XXX-XX-XX" },
              { key: "contactWhatsapp", label: "WhatsApp",  placeholder: "+79001234567" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-slate-400 text-xs block mb-1">{label}</label>
                <input value={(form as Record<string, string>)[key]} onChange={e => set(key, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={placeholder} />
              </div>
            ))}
          </>
        )}

        {/* Step: Currency */}
        {step === 3 && (
          <>
            <div className="text-white font-semibold">💱 Основная валюта</div>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map(c => (
                <button key={c} onClick={() => set("currency", c)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    form.currency === c
                      ? "bg-emerald-700 border-emerald-500 text-white"
                      : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Main Route */}
        {step === 4 && (
          <>
            <div className="text-white font-semibold">🚢 Основной маршрут</div>
            <div className="space-y-2">
              {MAIN_ROUTES.map(r => (
                <button key={r} onClick={() => set("mainRoute", r)}
                  className={`w-full py-3 px-4 text-left rounded-xl border text-sm transition-colors ${
                    form.mainRoute === r
                      ? "bg-blue-700/40 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Telegram */}
        {step === 5 && (
          <>
            <div className="text-white font-semibold">✈️ Telegram-бот / канал</div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Telegram username или канал компании</label>
              <input value={form.telegram} onChange={e => set("telegram", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="@mycompany или https://t.me/mycompany" />
            </div>
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-300">
              📱 После настройки AI-агент сможет отправлять уведомления о грузах в Telegram
            </div>
          </>
        )}

        {/* Step: Email */}
        {step === 6 && (
          <>
            <div className="text-white font-semibold">📧 Email для уведомлений</div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Email компании</label>
              <input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="info@mycompany.ru" />
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-xs text-slate-400">
              <div className="text-slate-300 font-medium mb-1">Итоговая конфигурация:</div>
              {[
                ["🎨 Цвет", form.brandColor],
                ["💱 Валюта", form.currency],
                ["🚢 Маршрут", form.mainRoute],
                ["✈️ Telegram", form.telegram || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span>{l}</span><span className="text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step: Done */}
        {step === 7 && (
          <>
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🚀</div>
              <div className="text-2xl font-bold text-white mb-2">Всё готово!</div>
              <div className="text-slate-400 text-sm">AI Company OS для {companyName} настроена и готова к работе</div>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4 space-y-2 text-sm">
              {[
                "✅ Все AI-отделы активированы",
                "✅ Контекст компании настроен",
                "✅ CEO Command Center доступен",
                "✅ Пробный период: 14 дней",
              ].map(t => <div key={t} className="text-emerald-300">{t}</div>)}
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Хотите загрузить демо-данные?</label>
              {seedState === "done" ? (
                <div className="w-full py-2.5 bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 rounded-xl text-sm text-center">
                  ✅ Демо-данные загружены — 6 лидов в CRM
                </div>
              ) : (
                <button
                  disabled={seedState === "loading"}
                  onClick={async () => {
                    setSeedState("loading");
                    try {
                      const res = await fetch("/api/demo/seed", { method: "POST" });
                      if (res.ok) setSeedState("done");
                      else setSeedState("error");
                    } catch {
                      setSeedState("error");
                    }
                  }}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait text-slate-200 rounded-xl text-sm transition-colors"
                >
                  {seedState === "loading" ? "⏳ Загружаем..." : seedState === "error" ? "⚠️ Ошибка — попробуйте ещё раз" : "🌱 Загрузить демо-данные (лиды, сделки, KPI)"}
                </button>
              )}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm">
              ← Назад
            </button>
          )}
          {isLast ? (
            <button onClick={finish} disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
              {saving ? "Сохранение..." : "🚀 Перейти в дашборд →"}
            </button>
          ) : (
            <button onClick={() => { if (step === STEPS.length - 2) save(); setStep(s => s + 1); }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
              Далее →
            </button>
          )}
        </div>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep(s => s + 1)} className="w-full text-center text-slate-500 text-xs hover:text-slate-300">
            Пропустить этот шаг
          </button>
        )}
      </div>
    </div>
  );
}
