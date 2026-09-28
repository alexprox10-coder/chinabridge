import Link from "next/link";

export const metadata = {
  title: "ChinaBridge Docs — AI автоматизация таможенных документов",
  description: "Загрузите китайский инвойс — AI определит ТН ВЭД, рассчитает пошлины и подготовит пакет для брокера за 2 минуты",
};

const FEATURES = [
  { icon: "🇨🇳", title: "Читает иероглифы", desc: "Claude Vision распознаёт китайские документы, WeChat-скрины, рукописные накладные" },
  { icon: "📋", title: "Определяет ТН ВЭД", desc: "10-значный код ЕАЭС с уровнем уверенности и альтернативными вариантами" },
  { icon: "💰", title: "Считает пошлины", desc: "Пошлина + НДС + таможенный сбор. Россия и Казахстан" },
  { icon: "✅", title: "Проверяет на ошибки", desc: "Занижение стоимости, отсутствие сертификатов, требования WB/Ozon/Kaspi" },
  { icon: "📄", title: "Пакет для брокера", desc: "PDF с кодами, расчётами и примечаниями — сразу готов к подаче" },
  { icon: "⚡", title: "2 минуты", desc: "Вместо 2 часов ручной работы брокера" },
];

const PLANS = [
  { name: "Бесплатно", price: "0 ₽", limit: "3 документа", badge: "", href: "/docs/upload", cta: "Попробовать" },
  { name: "Старт", price: "2 990 ₽/мес", limit: "20 документов", badge: "", href: "https://t.me/chinabridge_pay_bot", cta: "Подключить" },
  { name: "Про", price: "7 990 ₽/мес", limit: "100 документов + API", badge: "Популярный", href: "https://t.me/chinabridge_pay_bot", cta: "Подключить" },
  { name: "Брокер", price: "19 990 ₽/мес", limit: "Безлимит + white-label", badge: "", href: "https://t.me/chinabridge_pay_bot", cta: "Обсудить" },
];

export default function DocsPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", background: "#050d1a", color: "#fff", minHeight: "100vh" }}>
      <style>{`
        .plan-card { transition: border-color 0.2s, transform 0.15s; }
        .plan-card:hover { border-color: #229ED9 !important; transform: translateY(-2px); }
      `}</style>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(34,158,217,0.15)", border: "1px solid rgba(34,158,217,0.4)", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#229ED9", marginBottom: 24 }}>
          🆕 ChinaBridge Docs — AI таможенный ассистент
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px" }}>
          Китайский инвойс → Таможенный пакет<br />
          <span style={{ color: "#229ED9" }}>за 2 минуты</span>
        </h1>
        <p style={{ fontSize: 18, color: "#8899aa", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.6 }}>
          AI читает иероглифы, определяет ТН ВЭД ЕАЭС, рассчитывает пошлины и проверяет документы на ошибки.
          Готовый пакет для таможенного брокера.
        </p>
        <Link href="/docs/upload" style={{
          display: "inline-block",
          background: "#229ED9",
          color: "#fff",
          padding: "16px 40px",
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 17,
          textDecoration: "none",
          transition: "background 0.2s",
        }}>
          Загрузить документ бесплатно →
        </Link>
        <p style={{ marginTop: 14, fontSize: 13, color: "#5a7899" }}>3 документа бесплатно · Без регистрации</p>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e3a5f", borderRadius: 16, padding: "24px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: "center" }}>Как это работает</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["1", "Загружаете фото инвойса", "JPG, PNG, PDF, скрин из WeChat — любой формат"],
            ["2", "AI читает документ", "Claude Vision извлекает все данные, переводит с китайского"],
            ["3", "Определяет ТН ВЭД ЕАЭС", "10-значный код для каждого товара с уровнем уверенности"],
            ["4", "Считает таможенные платежи", "Пошлина + НДС + сборы для России и Казахстана"],
            ["5", "Проверяет на ошибки", "Занижение стоимости, отсутствие сертификатов, требования маркетплейсов"],
            ["6", "Формирует PDF-пакет", "Скачиваете готовый пакет документов для брокера"],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: "flex", gap: 20, padding: "16px 0", borderBottom: "1px solid #1e3a5f" }}>
              <div style={{ width: 36, height: 36, background: "#229ED9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{num}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#8899aa" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: "center" }}>Тарифы</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {PLANS.map((p) => (
            <Link key={p.name} href={p.href} target={p.href.startsWith("http") ? "_blank" : undefined} rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="plan-card" style={{
                background: p.badge ? "rgba(34,158,217,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${p.badge ? "rgba(34,158,217,0.6)" : "#1e3a5f"}`,
                borderRadius: 16,
                padding: "24px 20px",
                position: "relative",
                cursor: "pointer",
                height: "100%",
              }}>
                {p.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#229ED9", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 12, fontWeight: 700 }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#229ED9", marginBottom: 8 }}>{p.price}</div>
                <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 16 }}>{p.limit}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#229ED9" }}>{p.cta} →</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/docs/upload" style={{
            display: "inline-block",
            background: "#229ED9",
            color: "#fff",
            padding: "14px 36px",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
          }}>
            Начать бесплатно →
          </Link>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e3a5f", borderRadius: 20, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Остались вопросы?</h2>
          <p style={{ fontSize: 15, color: "#8899aa", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            Менеджер поможет выбрать тариф, ответит на вопросы по интеграции и документам
          </p>
          <Link href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-block",
            background: "#229ED9",
            color: "#fff",
            padding: "14px 32px",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}>
            Написать менеджеру →
          </Link>
        </div>
      </section>

    </main>
  );
}
