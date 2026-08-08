"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─── Keyframe animations ────────────────────────────────────────────────── */
const KF = `
@keyframes fadeInUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn     { from{opacity:0} to{opacity:1} }
@keyframes scaleIn    { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
@keyframes slideLeft  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
@keyframes floatBob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes glowPulse  { 0%,100%{box-shadow:0 0 20px rgba(139,92,246,.3)} 50%{box-shadow:0 0 50px rgba(139,92,246,.7)} }
@keyframes checkPop   { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
@keyframes confetti0  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(120vh) rotate(720deg);opacity:0} }
@keyframes confetti1  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(-540deg);opacity:0} }
@keyframes confetti2  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(130vh) rotate(900deg);opacity:0} }
@keyframes barGrow    { from{width:0} to{width:var(--tw)} }
@keyframes shimmer    { 0%{background-position:200% center} 100%{background-position:-200% center} }

.afu  { animation:fadeInUp  .55s ease-out both }
.af   { animation:fadeIn    .4s  ease-out both }
.asc  { animation:scaleIn   .4s  ease-out both }
.asl  { animation:slideLeft .4s  ease-out both }
.afb  { animation:floatBob  3s   ease-in-out infinite }
.agp  { animation:glowPulse 2.5s ease-in-out infinite }
.shimmer-text {
  background:linear-gradient(90deg,#a78bfa,#67e8f9,#a78bfa);
  background-size:200% auto;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  animation:shimmer 3s linear infinite;
}
`;

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Step = "welcome"|"company"|"creating"|"wow"|"tour"|"action"|"achievement"|"final";
interface Company { name:string; country:string; industry:string; employees:string }
interface Metrics  { leads:number; deals:number; revenue:number }

/* ─── Constants ──────────────────────────────────────────────────────────── */
const STEP_ORDER: Step[] = ["welcome","company","creating","wow","tour","action","achievement","final"];
const STEP_PCT: Record<Step,number> = {welcome:0,company:15,creating:30,wow:45,tour:60,action:75,achievement:90,final:100};

const DEPARTMENTS = [
  { id:"ceo",   icon:"🤖", name:"CEO AI",       color:"violet", tagline:"Стратегическое управление", caps:["Ежедневный бизнес-отчёт","Расстановка приоритетов","Стратегические рекомендации"] },
  { id:"sales", icon:"📞", name:"Sales AI",      color:"blue",   tagline:"Продажи и воронка",        caps:["Управление лидами","Скоринг сделок","Прогноз выручки"] },
  { id:"mkt",   icon:"📣", name:"Marketing AI",  color:"pink",   tagline:"Контент и продвижение",    caps:["Генерация контента","SMM-автопилот","Анализ целевой аудитории"] },
  { id:"ana",   icon:"📊", name:"Analytics AI",  color:"cyan",   tagline:"Бизнес-аналитика",         caps:["Real-time дашборды","Прогнозирование","KPI-отчёты"] },
  { id:"fin",   icon:"💰", name:"Finance AI",    color:"emerald",tagline:"Финансы и P&L",            caps:["Контроль денежных потоков","Расчёт рентабельности","Бюджетирование"] },
  { id:"ops",   icon:"🚚", name:"Operations AI", color:"amber",  tagline:"Логистика и процессы",     caps:["Оптимизация маршрутов","Контроль поставок","Автоматизация задач"] },
  { id:"str",   icon:"🎯", name:"Strategy AI",   color:"rose",   tagline:"Планирование и рост",      caps:["Рыночный анализ","Сценарное планирование","Поиск новых рынков"] },
];

const CREATING_ITEMS = [
  "Инициализируем AI-компанию",
  "Настраиваем CRM и воронку продаж",
  "Генерируем демо-данные и аналитику",
  "Запускаем CEO AI и команду отделов",
  "Подключаем финансовый модуль",
  "Активируем маркетинговый AI",
  "Настраиваем системы аналитики",
];

const DAILY_TASKS = [
  "Создать первую сделку",
  "Добавить клиента в CRM",
  "Запустить AI-анализ рынка",
  "Сгенерировать контент-план",
];

const CONFETTI_COLORS = ["#a78bfa","#67e8f9","#34d399","#fb923c","#f472b6","#facc15"];

/* ─── Hooks ──────────────────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1600, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min((now - t0) / duration, 1);
      setVal(Math.round(ease(pct) * target));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return val;
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─── Skip button ────────────────────────────────────────────────────────── */
function SkipBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="fixed bottom-6 right-6 text-slate-600 hover:text-slate-400 text-sm transition z-40">
      Пропустить →
    </button>
  );
}

/* ══ STEP: Welcome ══════════════════════════════════════════════════════════ */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <div className="afb text-8xl mb-6 select-none">🤖</div>
      <div className="afu" style={{ animationDelay: ".1s" }}>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-3">
          Добро пожаловать в<br />
          <span className="shimmer-text">ChinaBridge</span>
        </h1>
      </div>
      <div className="afu" style={{ animationDelay: ".25s" }}>
        <p className="text-slate-400 text-lg max-w-md mb-4 leading-relaxed">
          Я — CEO AI. За следующие <strong className="text-white">10 минут</strong> я покажу, как AI-компания работает за вас
          — пока вы пьёте кофе.
        </p>
      </div>
      <div className="afu flex flex-col sm:flex-row items-center gap-3" style={{ animationDelay: ".4s" }}>
        <button onClick={onNext}
          className="agp px-10 py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-violet-900/30">
          ▶ Запустить демонстрацию
        </button>
      </div>
      <p className="text-slate-600 text-sm mt-8">~10 минут · Нет привязки карты · Можно пропустить</p>
    </div>
  );
}

/* ══ STEP: Company Form ══════════════════════════════════════════════════════ */
function StepCompany({ onNext }: { onNext: (c: Company) => void }) {
  const [form, setForm] = useState<Company>({ name: "", country: "Россия", industry: "Торговля / Импорт", employees: "1–10" });
  const set = (k: keyof Company, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md">
        <div className="afu text-center mb-8">
          <div className="text-5xl mb-3">🏗️</div>
          <h2 className="text-3xl font-black text-white mb-2">Расскажите о компании</h2>
          <p className="text-slate-400 text-sm">CEO AI персонализирует платформу под ваш бизнес</p>
        </div>
        <div className="asc bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4" style={{ animationDelay: ".15s" }}>
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Название компании *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 hover:border-slate-500 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition"
              placeholder="ООО «МегаТрейд»" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1.5">Страна</label>
              <select value={form.country} onChange={e => set("country", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition appearance-none">
                {["Россия","Казахстан","Беларусь","Узбекистан","ОАЭ","Другое"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1.5">Сотрудников</label>
              <select value={form.employees} onChange={e => set("employees", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition appearance-none">
                {["1–10","11–50","51–200","200+"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Чем занимаетесь</label>
            <select value={form.industry} onChange={e => set("industry", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition appearance-none">
              {["Торговля / Импорт","Логистика","Производство","Ритейл / E-commerce","IT / Технологии","Другое"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => onNext(form)} disabled={!form.name.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02]">
            Создать AI-компанию →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ STEP: Creating ══════════════════════════════════════════════════════════ */
function StepCreating({ company, onDone }: { company: Company | null; onDone: (m: Metrics) => void }) {
  const [checked, setChecked] = useState<number[]>([]);
  const [metrics, setMetrics]  = useState<Metrics | null>(null);

  useEffect(() => {
    // Show items one by one
    CREATING_ITEMS.forEach((_, i) => {
      setTimeout(() => setChecked(c => [...c, i]), 500 + i * 600);
    });
    // Call setup API in background
    fetch("/api/onboarding/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    }).then(r => r.json()).then(d => {
      if (d.metrics) setMetrics(d.metrics);
    }).catch(() => {});
    // Advance after all items shown
    const total = 500 + CREATING_ITEMS.length * 600 + 800;
    const timer = setTimeout(() => {
      onDone(metrics ?? { leads: 10, deals: 3, revenue: 287000 });
    }, total);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 afb">⚙️</div>
          <h2 className="text-3xl font-black text-white mb-2">Создаём вашу<br /><span className="shimmer-text">AI-компанию</span></h2>
          {company && <p className="text-slate-400 text-sm">«{company.name}» · {company.industry}</p>}
        </div>
        <div className="space-y-3">
          {CREATING_ITEMS.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-500 ${
              checked.includes(i)
                ? "bg-emerald-900/20 border-emerald-700/50"
                : "bg-slate-900 border-slate-800 opacity-40"
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${
                checked.includes(i) ? "bg-emerald-500" : "bg-slate-700"
              }`} style={checked.includes(i) ? { animation: "checkPop .4s ease-out both" } : {}}>
                {checked.includes(i) ? "✓" : ""}
              </div>
              <span className={`text-sm transition-colors ${checked.includes(i) ? "text-white" : "text-slate-500"}`}>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.round((checked.length / CREATING_ITEMS.length) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ══ STEP: WOW Moment ════════════════════════════════════════════════════════ */
function StepWow({ company, metrics, onNext }: { company: Company | null; metrics: Metrics; onNext: () => void }) {
  const leads   = useCounter(metrics.leads,   1200);
  const deals   = useCounter(metrics.deals,   900);
  const revenue = useCounter(metrics.revenue, 1800);

  const recommendations = [
    `Добавьте первые контакты в CRM — это начало вашей воронки продаж`,
    `Настройте Telegram для автопостинга контента и уведомлений`,
    `Изучите Finance AI, чтобы найти точки экономии и роста`,
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-lg">
        {/* CEO speaks */}
        <div className="afu flex items-start gap-4 mb-6">
          <div className="text-5xl shrink-0 afb">🤖</div>
          <div className="bg-slate-800 border border-violet-700/40 rounded-2xl rounded-tl-none p-4">
            <p className="text-white font-semibold mb-1">CEO AI</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {company ? `«${company.name}» — ` : ""}AI-компания запущена! Вот что уже произошло за последний месяц на платформе:
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="afu grid grid-cols-3 gap-3 mb-6" style={{ animationDelay: ".15s" }}>
          {[
            { label: "Новых лидов",    val: leads,   icon: "👥", color: "text-violet-400" },
            { label: "Сделок",         val: deals,   icon: "🤝", color: "text-cyan-400"   },
            { label: "Прибыль ₽",      val: revenue.toLocaleString("ru"), icon: "💰", color: "text-emerald-400" },
          ].map(m => (
            <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
              <div className="text-slate-500 text-xs mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="afu bg-slate-900 border border-violet-700/30 rounded-2xl p-5 mb-6" style={{ animationDelay: ".3s" }}>
          <p className="text-violet-300 font-semibold text-sm mb-3">💡 Мои рекомендации на сегодня:</p>
          <ol className="space-y-2">
            {recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span> {r}
              </li>
            ))}
          </ol>
        </div>

        <button onClick={onNext}
          className="afu w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all hover:scale-[1.02]"
          style={{ animationDelay: ".45s" }}>
          Отлично! Покажи мне платформу →
        </button>
      </div>
    </div>
  );
}

/* ══ STEP: Department Tour ═══════════════════════════════════════════════════ */
function StepTour({ onNext }: { onNext: () => void }) {
  const [active, setActive]   = useState(0);
  const [paused, setPaused]   = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActive(a => (a + 1) % DEPARTMENTS.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(t);
  }, [paused]);

  const dept = DEPARTMENTS[active];
  const colorMap: Record<string,string> = {
    violet:"border-violet-600/60 text-violet-300 bg-violet-900/20",
    blue:"border-blue-600/60 text-blue-300 bg-blue-900/20",
    pink:"border-pink-600/60 text-pink-300 bg-pink-900/20",
    cyan:"border-cyan-600/60 text-cyan-300 bg-cyan-900/20",
    emerald:"border-emerald-600/60 text-emerald-300 bg-emerald-900/20",
    amber:"border-amber-600/60 text-amber-300 bg-amber-900/20",
    rose:"border-rose-600/60 text-rose-300 bg-rose-900/20",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 afu">
          <h2 className="text-3xl font-black text-white mb-2">Ваша AI-команда</h2>
          <p className="text-slate-400 text-sm">7 AI-специалистов, которые работают 24/7</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <div className="lg:w-40 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {DEPARTMENTS.map((d, i) => (
              <button key={d.id} onClick={() => { setActive(i); setPaused(true); setVisible(true); }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all lg:w-full ${
                  i === active
                    ? "bg-slate-800 border-slate-500 scale-105"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-600"
                }`}>
                <span className="text-xl">{d.icon}</span>
                <span className="text-slate-400 text-xs leading-tight hidden lg:block">{d.name}</span>
              </button>
            ))}
          </div>

          {/* Main card */}
          <div className="flex-1">
            <div className={`rounded-2xl border p-6 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${colorMap[dept.color]}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{dept.icon}</span>
                <div>
                  <h3 className="text-white font-black text-xl">{dept.name}</h3>
                  <p className="text-slate-400 text-sm">{dept.tagline}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {dept.caps.map((cap, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400 text-xs">✓</span> {cap}
                  </div>
                ))}
              </div>
              {/* Dept progress */}
              <div className="mt-5 flex items-center gap-2">
                {DEPARTMENTS.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-500 ${i === active ? "bg-white" : "bg-slate-700"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => setPaused(p => !p)}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-500 hover:text-white transition">
            {paused ? "▶ Продолжить" : "⏸ Пауза"}
          </button>
          <button onClick={onNext}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all hover:scale-[1.01]">
            Попробовать AI →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ STEP: First Action ══════════════════════════════════════════════════════ */
const ACTIONS = [
  { id:"lead",    icon:"👥", title:"Создать первого лида",      desc:"AI добавит контакт в CRM и оценит потенциал сделки",  result:"🎉 Лид создан!",      detail:"Иван Петров добавлен в CRM. AI оценил потенциал: 187 000 ₽. Приоритет: HOT 🔥" },
  { id:"product", icon:"🔍", title:"Найти товар в Китае",       desc:"AI найдёт поставщиков и сравнит цены на вашу позицию", result:"✅ Товар найден!",     detail:"LED панели 60W: 3 поставщика, цена ¥28–35/шт, доставка 18-22 дня, маржа ~40%" },
  { id:"content", icon:"✍️", title:"Сгенерировать контент",      desc:"AI создаст пост для Telegram за несколько секунд",    result:"📝 Контент готов!",   detail:"«Импорт из Китая с ChinaBridge: сократите время поставки на 30% и увеличьте маржу — AI сам найдёт лучшего поставщика. 🚀 Попробуйте бесплатно!»" },
];

type ActionState = "picking"|"loading"|"done";

function StepAction({ onNext }: { onNext: () => void }) {
  const [state, setState]   = useState<ActionState>("picking");
  const [chosen, setChosen] = useState<typeof ACTIONS[0] | null>(null);
  const [dots, setDots]     = useState("");

  useEffect(() => {
    if (state !== "loading") return;
    const t = setInterval(() => setDots(d => d.length < 3 ? d + "." : ""), 400);
    const advance = setTimeout(() => { clearInterval(t); setState("done"); }, 2400);
    return () => { clearInterval(t); clearTimeout(advance); };
  }, [state]);

  function pick(a: typeof ACTIONS[0]) {
    setChosen(a);
    setState("loading");
    fetch("/api/onboarding/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "action", action: a.id }),
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-lg">
        {state === "picking" && (
          <>
            <div className="text-center mb-8 afu">
              <div className="text-5xl mb-3">⚡</div>
              <h2 className="text-3xl font-black text-white mb-2">Попробуйте AI прямо сейчас</h2>
              <p className="text-slate-400 text-sm">Выберите одно из действий — результат через несколько секунд</p>
            </div>
            <div className="space-y-3">
              {ACTIONS.map((a, i) => (
                <button key={a.id} onClick={() => pick(a)}
                  className="afu w-full text-left p-5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-violet-600/60 rounded-2xl transition-all hover:scale-[1.01] group"
                  style={{ animationDelay: `${i * .1}s` }}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{a.icon}</span>
                    <div>
                      <div className="text-white font-semibold group-hover:text-violet-300 transition">{a.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{a.desc}</div>
                    </div>
                    <span className="ml-auto text-slate-600 group-hover:text-violet-400 transition text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {state === "loading" && chosen && (
          <div className="text-center asc">
            <div className="text-6xl mb-4 afb">🤖</div>
            <h2 className="text-2xl font-black text-white mb-2">AI работает{dots}</h2>
            <p className="text-slate-400 text-sm">{chosen.desc}</p>
            <div className="mt-8 flex justify-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i * .15}s` }} />
              ))}
            </div>
          </div>
        )}

        {state === "done" && chosen && (
          <div className="asc">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-white mb-1">{chosen.result}</h2>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-2xl p-5 mb-6">
              <p className="text-emerald-300 text-sm leading-relaxed">{chosen.detail}</p>
            </div>
            <button onClick={onNext}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all hover:scale-[1.02]">
              Получить полный доступ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ STEP: Achievement ═══════════════════════════════════════════════════════ */
const CONFETTI_ITEMS = Array.from({ length: 24 }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left:  `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.5}s`,
  dur:   `${3 + Math.random() * 2}s`,
  anim:  `confetti${i % 3}`,
}));

function StepAchievement({ onNext }: { onNext: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative overflow-hidden">
      {/* Confetti */}
      {show && CONFETTI_ITEMS.map((c, i) => (
        <div key={i} className="fixed top-0 pointer-events-none w-3 h-3 rounded-sm" style={{
          backgroundColor: c.color, left: c.left,
          animation: `${c.anim} ${c.dur} ${c.delay} ease-in forwards`,
        }} />
      ))}

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 afu">
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-4xl font-black text-white mb-2">AI-компания готова!</h2>
          <p className="text-slate-400 text-sm">Поздравляем — вы запустили цифровую компанию, которая уже умеет работать за вас</p>
        </div>

        <div className="asc bg-gradient-to-b from-emerald-900/20 to-slate-900 border border-emerald-700/40 rounded-2xl p-5 mb-6" style={{ animationDelay: ".2s" }}>
          <p className="text-emerald-300 font-semibold text-sm mb-3">Теперь платформа умеет:</p>
          {[
            "🔍 Искать и квалифицировать клиентов",
            "📊 Анализировать продажи и KPI",
            "✍️ Создавать контент для Telegram",
            "💰 Считать прибыль и управлять P&L",
            "🚚 Управлять логистикой и поставками",
            "🤖 Управлять компанией как CEO AI",
          ].map(item => (
            <div key={item} className="flex items-center gap-2 py-1.5 text-sm text-slate-300">
              <span>{item}</span>
            </div>
          ))}
        </div>

        <button onClick={onNext}
          className="afu w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all hover:scale-[1.02]"
          style={{ animationDelay: ".4s" }}>
          Перейти к платформе →
        </button>
      </div>
    </div>
  );
}

/* ══ STEP: Final ═════════════════════════════════════════════════════════════ */
function StepFinal({ company, onFinish }: { company: Company | null; onFinish: () => void }) {
  const [loading, setLoading] = useState(false);

  const ceoMsg = company
    ? `${company.name}, я уже подготовил первый план развития!\n\nСегодня рекомендую:\n1. Добавьте реальные контакты в CRM\n2. Настройте Telegram-канал для контента\n3. Запустите аналитику продаж`
    : "Ваша AI-компания готова. Рекомендую начать с CRM и настройки Telegram.";

  async function finish() {
    setLoading(true);
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: company?.name }),
    }).catch(() => {});
    onFinish();
  }

  const MODULES = ["CEO AI","CRM","Analytics","Marketing","Sales","Finance","Operations"];
  const PROGRESS = [100, 85, 80, 75, 90, 70, 65];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 afu">
          <h2 className="text-3xl font-black text-white mb-2">🚀 Всё готово!</h2>
          <p className="text-slate-400 text-sm">Начните работать — демо-данные уже в платформе</p>
        </div>

        {/* Trial timer */}
        <div className="afu bg-gradient-to-r from-violet-900/30 to-cyan-900/30 border border-violet-700/50 rounded-2xl p-4 mb-4 flex items-center justify-between" style={{ animationDelay: ".1s" }}>
          <div>
            <div className="text-white font-bold">Пробный период</div>
            <div className="text-slate-400 text-xs">Полный доступ ко всем модулям</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-violet-400">14</div>
            <div className="text-slate-500 text-xs">дней</div>
          </div>
        </div>

        {/* Module progress */}
        <div className="asc bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 space-y-2.5" style={{ animationDelay: ".2s" }}>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Готовность AI-модулей</p>
          {MODULES.map((m, i) => (
            <div key={m} className="flex items-center gap-3">
              <span className="text-slate-300 text-xs w-20 shrink-0">{m}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${PROGRESS[i]}%` }} />
              </div>
              <span className="text-slate-500 text-xs w-8 text-right">{PROGRESS[i]}%</span>
            </div>
          ))}
        </div>

        {/* CEO message */}
        <div className="asc flex items-start gap-3 mb-6" style={{ animationDelay: ".3s" }}>
          <div className="text-3xl shrink-0">🤖</div>
          <div className="bg-slate-900 border border-violet-700/40 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {ceoMsg}
          </div>
        </div>

        {/* Daily tasks */}
        <div className="asc bg-slate-900 border border-amber-700/30 rounded-2xl p-4 mb-6" style={{ animationDelay: ".35s" }}>
          <p className="text-amber-300 font-semibold text-xs mb-3">📋 Сегодня попробуйте:</p>
          <div className="space-y-2">
            {DAILY_TASKS.map(t => (
              <div key={t} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 rounded border border-slate-600 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <button onClick={finish} disabled={loading}
          className="afu w-full py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-violet-900/30"
          style={{ animationDelay: ".45s" }}>
          {loading ? "⏳ Загружаем..." : "🚀 Начать работу →"}
        </button>
      </div>
    </div>
  );
}

/* ══ Main Orchestrator ═══════════════════════════════════════════════════════ */
export default function OnboardingWizard() {
  const router  = useRouter();
  const [step,    setStep]    = useState<Step>("welcome");
  const [company, setCompany] = useState<Company | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ leads: 10, deals: 3, revenue: 287000 });

  const logEvent = useCallback((s: Step, action: string) => {
    fetch("/api/onboarding/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: s, action }),
    }).catch(() => {});
  }, []);

  function next() {
    logEvent(step, "completed");
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  async function finish() {
    router.push("/admin/dashboard");
  }

  async function skip() {
    logEvent(step, "skipped");
    await fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <style>{KF}</style>
      <ProgressBar pct={STEP_PCT[step]} />
      {step !== "welcome" && step !== "final" && <SkipBtn onClick={skip} />}

      {step === "welcome"     && <StepWelcome onNext={next} />}
      {step === "company"     && <StepCompany onNext={(c) => { setCompany(c); next(); }} />}
      {step === "creating"    && <StepCreating company={company} onDone={(m) => { setMetrics(m); next(); }} />}
      {step === "wow"         && <StepWow company={company} metrics={metrics} onNext={next} />}
      {step === "tour"        && <StepTour onNext={next} />}
      {step === "action"      && <StepAction onNext={next} />}
      {step === "achievement" && <StepAchievement onNext={next} />}
      {step === "final"       && <StepFinal company={company} onFinish={finish} />}
    </div>
  );
}
