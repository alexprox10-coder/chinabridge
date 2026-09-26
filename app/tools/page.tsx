import Link from "next/link";
import type { Metadata } from "next";

const hoverStyle = `
  .tool-card { transition: border-color 0.2s; }
  .tool-card:hover { border-color: #00A86B !important; }
`;

export const metadata: Metadata = {
  title: "Инструменты для импортёров | ChinaBridge",
  description: "Инструменты для работы с китайскими поставщиками: распознавание инвойсов, расчёт стоимости доставки, анализ товарных позиций.",
  alternates: { canonical: "https://chinabridge.pro/tools" },
};

const tools = [
  {
    href: "/tools/invoice",
    emoji: "📄",
    title: "Распознавание инвойса",
    desc: "Загрузи фото инвойса из WeChat или почты — читаем иероглифы, извлекаем позиции и сразу считаем стоимость карго.",
    tags: ["OCR · ZH→RU", "Расчёт доставки", "Китай"],
    badge: "Новое",
  },
  {
    href: "/ai-calculator",
    emoji: "🧮",
    title: "Калькулятор доставки",
    desc: "Рассчитай стоимость карго из Китая по маршруту, весу и типу товара. Сразу получи несколько вариантов.",
    tags: ["RU · KZ", "Авто · Авиа", "Мгновенно"],
    badge: null,
  },
];

export default function ToolsPage() {
  return (
    <main style={{ background: "#0B1F3A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: hoverStyle }} />
      <div style={{ borderBottom: "1px solid #243a5e", padding: "16px 24px" }}>
        <a href="/" style={{ color: "#00A86B", fontSize: "14px", textDecoration: "none" }}>← ChinaBridge</a>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "12px" }}>
            Инструменты для импортёра
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>
            Инструменты для работы с китайскими поставщиками и расчёта доставки.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="tool-card" style={{
                background: "#0f2644",
                border: "1px solid #243a5e",
                borderRadius: "16px",
                padding: "28px",
                cursor: "pointer",
                height: "100%",
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ fontSize: "36px" }}>{tool.emoji}</span>
                  {tool.badge && (
                    <span style={{ background: "#00A86B22", border: "1px solid #00A86B44", color: "#00A86B", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px" }}>
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{tool.title}</h2>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>{tool.desc}</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {tool.tags.map((tag) => (
                    <span key={tag} style={{ background: "#0B1F3A", border: "1px solid #243a5e", color: "#64748b", fontSize: "11px", padding: "3px 10px", borderRadius: "20px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
