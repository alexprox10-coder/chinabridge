import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — ChinaBridge",
  description: "Политика конфиденциальности ChinaBridge. Порядок сбора, хранения и обработки персональных данных.",
  alternates: { canonical: "https://chinabridge.pro/privacy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-[#8899aa] text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Реквизиты", href: "/requisites" },
          { label: "Политика конфиденциальности" },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs text-[#8899aa] mb-2">Последнее обновление: 01 ноября 2024 г.</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Политика конфиденциальности</h1>
          <p className="text-[#8899aa]">
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты информации
            о пользователях сайта <strong className="text-white">chinabridge.pro</strong>.
          </p>
        </div>

        <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6 md:p-8 space-y-0">

          <Section title="1. Оператор персональных данных">
            <p>
              Оператором персональных данных является Индивидуальный предприниматель
              Попков Виталий Михайлович, ИНН 280114439648 (далее — «Оператор», «ChinaBridge»).
            </p>
            <p>Контакт: info@chinabridge.pro, Telegram: @ChinaBridgeLID_bot</p>
          </Section>

          <Section title="2. Какие данные мы собираем">
            <p>При использовании сайта мы можем собирать следующие данные:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Имя и контактные данные (при заполнении форм)</li>
              <li>Адрес электронной почты</li>
              <li>Номер телефона или Telegram-аккаунт</li>
              <li>Информация о грузе (вес, объём, маршрут) — для расчёта стоимости</li>
              <li>Технические данные: IP-адрес, тип браузера, страницы посещения</li>
            </ul>
          </Section>

          <Section title="3. Цели обработки данных">
            <ul className="list-disc pl-5 space-y-1">
              <li>Обработка заявок и расчёт стоимости доставки</li>
              <li>Связь с клиентом по вопросу заявки</li>
              <li>Заключение и исполнение договора</li>
              <li>Улучшение работы сайта и качества сервиса</li>
              <li>Соблюдение требований законодательства РФ</li>
            </ul>
          </Section>

          <Section title="4. Правовые основания">
            <p>
              Обработка данных осуществляется на основании Федерального закона
              от 27.07.2006 № 152-ФЗ «О персональных данных».
              Основание — согласие субъекта данных и исполнение договора.
            </p>
          </Section>

          <Section title="5. Передача данных третьим лицам">
            <p>
              Мы не продаём и не передаём ваши данные третьим лицам без вашего согласия,
              за исключением случаев, предусмотренных законодательством, а также
              партнёрам, привлечённым для исполнения договора (перевозчики, таможенные брокеры).
            </p>
          </Section>

          <Section title="6. Хранение и защита данных">
            <p>
              Данные хранятся на защищённых серверах и не дольше, чем это необходимо
              для выполнения указанных целей или установлено законом.
              Мы применяем технические и организационные меры защиты.
            </p>
          </Section>

          <Section title="7. Права пользователя">
            <p>Вы вправе:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Запросить информацию об обрабатываемых данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Потребовать удаления данных</li>
            </ul>
            <p className="mt-2">Запросы направляйте на: info@chinabridge.pro</p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Сайт использует файлы cookie для аналитики и улучшения работы.
              Продолжая использовать сайт, вы соглашаетесь с их использованием.
              Вы можете отключить cookies в настройках браузера.
            </p>
          </Section>

          <Section title="9. Изменения политики">
            <p>
              Мы оставляем за собой право обновлять данную политику. Актуальная версия
              всегда доступна на этой странице. При существенных изменениях мы уведомим
              пользователей через сайт.
            </p>
          </Section>

        </div>
      </article>
    </main>
  );
}
