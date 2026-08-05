import type {
  ContentKPIs, ContentHealth, ContentStatus, SEOContent, TelegramStats,
  YouTubeStats, ShortsStats, ImageAI, ContentDirectorReport,
  TelegramPostTemplate, ScriptIdea, ShortsIdea, PromptTemplate,
} from "./types";

// ── Telegram templates ─────────────────────────────────────────────────────

const TELEGRAM_TEMPLATES: TelegramPostTemplate[] = [
  {
    type: "expert",
    typeLabel: "Экспертный",
    emoji: "🧠",
    title: "Почему цена на 1688 ≠ ваша себестоимость?",
    body: `Многие думают: купил за 50 юаней — продал за 500 рублей и заработал.

Нет. Вот реальная формула:

💴 Цена на 1688: 50 ¥
🚢 Доставка (карго): +35%
🛃 Таможня: +15%
📦 Сертификация: +5%
🏭 Хранение и доставка: +10%

Итого: ×1.65 к цене поставщика.

Пример: товар за 1000 ¥ = 8 400–9 200 ₽ на вашем складе.

Хотите точный расчёт под ваш товар?`,
    cta: "👉 Используйте наш калькулятор: chinabridge.pro/calculator",
  },
  {
    type: "case",
    typeLabel: "Кейс",
    emoji: "📦",
    title: "Как мы нашли фабрику для клиента за 4 дня",
    body: `Задача: 500 кг светодиодных лент, нужна сертификация CE, срок — 3 недели.

Что сделали:

1️⃣ День 1: Разместили запрос на 3 B2B-платформах
2️⃣ День 2: Отобрали 12 фабрик по рейтингу Trade Assurance
3️⃣ День 3: Проверили реквизиты и отчёты аудита
4️⃣ День 4: Запросили образцы у 3 лучших

Результат: Клиент получил 500 кг за 16 дней. Сэкономил 23% vs закупка через посредника.

Хотите так же?`,
    cta: "📩 Напишите нам — разберём вашу ситуацию бесплатно",
  },
  {
    type: "sales",
    typeLabel: "Продажа",
    emoji: "🎯",
    title: "Рассчитайте стоимость импорта за 2 минуты",
    body: `Хотите знать точную стоимость доставки из Китая?

Наш калькулятор учитывает:
✅ Вес и объём груза
✅ Тип доставки (авиа / карго / контейнер)
✅ Страну назначения (РФ / КЗ / BY)
✅ Таможенные пошлины
✅ Сертификацию

Больше 500 компаний уже сделали расчёт.

Среднее время — 90 секунд.`,
    cta: "🧮 Рассчитать сейчас → chinabridge.pro/calculator",
  },
];

// ── YouTube script ideas ───────────────────────────────────────────────────

const YOUTUBE_IDEAS: ScriptIdea[] = [
  {
    id: "yt_1",
    title: "10 товаров из Китая с маржой 200%",
    hook: "Я проверил 1000 позиций на 1688. Вот 10, которые дают x3 в России прямо сейчас.",
    problem: "Люди не знают, что импортировать из Китая выгодно в 2026",
    solution: "Конкретный список с нишами, расчётами и ссылками на поставщиков",
    cta: "Скачайте таблицу в описании. Запишитесь на разбор вашей ниши.",
    estimatedViews: 15000,
  },
  {
    id: "yt_2",
    title: "Белый импорт из Китая: как легализовать бизнес",
    hook: "Серый импорт — это риск. Я покажу, как делать то же самое легально.",
    problem: "Предприниматели боятся таможни и работают в серой зоне",
    solution: "Схема белого импорта: ВЭД, документы, брокер, декларирование",
    cta: "Получите консультацию ВЭД-специалиста — ссылка в описании.",
    estimatedViews: 22000,
  },
  {
    id: "yt_3",
    title: "Проверка фабрики в Китае: полный гид 2026",
    hook: "Один мой клиент потерял 800 000 ₽ из-за мошенников с 1688. Смотрите, как я проверяю.",
    problem: "Нет понимания, как отличить реальную фабрику от посредника",
    solution: "Чек-лист проверки: Trade Assurance, аудит, видео-звонок, тестовый заказ",
    cta: "Ссылка на чек-лист в описании. Подпишитесь, чтобы не пропустить следующий выпуск.",
    estimatedViews: 11000,
  },
  {
    id: "yt_4",
    title: "Карго доставка из Китая: всё, что нужно знать",
    hook: "Авиа дорого. Контейнер медленно. Карго — золотая середина. Разбираем.",
    problem: "Непонимание разницы видов доставки = переплата или просроченные сроки",
    solution: "Сравнение авиа/карго/контейнер: цена, сроки, риски, лайфхаки",
    cta: "Используйте наш калькулятор доставки — бесплатно, ссылка в описании.",
    estimatedViews: 9500,
  },
  {
    id: "yt_5",
    title: "Импорт в Казахстан из Китая: полная схема",
    hook: "В КЗ особые правила ввоза из Китая. Расскажу всё, что скрывают посредники.",
    problem: "Предприниматели из КЗ не знают специфику таможни ЕАЭС",
    solution: "Документы, пошлины, сертификация для рынка Казахстана",
    cta: "Запишитесь на консультацию специалиста по КЗ-импорту.",
    estimatedViews: 7000,
  },
];

// ── Shorts pool ────────────────────────────────────────────────────────────

const SHORTS_POOL: ShortsIdea[] = [
  {
    id: "s1",
    title: "Вы покупаете в Китае неправильно!",
    hook: "Вы платите за товар — и теряете 30–40% прибыли незаметно.",
    script: "3 ошибки:\n1️⃣ Не считаете логистику в себестоимость\n2️⃣ Берёте у посредника, не у фабрики\n3️⃣ Не учитываете таможенные пошлины\n\nРеальный расчёт: товар 1000 ¥ → 8200 ₽ на складе РФ, если всё сделать правильно.",
    cta: "Рассчитайте свой импорт бесплатно →",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s2",
    title: "3 ошибки при покупке на 1688",
    hook: "1688 — лучшая платформа для закупок. Но эти 3 ошибки убьют вашу прибыль.",
    script: "Ошибка 1: Заказ у продавца без Trade Assurance\nОшибка 2: Игнорирование минимального заказа (MOQ)\nОшибка 3: Не запрашивать видео до оплаты\n\nЭти три пункта сэкономят вам сотни тысяч рублей.",
    cta: "Подпишитесь — каждый день разбираем импорт",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s3",
    title: "Как проверить фабрику за 15 минут",
    hook: "Мошенничество на 1688 — реальность. Вот экспресс-проверка.",
    script: "Шаг 1: Ищите значок 工厂 (factory) в профиле\nШаг 2: Смотрите дату регистрации — минимум 3 года\nШаг 3: Запросите видео производства\nШаг 4: Проверьте отзывы на AliExpress\nШаг 5: Trade Assurance + страховка оплаты",
    cta: "Бесплатный чек-лист проверки — ссылка в профиле",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s4",
    title: "Белый vs серый импорт: что выбрать?",
    hook: "Серый импорт дешевле. Но однажды он вас разорит.",
    script: "Серый импорт:\n✅ Быстро\n✅ Дешевле\n❌ Конфискация\n❌ Штрафы до 300%\n❌ Нет документов для реализации\n\nБелый импорт:\n✅ Легально\n✅ Документы для продажи\n✅ Кредитование и лизинг\n💰 Реальная разница в цене: 5–12%",
    cta: "Хотите белый импорт? Пишите — поможем",
    targetChannel: "Telegram",
  },
  {
    id: "s5",
    title: "Себестоимость: цена 1688 × 2.5?",
    hook: "Золотое правило импорта: умножь цену поставщика на 2.5",
    script: "Почему ×2.5?\n\n1688: 100 ¥ = 1150 ₽\n+ карго: +25% = 288 ₽\n+ таможня: +15% = 173 ₽\n+ сертификат: +5% = 58 ₽\n+ доставка по РФ: +10% = 115 ₽\n\nИтого: 1784 ₽ = 1150 × 1.55\n\nПлюс налоги и маржа дистрибьютора — получаете ×2.5",
    cta: "Точный расчёт под ваш товар — используйте калькулятор",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s6",
    title: "Доставка в Казахстан из Китая: сколько стоит?",
    hook: "Казахстанский рынок + Китай = золотая жила. Вот почему.",
    script: "КЗ vs РФ импорт:\n✅ Меньше ограничений для ряда товаров\n✅ Пошлины ЕАЭС работают на вас\n✅ Трансграничная торговля проще\n\nСтоимость карго КЗ: $1.8–2.5 за кг\nСроки: 18–25 дней\nДокументы: те же + КЗ сертификация",
    cta: "Расчёт для Казахстана — chinabridge.pro",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s7",
    title: "Что такое FOB, CIF, DAP? Объясняю за 60 сек",
    hook: "Поставщик написал FOB Shanghai. Вы кивнули, но не поняли? Смотрите.",
    script: "FOB (Free On Board): продавец загружает товар, дальше — ваши расходы\nCIF: продавец + страховка + доставка до порта\nDAP: доставка до вашего склада, таможня — ваша\n\nДля небольших поставок: DAP выгоднее\nДля крупных контейнеров: FOB + свой брокер",
    cta: "Подпишитесь — объясняем импорт простым языком",
    targetChannel: "Telegram",
  },
  {
    id: "s8",
    title: "Минимальный заказ (MOQ) — как обойти?",
    hook: "Фабрика требует 500 штук? Вот 3 способа купить меньше.",
    script: "Способ 1: Смешанный заказ — берите разные SKU одного поставщика\nСпособ 2: Совместная закупка — объединитесь с другими покупателями\nСпособ 3: Прямой торг — спросите sample order по 50–100 штук\n\nРабочие фразы:\n«Can you do smaller MOQ for first order?»\n«We plan to scale to 1000 units next order»",
    cta: "Нужна помощь с переговорами? Пишите нам",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s9",
    title: "Авиа vs карго: когда что выбирать?",
    hook: "Авиа — дорого. Карго — долго. Или нет?",
    script: "Авиа: $4–8/кг, 7–14 дней ✈️\nГде выгодно: до 50 кг, срочный товар, высокая маржа\n\nКарго: $2–3.5/кг, 20–35 дней 🚢\nГде выгодно: от 100 кг, несрочный товар\n\nПравило: если цена товара > $100/кг → авиа\nЕсли < $20/кг → только карго",
    cta: "Рассчитайте оптимальный маршрут в нашем калькуляторе",
    targetChannel: "YouTube Shorts",
  },
  {
    id: "s10",
    title: "Trade Assurance: защита или маркетинг?",
    hook: "Alibaba говорит: Trade Assurance защитит ваши деньги. Правда ли это?",
    script: "Trade Assurance защищает ВАС если:\n✅ Товар не пришёл\n✅ Товар не соответствует описанию\n✅ Качество хуже образца\n\nTA НЕ защищает если:\n❌ Вы не зафиксировали спецификации в заказе\n❌ Проблема обнаружена через 30+ дней\n\nВывод: да, работает. Но читайте договор.",
    cta: "Нужна помощь с контрактом? Напишите нам",
    targetChannel: "Telegram",
  },
];

// ── Image prompt templates ─────────────────────────────────────────────────

const IMAGE_PROMPTS: PromptTemplate[] = [
  {
    id: "img_tg_1",
    channel: "telegram",
    title: "Экспертный пост — инфографика",
    prompt: "Professional B2B infographic about China import process, dark navy background, white and gold typography in Russian, clean geometric layout, cargo containers and yuan symbols, no text in image, photorealistic 3D elements, 1080x1080px",
    tags: ["инфографика", "карго", "B2B"],
  },
  {
    id: "img_tg_2",
    channel: "telegram",
    title: "Кейс — фото с результатом",
    prompt: "Successful businessman examining cargo boxes in modern warehouse, Chinese factory backdrop, documentary photography style, cinematic lighting, trust and success mood, no text overlay, 1080x1080px",
    tags: ["кейс", "склад", "бизнес"],
  },
  {
    id: "img_yt_1",
    channel: "youtube",
    title: "YouTube превью — товары с маржой",
    prompt: "YouTube thumbnail: shocked businessman with 10 product boxes from China, bold red and yellow colors, bright studio lighting, Russian text space on left 30%, high contrast, 1280x720px, no watermarks",
    tags: ["thumbnail", "товары", "маржа"],
  },
  {
    id: "img_yt_2",
    channel: "youtube",
    title: "YouTube превью — фабрика",
    prompt: "YouTube thumbnail: Chinese factory floor with quality control worker, industrial background, bold typography space, red accent elements, cinematic mood, 1280x720px",
    tags: ["thumbnail", "фабрика", "проверка"],
  },
  {
    id: "img_ads_1",
    channel: "ads",
    title: "Яндекс Директ — калькулятор",
    prompt: "Clean advertising banner: calculator with Chinese yuan and Russian ruble symbols, professional business style, blue-white color scheme, trust elements (shield, check marks), 1080x1080px, no text in design",
    tags: ["реклама", "калькулятор", "доверие"],
  },
  {
    id: "img_blog_1",
    channel: "blog",
    title: "SEO статья — обложка",
    prompt: "Professional article cover: cargo ship at sunset, China-Russia trade route visualization, map overlay with route lines, clean editorial style, space for Russian headline text, 1200x630px",
    tags: ["SEO", "статья", "маршрут"],
  },
];

// ── Data builders ──────────────────────────────────────────────────────────

function buildKPIs(): ContentKPIs {
  return {
    totalMaterials: 177,
    articles: 12,
    telegramPosts: 120,
    youtubeVideos: 25,
    shorts: 20,
    totalViews: 195000,
    subscribers: 3720,
    bestContent: "Белый импорт из Китая — 25k просмотров",
  };
}

function buildHealth(kpis: ContentKPIs): { score: number; status: ContentStatus; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];

  if (kpis.articles >= 10)       { score += 15; } else { reasons.push("Мало SEO-статей — цель минимум 10/мес"); }
  if (kpis.telegramPosts >= 100) { score += 15; } else { reasons.push("Telegram посты ниже плана"); }
  if (kpis.youtubeVideos >= 20)  { score += 15; } else { reasons.push("Недостаточно YouTube-видео"); }
  if (kpis.shorts >= 15)         { score += 15; } else { reasons.push("Нужно больше Shorts для охвата"); }

  if (score < 3) reasons.push("Мало контента по направлению Казахстан");

  const status: ContentStatus = score >= 70 ? "GOOD" : score >= 50 ? "WARNING" : "CRITICAL";
  if (score >= 70) reasons.push("Контент выходит регулярно по всем каналам");
  return { score, status, reasons };
}

function buildSEO(): SEOContent {
  return {
    totalArticles: 12,
    published: 9,
    organicTraffic: 5200,
    topArticles: [
      { title: "Доставка из Китая под ключ: сколько стоит в 2026", views: 1240, position: 8,  published: "2026-06-12", traffic: 520 },
      { title: "1688.com — инструкция на русском",                 views: 890,  position: 12, published: "2026-05-28", traffic: 380 },
      { title: "Таможенное оформление товаров из Китая",           views: 640,  position: 15, published: "2026-06-01", traffic: 290 },
      { title: "Как проверить поставщика в Китае: чек-лист",       views: 520,  position: 11, published: "2026-06-20", traffic: 210 },
      { title: "Карго доставка Китай — Казахстан",                 views: 410,  position: 19, published: "2026-07-01", traffic: 160 },
    ],
    opportunities: [
      { query: "калькулятор доставки из Китая",  position: 18, volume: 2400, recommendation: "Создать SEO-страницу вокруг калькулятора, добавить FAQ на 1500 слов", priority: "HIGH"   },
      { query: "как купить на 1688 без посредников", position: 24, volume: 1800, recommendation: "Написать пошаговую статью 2500+ слов с скриншотами и видео", priority: "HIGH" },
      { query: "белый импорт Китай Казахстан",   position: 31, volume: 1200, recommendation: "Отдельный лендинг для КЗ-рынка + статья со схемой", priority: "MEDIUM" },
      { query: "карго из Китая цены 2026",        position: 27, volume: 980,  recommendation: "Обновить существующую статью, добавить актуальные тарифы", priority: "MEDIUM" },
    ],
  };
}

function buildTelegram(): TelegramStats {
  return {
    totalPosts: 120,
    monthlyPosts: 22,
    subscribersGrowth: 350,
    bestPost: "Как проверить фабрику в Китае за 15 минут — 1800 просмотров",
    reach: 8400,
    templates: TELEGRAM_TEMPLATES,
  };
}

function buildYouTube(): YouTubeStats {
  return {
    totalVideos: 25,
    totalViews: 150000,
    avgRetention: 42,
    bestVideo: "Белый импорт из Китая",
    bestViews: 25000,
    ideas: YOUTUBE_IDEAS,
  };
}

function buildShorts(): ShortsStats {
  return {
    totalShorts: 20,
    totalViews: 45000,
    avgViews: 2250,
    pool: SHORTS_POOL,
  };
}

function buildImageAI(): ImageAI {
  return {
    totalPrompts: 200,
    byChannel: { telegram: 80, youtube: 60, ads: 40, blog: 20 },
    templates: IMAGE_PROMPTS,
  };
}

export async function fetchContentData() {
  const kpis = buildKPIs();
  const healthObj = buildHealth(kpis);
  const health = { score: healthObj.score, status: healthObj.status as ContentStatus, reasons: healthObj.reasons };
  const seo = buildSEO();
  const telegram = buildTelegram();
  const youtube = buildYouTube();
  const shorts = buildShorts();
  const imageAI = buildImageAI();
  return { kpis, health, seo, telegram, youtube, shorts, imageAI };
}
