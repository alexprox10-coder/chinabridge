import { AdminNav } from "@/components/admin/AdminNav";

const INTEGRATIONS = [
  {
    name: "Google Analytics 4",
    icon: "📊",
    description: "Отслеживание трафика, конверсий, событий на сайте chinabridge.pro",
    status: "demo",
    platform: "google",
  },
  {
    name: "Яндекс.Метрика",
    icon: "🟡",
    description: "Аналитика для русскоязычной аудитории, вебвизор, карты кликов",
    status: "inactive",
    platform: "yandex",
  },
  {
    name: "Google Ads",
    icon: "🔵",
    description: "Управление контекстной рекламой, автоматический импорт данных кампаний",
    status: "inactive",
    platform: "google",
  },
  {
    name: "Яндекс Директ",
    icon: "🟠",
    description: "Контекстная реклама в Яндексе, РСЯ, ретаргетинг",
    status: "inactive",
    platform: "yandex",
  },
  {
    name: "VK Реклама",
    icon: "💙",
    description: "Таргетированная реклама ВКонтакте, MyTarget",
    status: "inactive",
    platform: "vk",
  },
  {
    name: "Telegram Ads",
    icon: "✈️",
    description: "Официальная реклама в Telegram через платформу ads.telegram.org",
    status: "inactive",
    platform: "telegram",
  },
  {
    name: "Meta Ads",
    icon: "🔵",
    description: "Facebook / Instagram реклама (ограниченный доступ из РФ)",
    status: "inactive",
    platform: "meta",
  },
  {
    name: "Авито",
    icon: "🟢",
    description: "Продвижение объявлений и брендирование на Авито",
    status: "inactive",
    platform: "avito",
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <AdminNav />
      <div className="px-4 lg:px-8 py-6 max-w-4xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-100">Интеграции</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Рекламные кабинеты и аналитика — адаптеры для Marketing AI
          </p>
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INTEGRATIONS.map((intg) => (
            <div
              key={intg.name}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-3 ${
                intg.status === "demo"
                  ? "border-amber-700/30"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{intg.icon}</span>
                  <p className="text-sm font-semibold text-slate-100">{intg.name}</p>
                </div>
                {intg.status === "demo" ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/40">
                    Демо
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                    Не подключено
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{intg.description}</p>
              {intg.status === "demo" ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">API Key</p>
                  <p className="text-sm font-mono text-slate-400 tracking-widest">●●●●●●●●●●●●</p>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full text-xs py-2 bg-slate-800 text-slate-600 rounded-xl cursor-not-allowed"
                >
                  Подключить (скоро)
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Architecture info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Архитектура адаптеров</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Marketing AI получает данные из рекламных кабинетов через адаптеры.
            Каждый адаптер нормализует метрики к единому формату и сохраняет их в таблицу{" "}
            <code className="text-red-400 bg-slate-800 px-1 rounded">marketing_channels</code>.
            После подключения — реальные данные автоматически заменяют ДЕМО в правой панели чата.
          </p>
          <pre className="text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto font-mono">
{`// Формат нормализованных данных канала
interface ChannelMetrics {
  name: string;       // "Telegram Ads"
  platform: string;  // "telegram"
  spend_total: number;   // расход ₽
  leads_total: number;   // кол-во лидов
  trials_total: number;  // триалы / пробные
  payments_total: number; // оплаты
}

// Адаптер вызывается ежедневно через cron
// и обновляет marketing_channels через UPSERT`}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full">✓ GA4 готов (ДЕМО)</span>
            <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full">○ Метрика — Q3 2026</span>
            <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full">○ Директ — Q3 2026</span>
            <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full">○ VK — Q4 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}
