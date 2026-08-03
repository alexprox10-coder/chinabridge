import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Договор оказания услуг — ChinaBridge",
  description: "Публичная оферта ChinaBridge. Договор на оказание услуг по доставке грузов из Китая.",
  alternates: { canonical: "https://chinabridge.pro/contract" },
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3">
        {num}. {title}
      </h2>
      <div className="text-[#8899aa] text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function ContractPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Реквизиты", href: "/requisites" },
          { label: "Договор оказания услуг" },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs text-[#8899aa] mb-2">Редакция от 01 ноября 2024 г.</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Договор оказания услуг</h1>
          <p className="text-sm text-[#8899aa] font-medium">(Публичная оферта)</p>
          <div className="mt-4 p-4 bg-[#00A86B]/10 border border-[#00A86B]/25 rounded-xl text-sm text-[#8899aa]">
            Настоящий документ является публичной офертой ИП Попкова Виталия Михайловича
            (ИНН 280114439648) и содержит все существенные условия договора на оказание
            услуг по организации доставки грузов из Китая.
          </div>
        </div>

        <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6 md:p-8">

          <Section num="1" title="Термины и определения">
            <p><strong className="text-white">Исполнитель</strong> — ИП Попков Виталий Михайлович, ИНН 280114439648.</p>
            <p><strong className="text-white">Заказчик</strong> — физическое или юридическое лицо, принявшее условия настоящей оферты.</p>
            <p><strong className="text-white">Услуги</strong> — организация доставки грузов из КНР, выкуп товаров, поиск поставщиков, инспекция товара и сопутствующие услуги.</p>
            <p><strong className="text-white">Акцепт</strong> — оплата счёта Заказчиком или направление заявки, означающее принятие условий настоящего договора.</p>
          </Section>

          <Section num="2" title="Предмет договора">
            <p>
              Исполнитель обязуется по заданию Заказчика оказать услуги по организации
              доставки грузов из Китайской Народной Республики в Россию и Казахстан,
              а также сопутствующие услуги согласно выставленному счёту.
            </p>
            <p>Перечень услуг, стоимость и сроки определяются в коммерческом предложении или счёте.</p>
          </Section>

          <Section num="3" title="Права и обязанности Исполнителя">
            <p>Исполнитель обязуется:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Выполнить согласованный объём услуг в установленные сроки</li>
              <li>Уведомлять Заказчика об изменении сроков и условий</li>
              <li>Предоставить документы, подтверждающие оказание услуг (акт, счёт)</li>
              <li>Обеспечивать сохранность груза Заказчика на складе Исполнителя</li>
            </ul>
            <p className="mt-2">Исполнитель вправе:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Привлекать субподрядчиков для выполнения отдельных видов работ</li>
              <li>Приостановить оказание услуг при нарушении Заказчиком условий оплаты</li>
            </ul>
          </Section>

          <Section num="4" title="Права и обязанности Заказчика">
            <p>Заказчик обязуется:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Предоставить корректные данные о грузе (наименование, вес, объём, стоимость)</li>
              <li>Оплатить услуги в порядке и сроки, согласованные со счётом</li>
              <li>Соблюдать требования таможенного законодательства РФ/РК</li>
              <li>Не предъявлять к перевозке запрещённые и нелегальные товары</li>
            </ul>
          </Section>

          <Section num="5" title="Стоимость услуг и порядок расчётов">
            <p>
              Стоимость услуг определяется в коммерческом предложении или счёте,
              выставленном Исполнителем. Расчёты производятся:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Предоплата — 50–100% от стоимости услуг (согласно счёту)</li>
              <li>Оставшаяся часть — до выдачи груза Заказчику</li>
            </ul>
            <p className="mt-2">
              Банковские реквизиты указаны в разделе{" "}
              <Link href="/requisites" className="text-[#00A86B] hover:underline">Реквизиты</Link>.
            </p>
          </Section>

          <Section num="6" title="Сроки оказания услуг">
            <p>
              Сроки доставки указываются в коммерческом предложении и носят ориентировочный
              характер. Исполнитель не несёт ответственности за задержки, вызванные:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Действиями таможенных органов</li>
              <li>Форс-мажорными обстоятельствами</li>
              <li>Задержками поставщика Заказчика</li>
              <li>Ограничениями пограничных переходов</li>
            </ul>
          </Section>

          <Section num="7" title="Ответственность сторон">
            <p>
              В случае утраты или повреждения груза по вине Исполнителя, ответственность
              ограничивается стоимостью груза, указанной в инвойсе поставщика.
              При наличии страхования — страховым возмещением.
            </p>
            <p>
              Исполнитель не несёт ответственности за несоответствие товара ожиданиям
              Заказчика, если инспекция товара не была заказана.
            </p>
          </Section>

          <Section num="8" title="Конфиденциальность">
            <p>
              Стороны обязуются не разглашать коммерческую информацию, полученную в рамках
              сотрудничества, третьим лицам без взаимного согласия.
            </p>
          </Section>

          <Section num="9" title="Порядок разрешения споров">
            <p>
              Стороны стремятся урегулировать споры в досудебном порядке путём переговоров.
              При недостижении согласия споры рассматриваются в суде по месту нахождения
              Исполнителя (Амурская область, г. Благовещенск) в соответствии с законодательством РФ.
            </p>
          </Section>

          <Section num="10" title="Срок действия и акцепт оферты">
            <p>
              Настоящая оферта вступает в силу с момента публикации на сайте и действует
              бессрочно до момента её отзыва. Акцептом является оплата счёта или
              направление заявки на оказание услуг.
            </p>
          </Section>

          <Section num="11" title="Реквизиты Исполнителя">
            <p>Индивидуальный предприниматель Попков Виталий Михайлович</p>
            <p>ИНН: 280114439648</p>
            <p>Банк: ООО «Банк Точка»</p>
            <p>Р/с: 40802810720001034144</p>
            <p>БИК: 044525104</p>
            <p>К/с: 30101810745374525104</p>
            <p className="mt-2">
              Email: info@chinabridge.pro · Telegram: @ChinaBridgeLID_bot
            </p>
          </Section>

        </div>

        <div className="mt-6 p-4 bg-[#0f2644]/60 border border-[#243a5e] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Нужен подписанный экземпляр?</p>
            <p className="text-xs text-[#8899aa] mt-0.5">Вышлем скан с подписью и печатью в течение 1 рабочего дня</p>
          </div>
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Запросить →
          </Link>
        </div>
      </article>
    </main>
  );
}
