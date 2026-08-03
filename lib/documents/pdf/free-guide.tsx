import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";

// Roboto с поддержкой кириллицы из public/fonts/
Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public", "fonts", "Roboto-Bold.ttf"),    fontWeight: 700 },
    { src: path.join(process.cwd(), "public", "fonts", "Roboto-Light.ttf"),   fontWeight: 300 },
  ],
});

const GREEN = "#00A86B";
const DARK = "#060f1e";
const GRAY = "#555";
const LIGHT_BG = "#f4f8f6";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontWeight: 400,
    backgroundColor: "#ffffff",
    padding: 0,
  },
  coverPage: {
    backgroundColor: DARK,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverBadge: {
    backgroundColor: GREEN,
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "4 10",
    borderRadius: 4,
    marginBottom: 24,
    letterSpacing: 1,
  },
  coverTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    color: "#aac4b4",
    fontSize: 14,
    fontWeight: 300,
    textAlign: "center",
    lineHeight: 1.5,
    maxWidth: 340,
  },
  coverFooter: {
    position: "absolute",
    bottom: 40,
    color: GREEN,
    fontSize: 12,
    fontWeight: 700,
  },
  contentPage: {
    backgroundColor: "#ffffff",
    padding: "50 50 40 50",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 12,
    borderBottom: `2 solid ${GREEN}`,
  },
  headerBrand: {
    color: GREEN,
    fontSize: 11,
    fontWeight: 700,
  },
  headerPage: {
    color: GRAY,
    fontSize: 10,
  },
  pageTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    lineHeight: 1.3,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: GREEN,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  body: {
    color: "#333",
    fontSize: 11,
    lineHeight: 1.7,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 7,
  },
  bulletDot: {
    color: GREEN,
    fontSize: 11,
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    color: "#333",
    fontSize: 11,
    lineHeight: 1.6,
    flex: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    padding: "8 10",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottom: "1 solid #e0e0e0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "7 10",
    backgroundColor: LIGHT_BG,
    borderBottom: "1 solid #e0e0e0",
  },
  tableCell: {
    color: "#333",
    fontSize: 10,
    flex: 1,
  },
  tableCellGreen: {
    color: GREEN,
    fontSize: 10,
    fontWeight: 700,
    flex: 1,
  },
  tipCard: {
    backgroundColor: LIGHT_BG,
    borderLeft: `3 solid ${GREEN}`,
    padding: "10 14",
    marginBottom: 10,
    borderRadius: 2,
  },
  tipNumber: {
    color: GREEN,
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  tipText: {
    color: "#333",
    fontSize: 10,
    lineHeight: 1.6,
  },
  ctaBox: {
    backgroundColor: GREEN,
    borderRadius: 8,
    padding: "24 30",
    marginTop: 24,
    alignItems: "center",
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 10,
  },
  ctaBody: {
    color: "#d0f0e4",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 14,
  },
  ctaContact: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: "#aaa",
    fontSize: 9,
  },
});

function PageHeader({ page }: { page: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerBrand}>ChinaBridge — Руководство импортёра</Text>
      <Text style={styles.headerPage}>{page}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const routes = [
  { route: "Авиа (Китай → РФ)",    time: "5–12 дней",   cost: "$5–9/кг",      best: "Срочные грузы <500 кг" },
  { route: "ЖД (Китай → РФ)",      time: "15–25 дней",  cost: "$1.5–3/кг",    best: "Сборные грузы, 500–5000 кг" },
  { route: "Авто (Китай → РФ/КЗ)", time: "12–20 дней",  cost: "$2–4/кг",      best: "Средние партии, гибкость" },
  { route: "Море (Китай → РФ)",    time: "35–55 дней",  cost: "$0.3–0.8/кг",  best: "Крупные партии от 3 CBM" },
];

const tips = [
  { n: "01", title: "Выбирайте маршрут под товар",        body: "Для электроники и текстиля до 500 кг — авиа или ЖД. Для мебели и металла — море. Правильный выбор экономит до 60% логистических затрат." },
  { n: "02", title: "Консолидируйте грузы",               body: "Сборная доставка позволяет оплачивать только свой объём. При заказах от нескольких поставщиков собирайте грузы на нашем складе в Китае." },
  { n: "03", title: "Правильная классификация товара",    body: "Ошибка в коде ТН ВЭД может привести к доначислению пошлин. Мы помогаем правильно задекларировать товар и избежать штрафов." },
  { n: "04", title: "Планируйте заранее",                 body: "Срочная отгрузка увеличивает стоимость на 30–70%. Планирование за 4–6 недель позволяет выбрать оптимальный маршрут и тариф." },
  { n: "05", title: "Работайте с надёжным партнёром",     body: "Проверенный агент в Китае снижает риски: инспекция товара, контроль качества, переговоры с поставщиком на китайском языке." },
];

export function GuideDocument() {
  return (
    <Document title="Калькулятор импорта из Китая — Руководство ChinaBridge">
      {/* Стр. 1: Обложка */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverBadge}>БЕСПЛАТНОЕ РУКОВОДСТВО</Text>
          <Text style={styles.coverTitle}>Калькулятор импорта{"\n"}из Китая</Text>
          <Text style={styles.coverSubtitle}>
            Как рассчитать реальную стоимость доставки, выбрать маршрут и сэкономить на импорте
          </Text>
          <Text style={styles.coverFooter}>chinabridge.pro</Text>
        </View>
      </Page>

      {/* Стр. 2: Статьи затрат */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <PageHeader page="Стр. 2 из 5" />
          <Text style={styles.pageTitle}>Что входит в стоимость импорта</Text>
          <Text style={styles.body}>
            Многие предприниматели считают только цену товара FOB и стоимость фрахта. На деле итоговая стоимость складывается из 6–7 статей:
          </Text>
          <View style={{ height: 16 }} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Себестоимость товара</Text>
            <Bullet text="EXW — базовая цена на складе поставщика, без доставки до порта" />
            <Bullet text="FOB — цена с погрузкой на судно в порту отправления (самый частый базис)" />
            <Bullet text="CIF — цена + страховка + фрахт до порта назначения" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Таможенные платежи</Text>
            <Bullet text="Ввозная пошлина: 0–20% от таможенной стоимости (зависит от кода ТН ВЭД)" />
            <Bullet text="НДС: 20% от суммы (таможенная стоимость + пошлина)" />
            <Bullet text="Таможенный сбор: фиксированная ставка от 775 до 22 250 руб." />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Логистика и услуги</Text>
            <Bullet text="Фрахт (море/авиа/ЖД) + транзит до склада в России" />
            <Bullet text="Услуги таможенного брокера: от 12 000 руб. за декларацию" />
            <Bullet text="Страховка груза: 0.1–0.3% от стоимости" />
            <Bullet text="Складские услуги, маркировка, упаковка" />
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 ChinaBridge</Text>
          <Text style={styles.footerText}>chinabridge.pro | @ChinaBridgeLID_bot</Text>
        </View>
      </Page>

      {/* Стр. 3: Маршруты */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <PageHeader page="Стр. 3 из 5" />
          <Text style={styles.pageTitle}>Маршруты доставки: сроки и стоимость</Text>
          <Text style={styles.body}>
            Выбор маршрута — ключевой фактор себестоимости. Сравните варианты и выберите оптимальный для вашего товара.
          </Text>
          <View style={{ height: 16 }} />

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.8 }}>Маршрут</Text>
              <Text style={styles.tableHeaderCell}>Срок</Text>
              <Text style={styles.tableHeaderCell}>Цена</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.6 }}>Лучший выбор для</Text>
            </View>
            {routes.map((r, i) => (
              <View key={r.route} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ ...styles.tableCell, flex: 1.8, fontWeight: 700 }}>{r.route}</Text>
                <Text style={styles.tableCell}>{r.time}</Text>
                <Text style={styles.tableCellGreen}>{r.cost}</Text>
                <Text style={{ ...styles.tableCell, flex: 1.6 }}>{r.best}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 20 }} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Как считать объёмный вес</Text>
            <Text style={styles.body}>
              Если плотность груза меньше 200 кг/м³, перевозчик считает объёмный вес:{"\n"}
              Длина (см) × Ширина (см) × Высота (см) ÷ 6000 = объёмный вес (кг){"\n\n"}
              К оплате принимается большее из двух значений: реальный вес или объёмный.
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 ChinaBridge</Text>
          <Text style={styles.footerText}>chinabridge.pro | @ChinaBridgeLID_bot</Text>
        </View>
      </Page>

      {/* Стр. 4: 5 советов */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <PageHeader page="Стр. 4 из 5" />
          <Text style={styles.pageTitle}>5 способов сэкономить на импорте</Text>
          <Text style={styles.body}>
            На основе опыта 500+ клиентов мы собрали ключевые точки экономии:
          </Text>
          <View style={{ height: 14 }} />
          {tips.map((t) => (
            <View key={t.n} style={styles.tipCard}>
              <Text style={styles.tipNumber}>#{t.n} — {t.title}</Text>
              <Text style={styles.tipText}>{t.body}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 ChinaBridge</Text>
          <Text style={styles.footerText}>chinabridge.pro | @ChinaBridgeLID_bot</Text>
        </View>
      </Page>

      {/* Стр. 5: CTA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <PageHeader page="Стр. 5 из 5" />
          <Text style={styles.pageTitle}>Как начать работу с ChinaBridge</Text>
          <Text style={styles.body}>
            ChinaBridge — команда профессионалов с 8-летним опытом в импорте из Китая. Ведём клиентов от поиска поставщика до доставки товара на ваш склад.
          </Text>
          <View style={{ height: 20 }} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Что мы делаем за вас</Text>
            <Bullet text="Поиск и проверка поставщиков в Китае (1688, Alibaba, WeChat)" />
            <Bullet text="Инспекция качества товара перед отгрузкой" />
            <Bullet text="Выкуп товара и консолидация на складе в Китае" />
            <Bullet text="Таможенное оформление под ключ" />
            <Bullet text="Доставка по всей России и Казахстану" />
          </View>

          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Получите персональный расчёт</Text>
            <Text style={styles.ctaBody}>
              Напишите нам — рассчитаем полную стоимость вашей поставки за 2 часа. Без скрытых комиссий.
            </Text>
            <Text style={styles.ctaContact}>Telegram: @ChinaBridgeLID_bot</Text>
          </View>

          <View style={{ height: 16 }} />
          <Text style={{ color: GRAY, fontSize: 10, textAlign: "center" }}>
            chinabridge.pro — доставка из Китая под ключ
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 ChinaBridge</Text>
          <Text style={styles.footerText}>chinabridge.pro | @ChinaBridgeLID_bot</Text>
        </View>
      </Page>
    </Document>
  );
}
