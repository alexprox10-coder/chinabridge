import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Реквизиты ChinaBridge — официальная информация о компании",
  description: "Официальные реквизиты ChinaBridge. Информация для клиентов и партнеров. ИП Попков Виталий Михайлович, ИНН 280114439648, банк Точка.",
  keywords: "реквизиты ChinaBridge, ИНН, ОГРНИП, расчётный счёт, банковские реквизиты",
  alternates: { canonical: "https://chinabridge.pro/requisites" },
  openGraph: {
    title: "Реквизиты ChinaBridge — официальная информация о компании",
    description: "Официальные реквизиты для заключения договора и оплаты услуг.",
    url: "https://chinabridge.pro/requisites",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ChinaBridge",
  legalName: "Индивидуальный предприниматель Попков Виталий Михайлович",
  taxID: "280114439648",
  url: "https://chinabridge.pro",
  email: "info@chinabridge.pro",
  address: {
    "@type": "PostalAddress",
    addressCountry: "RU",
    addressRegion: "Амурская область",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Russian",
  },
};

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-[#243a5e]/60 last:border-0">
      <span className="text-xs text-[#8899aa] uppercase tracking-wide font-medium">{label}</span>
      <span className={`text-white text-sm ${mono ? "font-mono tracking-wider" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#00A86B]/15 border border-[#00A86B]/25 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
  );
}

export default function RequisitesPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Реквизиты" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#00A86B] flex items-center justify-center text-white font-bold text-lg shrink-0">
            CB
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Реквизиты ChinaBridge</h1>
            <p className="text-[#8899aa] text-base max-w-xl">
              Официальные реквизиты индивидуального предпринимателя.
              Используйте данные для заключения договора и оплаты услуг.
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3">
          {["Официальный ИП", "Банк Точка", "Договор и акты"].map((badge) => (
            <span
              key={badge}
              className="text-xs px-3 py-1.5 bg-[#00A86B]/15 border border-[#00A86B]/30 text-[#00A86B] rounded-full font-medium"
            >
              ✓ {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Main grid */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Company info */}
          <Card className="lg:col-span-2">
            <CardTitle icon="🏢" title="Информация о компании" />
            <div className="grid sm:grid-cols-2 gap-x-10">
              <div>
                <Field
                  label="Полное наименование"
                  value="Индивидуальный предприниматель Попков Виталий Михайлович"
                />
                <Field label="ИНН" value="280114439648" mono />
                <Field label="ОГРНИП" value="По запросу" />
                <Field label="Дата регистрации" value="По запросу" />
              </div>
              <div>
                <Field label="Регион регистрации" value="Амурская область" />
                <Field label="Юридический адрес" value="По запросу" />
                <Field label="Система налогообложения" value="УСН" />
                <Field label="Статус плательщика НДС" value="Без НДС" />
              </div>
            </div>
          </Card>

          {/* Bank details */}
          <Card>
            <CardTitle icon="🏦" title="Банковские реквизиты" />
            <Field label="Банк" value='ООО "Банк Точка"' />
            <Field label="БИК" value="044525104" mono />
            <Field label="Расчётный счёт" value="40802810720001034144" mono />
            <Field label="Корреспондентский счёт" value="30101810745374525104" mono />

            {/* Copy hint */}
            <p className="mt-4 text-xs text-[#8899aa] bg-[#0B1F3A]/60 rounded-xl px-4 py-3 border border-[#243a5e]/50">
              При оплате укажите в назначении платежа номер договора или счёта.
            </p>
          </Card>

          {/* Contacts */}
          <Card>
            <CardTitle icon="📬" title="Контакты" />
            <div className="space-y-4">
              <a
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#229ED9]/15 flex items-center justify-center text-base">✈️</div>
                <div>
                  <div className="text-xs text-[#8899aa]">Telegram</div>
                  <div className="text-sm text-white font-medium group-hover:text-[#00A86B] transition-colors">
                    @ChinaBridgeLID_bot
                  </div>
                </div>
              </a>

              <a
                href="https://wa.me/79145889874"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00A86B]/15 flex items-center justify-center text-base">✉️</div>
                <div>
                  <div className="text-xs text-[#8899aa]">Email</div>
                  <div className="text-sm text-white font-medium group-hover:text-[#00A86B] transition-colors">
                    info@chinabridge.pro
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#F5A623]/15 flex items-center justify-center text-base">📍</div>
                <div>
                  <div className="text-xs text-[#8899aa]">Адрес для связи</div>
                  <div className="text-sm text-white font-medium">Россия, Благовещенск</div>
                  <div className="text-xs text-[#8899aa]">Представительство в Китае</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <CardTitle icon="📄" title="Документы" />
            <div className="space-y-2">
              {[
                { label: "Политика конфиденциальности", href: "/privacy", icon: "🔒" },
                { label: "Пользовательское соглашение", href: "/terms", icon: "📋" },
                { label: "Договор оказания услуг", href: "/contract", icon: "🤝" },
              ].map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#243a5e]/60 hover:border-[#00A86B]/40 hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base">{doc.icon}</span>
                  <span className="text-sm text-[#8899aa] group-hover:text-white transition-colors flex-1">
                    {doc.label}
                  </span>
                  <span className="text-[#00A86B] text-xs">Открыть →</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#8899aa]">
              Документы доступны для скачивания. По запросу предоставляем подписанные оригиналы.
            </p>
          </Card>

          {/* B2B */}
          <Card>
            <CardTitle icon="🤝" title="Как мы работаем с юридическими лицами" />
            <p className="text-[#8899aa] text-sm mb-5">
              Работаем с ИП и ООО. Полный документооборот, официальные закрывающие документы.
            </p>
            <div className="space-y-3">
              {[
                { icon: "📃", text: "Договор оказания услуг" },
                { icon: "💰", text: "Расчёт стоимости доставки" },
                { icon: "📊", text: "Коммерческое предложение" },
                { icon: "🛡️", text: "Сопровождение сделки" },
                { icon: "📑", text: "Акты и счета-фактуры" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-sm shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-sm text-white">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Запросить документы →
              </Link>
            </div>
          </Card>

        </div>
      </section>

      {/* Bottom strip */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#0f2644] to-[#0B1F3A] border border-[#243a5e] rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Нужен договор?</p>
            <p className="text-[#8899aa] text-xs mt-0.5">Подготовим и вышлем в течение 1 рабочего дня</p>
          </div>
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Написать в Telegram →
          </Link>
        </div>
      </section>
    </main>
  );
}
