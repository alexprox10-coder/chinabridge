import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Пользовательское соглашение — ChinaBridge",
  description: "Пользовательское соглашение ChinaBridge. Условия использования сайта и сервисов.",
  alternates: { canonical: "https://chinabridge.pro/terms" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-[#8899aa] text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Реквизиты", href: "/requisites" },
          { label: "Пользовательское соглашение" },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs text-[#8899aa] mb-2">Последнее обновление: 01 ноября 2024 г.</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Пользовательское соглашение</h1>
          <p className="text-[#8899aa]">
            Настоящее Соглашение регулирует условия использования сайта{" "}
            <strong className="text-white">chinabridge.pro</strong> и сервисов ChinaBridge.
            Используя сайт, вы принимаете условия настоящего Соглашения.
          </p>
        </div>

        <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6 md:p-8">

          <Section title="1. Общие положения">
            <p>
              Сайт chinabridge.pro принадлежит ИП Попкову Виталию Михайловичу,
              ИНН 280114439648 (далее — «ChinaBridge», «Исполнитель»).
            </p>
            <p>
              Доступ к сайту и его использование означают безоговорочное принятие
              условий настоящего Соглашения.
            </p>
          </Section>

          <Section title="2. Предмет соглашения">
            <p>ChinaBridge предоставляет через сайт:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Информацию об услугах по доставке грузов из Китая</li>
              <li>Онлайн-калькулятор расчёта стоимости доставки</li>
              <li>Возможность оставить заявку на услуги</li>
              <li>Контент в виде статей, руководств и FAQ</li>
            </ul>
          </Section>

          <Section title="3. Права и обязанности пользователя">
            <p>Пользователь обязуется:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Использовать сайт только в законных целях</li>
              <li>Предоставлять достоверные данные при заполнении форм</li>
              <li>Не предпринимать действий, нарушающих работу сайта</li>
              <li>Не копировать и не распространять контент сайта без разрешения</li>
            </ul>
          </Section>

          <Section title="4. Права и обязанности ChinaBridge">
            <p>ChinaBridge вправе:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Изменять, приостанавливать или прекращать работу сайта</li>
              <li>Обновлять контент и условия Соглашения</li>
              <li>Ограничивать доступ при нарушении условий</li>
            </ul>
            <p className="mt-2">ChinaBridge обязуется:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Обрабатывать персональные данные согласно Политике конфиденциальности</li>
              <li>Отвечать на запросы в разумные сроки</li>
            </ul>
          </Section>

          <Section title="5. Ответственность">
            <p>
              Расчёты в калькуляторе носят ориентировочный характер.
              Окончательная стоимость определяется по результатам переговоров и
              заключённого договора. ChinaBridge не несёт ответственности за
              ущерб, возникший вследствие использования данных калькулятора как
              окончательных.
            </p>
            <p>
              ChinaBridge не гарантирует бесперебойную работу сайта и не несёт
              ответственности за временную недоступность сервиса.
            </p>
          </Section>

          <Section title="6. Интеллектуальная собственность">
            <p>
              Все материалы сайта — тексты, изображения, логотипы, дизайн —
              являются собственностью ChinaBridge. Использование без письменного
              разрешения запрещено.
            </p>
          </Section>

          <Section title="7. Применимое право">
            <p>
              Соглашение регулируется законодательством Российской Федерации.
              Все споры разрешаются в суде по месту нахождения Исполнителя
              (Амурская область, г. Благовещенск).
            </p>
          </Section>

          <Section title="8. Изменения соглашения">
            <p>
              ChinaBridge вправе вносить изменения в настоящее Соглашение в любое время.
              Актуальная версия опубликована на данной странице.
              Продолжение использования сайта после изменений означает их принятие.
            </p>
          </Section>

          <Section title="9. Контакты">
            <p>По вопросам, связанным с настоящим Соглашением:</p>
            <p>Email: info@chinabridge.pro</p>
            <p>Telegram: @ChinaBridgeLID_bot</p>
          </Section>

        </div>
      </article>
    </main>
  );
}
