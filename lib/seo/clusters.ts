export type TrafficLevel = "low" | "medium" | "high";
export type Competition  = "low" | "medium" | "high";
export type PageStatus   = "pending" | "brief_ready" | "page_created" | "indexed";
export type PageTemplate = "landing" | "blog" | "faq" | "category";
export type KeywordType  = "commercial" | "informational";

export interface SeoKeyword {
  id: string;
  keyword: string;
  cluster: string;
  clusterLabel: string;
  clusterGroup: "geo" | "category" | "commercial" | "informational";
  type: KeywordType;
  estimatedTraffic: TrafficLevel;
  competition: Competition;
  priority: number;
  pageTemplate: PageTemplate;
  targetUrl: string;
  status: PageStatus;
}

const kw = (
  id: string, keyword: string,
  cluster: string, clusterLabel: string,
  clusterGroup: SeoKeyword["clusterGroup"],
  type: KeywordType,
  traffic: TrafficLevel, competition: Competition,
  priority: number, template: PageTemplate, url: string
): SeoKeyword => ({
  id, keyword, cluster, clusterLabel, clusterGroup,
  type, estimatedTraffic: traffic, competition,
  priority, pageTemplate: template, targetUrl: url,
  status: "pending",
});

export const SEO_KEYWORDS: SeoKeyword[] = [

  // ═══ ГЕО: КАЗАХСТАН ═══════════════════════════════════════════════
  kw("kz-01","доставка из Китая в Казахстан",        "geo-kz","Казахстан","geo","commercial","high","low",10,"landing","/dostavka-iz-kitaya-v-kazahstan"),
  kw("kz-02","карго Китай Казахстан",                "geo-kz","Казахстан","geo","commercial","high","low",10,"landing","/kargo-kitaj-kazahstan"),
  kw("kz-03","доставка из Китая в Алматы",           "geo-kz","Казахстан","geo","commercial","high","low", 9,"landing","/dostavka-iz-kitaya-almaty"),
  kw("kz-04","доставка из Китая в Астану",           "geo-kz","Казахстан","geo","commercial","medium","low",9,"landing","/dostavka-iz-kitaya-astana"),
  kw("kz-05","карго Китай Алматы",                   "geo-kz","Казахстан","geo","commercial","high","low",10,"landing","/kargo-kitaj-almaty"),
  kw("kz-06","белая доставка Китай Казахстан",       "geo-kz","Казахстан","geo","commercial","medium","low", 9,"landing","/belaya-dostavka-kitaj-kazahstan"),
  kw("kz-07","выкуп 1688 Казахстан",                "geo-kz","Казахстан","geo","commercial","medium","low", 8,"landing","/vikup-1688-kazahstan"),
  kw("kz-08","поставщик из Китая Казахстан",         "geo-kz","Казахстан","geo","commercial","medium","low", 8,"landing","/postavshik-iz-kitaya-kazahstan"),
  kw("kz-09","импорт из Китая Казахстан",            "geo-kz","Казахстан","geo","commercial","medium","low", 8,"landing","/import-iz-kitaya-kazahstan"),
  kw("kz-10","растаможка товаров из Китая Казахстан","geo-kz","Казахстан","geo","commercial","medium","low", 7,"blog",  "/rastamojka-tovarov-kitaj-kazahstan"),
  kw("kz-11","доставка с 1688 в Казахстан",         "geo-kz","Казахстан","geo","commercial","medium","low", 8,"landing","/dostavka-1688-kazahstan"),
  kw("kz-12","доставка из Китая в Шымкент",          "geo-kz","Казахстан","geo","commercial","low","low",  6,"landing","/dostavka-iz-kitaya-shimkent"),
  kw("kz-13","оптом из Китая Казахстан",             "geo-kz","Казахстан","geo","commercial","medium","low", 7,"landing","/optom-iz-kitaya-kazahstan"),
  kw("kz-14","как привезти товар из Китая в Казахстан","geo-kz","Казахстан","geo","informational","medium","low",7,"blog","/kak-privesti-tovar-iz-kitaya-kazahstan"),
  kw("kz-15","сколько стоит доставка из Китая в Казахстан","geo-kz","Казахстан","geo","informational","medium","low",7,"faq","/stoimost-dostavki-kitaj-kazahstan"),

  // ═══ ГЕО: РОССИЯ ══════════════════════════════════════════════════
  kw("ru-01","доставка из Китая",                    "geo-ru","Россия","geo","commercial","high","high", 8,"landing","/dostavka-iz-kitaya"),
  kw("ru-02","импорт из Китая",                      "geo-ru","Россия","geo","commercial","high","high", 8,"landing","/import-iz-kitaya"),
  kw("ru-03","белый импорт из Китая",                "geo-ru","Россия","geo","commercial","medium","medium",9,"landing","/belyj-import-iz-kitaya"),
  kw("ru-04","доставка из Китая в Москву",           "geo-ru","Россия","geo","commercial","high","high", 8,"landing","/dostavka-iz-kitaya-moskva"),
  kw("ru-05","доставка из Китая в СПб",              "geo-ru","Россия","geo","commercial","medium","medium",7,"landing","/dostavka-iz-kitaya-spb"),
  kw("ru-06","доставка из Китая в Новосибирск",      "geo-ru","Россия","geo","commercial","medium","low", 7,"landing","/dostavka-iz-kitaya-novosibirsk"),
  kw("ru-07","доставка из Китая в Хабаровск",        "geo-ru","Россия","geo","commercial","medium","low", 7,"landing","/dostavka-iz-kitaya-habarovsk"),
  kw("ru-08","доставка из Китая в Екатеринбург",     "geo-ru","Россия","geo","commercial","medium","low", 7,"landing","/dostavka-iz-kitaya-ekaterinburg"),
  kw("ru-09","карго из Китая",                       "geo-ru","Россия","geo","commercial","high","medium", 8,"landing","/kargo-iz-kitaya"),
  kw("ru-10","карго Китай Россия",                   "geo-ru","Россия","geo","commercial","high","medium", 8,"landing","/kargo-kitaj-rossiya"),
  kw("ru-11","выкуп на 1688",                       "geo-ru","Россия","geo","commercial","high","medium", 9,"landing","/vikup-na-1688"),
  kw("ru-12","выкуп товаров из Китая",               "geo-ru","Россия","geo","commercial","high","medium", 9,"landing","/vikup-tovarov-iz-kitaya"),
  kw("ru-13","поиск поставщика в Китае",             "geo-ru","Россия","geo","commercial","high","medium", 9,"landing","/poisk-postavshika-kitaj"),
  kw("ru-14","таможенное оформление из Китая",       "geo-ru","Россия","geo","commercial","medium","medium",7,"landing","/tamozhennoe-oformlenie-kitaj"),
  kw("ru-15","растаможка из Китая",                  "geo-ru","Россия","geo","commercial","medium","medium",7,"landing","/rastamojka-iz-kitaya"),
  kw("ru-16","сертификация товаров из Китая",        "geo-ru","Россия","geo","informational","medium","medium",6,"blog","/sertifikaciya-tovarov-kitaj"),
  kw("ru-17","доставка из Китая во Владивосток",     "geo-ru","Россия","geo","commercial","medium","low", 7,"landing","/dostavka-iz-kitaya-vladivostok"),
  kw("ru-18","доставка из Китая в Казань",           "geo-ru","Россия","geo","commercial","medium","low", 6,"landing","/dostavka-iz-kitaya-kazan"),
  kw("ru-19","оптовые закупки в Китае",              "geo-ru","Россия","geo","commercial","high","medium", 8,"landing","/optovye-zakupki-kitaj"),
  kw("ru-20","контейнер из Китая",                   "geo-ru","Россия","geo","commercial","medium","medium",7,"landing","/kontejner-iz-kitaya"),

  // ═══ ГЕО: УЗБЕКИСТАН ══════════════════════════════════════════════
  kw("uz-01","доставка из Китая в Узбекистан",       "geo-uz","Узбекистан","geo","commercial","medium","low",9,"landing","/dostavka-iz-kitaya-uzbekistan"),
  kw("uz-02","карго Китай Ташкент",                  "geo-uz","Узбекистан","geo","commercial","medium","low",9,"landing","/kargo-kitaj-tashkent"),
  kw("uz-03","доставка из Китая в Ташкент",          "geo-uz","Узбекистан","geo","commercial","medium","low",8,"landing","/dostavka-iz-kitaya-tashkent"),
  kw("uz-04","импорт из Китая Узбекистан",           "geo-uz","Узбекистан","geo","commercial","medium","low",8,"landing","/import-iz-kitaya-uzbekistan"),
  kw("uz-05","выкуп 1688 Узбекистан",               "geo-uz","Узбекистан","geo","commercial","medium","low",8,"landing","/vikup-1688-uzbekistan"),
  kw("uz-06","поставщик из Китая Узбекистан",        "geo-uz","Узбекистан","geo","commercial","low","low",  7,"landing","/postavshik-kitaj-uzbekistan"),

  // ═══ ГЕО: БЕЛАРУСЬ ════════════════════════════════════════════════
  kw("by-01","доставка из Китая в Беларусь",         "geo-by","Беларусь","geo","commercial","medium","low",8,"landing","/dostavka-iz-kitaya-belarus"),
  kw("by-02","карго Китай Минск",                    "geo-by","Беларусь","geo","commercial","medium","low",8,"landing","/kargo-kitaj-minsk"),
  kw("by-03","импорт из Китая Беларусь",             "geo-by","Беларусь","geo","commercial","medium","low",7,"landing","/import-iz-kitaya-belarus"),
  kw("by-04","выкуп 1688 Беларусь",                 "geo-by","Беларусь","geo","commercial","low","low",  7,"landing","/vikup-1688-belarus"),

  // ═══ КАТЕГОРИИ: WB/OZON ═══════════════════════════════════════════
  kw("wb-01","товары для WB из Китая",               "cat-mp","WB / Ozon","category","commercial","high","medium",10,"landing","/tovary-dlya-wb-iz-kitaya"),
  kw("wb-02","товары для Wildberries из Китая",       "cat-mp","WB / Ozon","category","commercial","high","medium",10,"landing","/tovary-dlya-wildberries-kitaj"),
  kw("wb-03","товары для Ozon из Китая",             "cat-mp","WB / Ozon","category","commercial","high","medium",10,"landing","/tovary-dlya-ozon-iz-kitaya"),
  kw("wb-04","товары для Kaspi из Китая",            "cat-mp","WB / Ozon","category","commercial","medium","low", 9,"landing","/tovary-dlya-kaspi-iz-kitaya"),
  kw("wb-05","закупка товаров для маркетплейсов Китай","cat-mp","WB / Ozon","category","commercial","high","medium",10,"landing","/zakupka-tovarov-dlya-marketplejsov"),
  kw("wb-06","найти поставщика для WB",             "cat-mp","WB / Ozon","category","commercial","high","medium",10,"landing","/postavshik-dlya-wb"),
  kw("wb-07","найти поставщика для Ozon",           "cat-mp","WB / Ozon","category","commercial","high","medium", 9,"landing","/postavshik-dlya-ozon"),
  kw("wb-08","импорт для Wildberries",               "cat-mp","WB / Ozon","category","commercial","medium","medium",9,"landing","/import-dlya-wildberries"),
  kw("wb-09","себестоимость товара WB",              "cat-mp","WB / Ozon","category","informational","high","medium",9,"blog","/sebestoimost-tovara-wb"),
  kw("wb-10","юнит экономика WB",                   "cat-mp","WB / Ozon","category","informational","high","medium",9,"blog","/unit-ekonomika-wb"),
  kw("wb-11","прибыль на WB калькулятор",            "cat-mp","WB / Ozon","category","commercial","high","medium",9,"landing","/kalkulyator-pribyli-wb"),
  kw("wb-12","поставка на WB из Китая",              "cat-mp","WB / Ozon","category","commercial","medium","medium",8,"landing","/postavka-wb-iz-kitaya"),

  // ═══ КАТЕГОРИИ: МЕБЕЛЬ ════════════════════════════════════════════
  kw("me-01","мебель из Китая",                      "cat-furniture","Мебель","category","commercial","high","medium",8,"landing","/mebel-iz-kitaya"),
  kw("me-02","импорт мебели из Китая",               "cat-furniture","Мебель","category","commercial","medium","medium",8,"landing","/import-mebeli-iz-kitaya"),
  kw("me-03","поставщик мебели из Китая",            "cat-furniture","Мебель","category","commercial","medium","medium",8,"landing","/postavshik-mebeli-kitaj"),
  kw("me-04","кухни из Китая",                       "cat-furniture","Мебель","category","commercial","medium","medium",7,"landing","/kuhni-iz-kitaya"),
  kw("me-05","диваны из Китая оптом",               "cat-furniture","Мебель","category","commercial","medium","medium",7,"landing","/divany-iz-kitaya-optom"),
  kw("me-06","матрасы из Китая оптом",              "cat-furniture","Мебель","category","commercial","medium","low", 7,"landing","/matrasy-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: ЭЛЕКТРОНИКА ═══════════════════════════════════════
  kw("el-01","электроника из Китая",                 "cat-electronics","Электроника","category","commercial","high","high",7,"landing","/elektronika-iz-kitaya"),
  kw("el-02","импорт электроники из Китая",          "cat-electronics","Электроника","category","commercial","medium","medium",7,"landing","/import-elektroniki-kitaj"),
  kw("el-03","смартфоны из Китая оптом",            "cat-electronics","Электроника","category","commercial","medium","medium",7,"landing","/smartfony-iz-kitaya-optom"),
  kw("el-04","гаджеты из Китая оптом",              "cat-electronics","Электроника","category","commercial","medium","medium",7,"landing","/gadzhety-iz-kitaya-optom"),
  kw("el-05","наушники из Китая оптом",             "cat-electronics","Электроника","category","commercial","medium","medium",6,"landing","/naushniki-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: АВТОЗАПЧАСТИ ══════════════════════════════════════
  kw("av-01","автозапчасти из Китая",               "cat-auto","Автозапчасти","category","commercial","high","medium",8,"landing","/avtozapchasti-iz-kitaya"),
  kw("av-02","импорт автозапчастей из Китая",       "cat-auto","Автозапчасти","category","commercial","medium","medium",8,"landing","/import-avtozapchastej-kitaj"),
  kw("av-03","поставщик автозапчастей Китай",       "cat-auto","Автозапчасти","category","commercial","medium","medium",7,"landing","/postavshik-avtozapchastej-kitaj"),
  kw("av-04","шины из Китая оптом",                 "cat-auto","Автозапчасти","category","commercial","medium","medium",7,"landing","/shiny-iz-kitaya-optom"),
  kw("av-05","аккумуляторы из Китая оптом",         "cat-auto","Автозапчасти","category","commercial","medium","low", 6,"landing","/akkumulyatory-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: ОДЕЖДА ════════════════════════════════════════════
  kw("od-01","одежда из Китая оптом",               "cat-clothes","Одежда","category","commercial","high","high",7,"landing","/odezhda-iz-kitaya-optom"),
  kw("od-02","импорт одежды из Китая",              "cat-clothes","Одежда","category","commercial","high","high",7,"landing","/import-odezhdy-kitaj"),
  kw("od-03","детская одежда из Китая оптом",       "cat-clothes","Одежда","category","commercial","medium","high",6,"landing","/detskaya-odezhda-iz-kitaya-optom"),
  kw("od-04","поставщик одежды из Китая для WB",    "cat-clothes","Одежда","category","commercial","high","medium",8,"landing","/postavshik-odezhdy-kitaj-wb"),

  // ═══ КАТЕГОРИИ: ОБОРУДОВАНИЕ ══════════════════════════════════════
  kw("ob-01","оборудование из Китая",               "cat-equipment","Оборудование","category","commercial","high","medium",8,"landing","/oborudovanie-iz-kitaya"),
  kw("ob-02","промышленное оборудование из Китая",  "cat-equipment","Оборудование","category","commercial","medium","medium",8,"landing","/promyshlennoe-oborudovanie-kitaj"),
  kw("ob-03","станки из Китая",                     "cat-equipment","Оборудование","category","commercial","medium","medium",7,"landing","/stanki-iz-kitaya"),
  kw("ob-04","строительное оборудование из Китая",  "cat-equipment","Оборудование","category","commercial","medium","low", 7,"landing","/stroitelnoe-oborudovanie-kitaj"),
  kw("ob-05","солнечные панели из Китая",           "cat-equipment","Оборудование","category","commercial","medium","medium",7,"landing","/solnechnye-paneli-iz-kitaya"),

  // ═══ КАТЕГОРИИ: СТРОЙМАТЕРИАЛЫ ════════════════════════════════════
  kw("sm-01","стройматериалы из Китая",             "cat-build","Стройматериалы","category","commercial","medium","medium",7,"landing","/strojmaterialy-iz-kitaya"),
  kw("sm-02","плитка из Китая",                     "cat-build","Стройматериалы","category","commercial","medium","medium",7,"landing","/plitka-iz-kitaya"),
  kw("sm-03","сантехника из Китая оптом",           "cat-build","Стройматериалы","category","commercial","medium","medium",7,"landing","/santehnika-iz-kitaya-optom"),
  kw("sm-04","ламинат из Китая",                    "cat-build","Стройматериалы","category","commercial","medium","low", 6,"landing","/laminat-iz-kitaya"),

  // ═══ КАТЕГОРИИ: ДЕТСКИЕ ТОВАРЫ ════════════════════════════════════
  kw("dt-01","детские товары из Китая оптом",       "cat-kids","Детские товары","category","commercial","medium","medium",7,"landing","/detskie-tovary-iz-kitaya-optom"),
  kw("dt-02","игрушки из Китая оптом",              "cat-kids","Детские товары","category","commercial","medium","medium",7,"landing","/igrushki-iz-kitaya-optom"),
  kw("dt-03","коляски из Китая оптом",              "cat-kids","Детские товары","category","commercial","low","medium",  6,"landing","/kolyaski-iz-kitaya-optom"),

  // ═══ КОММЕРЧЕСКИЕ: ПОИСК ПОСТАВЩИКА ══════════════════════════════
  kw("pp-01","найти поставщика в Китае",            "com-supplier","Поиск поставщика","commercial","commercial","high","medium",10,"landing","/najti-postavshika-kitaj"),
  kw("pp-02","проверка поставщика в Китае",         "com-supplier","Поиск поставщика","commercial","commercial","high","medium",10,"landing","/proverka-postavshika-kitaj"),
  kw("pp-03","поставщик на 1688",                  "com-supplier","Поиск поставщика","commercial","commercial","high","medium",10,"landing","/postavshik-1688"),
  kw("pp-04","поставщик на Alibaba",               "com-supplier","Поиск поставщика","commercial","commercial","high","high",  9,"landing","/postavshik-alibaba"),
  kw("pp-05","надёжный поставщик из Китая",         "com-supplier","Поиск поставщика","commercial","commercial","high","medium", 9,"landing","/nadyozhnyj-postavshik-kitaj"),
  kw("pp-06","как проверить поставщика из Китая",   "com-supplier","Поиск поставщика","commercial","informational","high","medium",9,"blog","/kak-proverit-postavshika-kitaj"),
  kw("pp-07","агент по закупкам в Китае",           "com-supplier","Поиск поставщика","commercial","commercial","medium","medium",8,"landing","/agent-po-zakupkam-kitaj"),
  kw("pp-08","закупки на 1688 под ключ",           "com-supplier","Поиск поставщика","commercial","commercial","high","medium",10,"landing","/zakupki-1688-pod-klyuch"),

  // ═══ КОММЕРЧЕСКИЕ: РАСЧЁТ ЭКОНОМИКИ ══════════════════════════════
  kw("ec-01","калькулятор доставки из Китая",       "com-calc","Расчёт экономики","commercial","commercial","high","medium",10,"landing","/kalkulyator-dostavki-iz-kitaya"),
  kw("ec-02","стоимость импорта из Китая",          "com-calc","Расчёт экономики","commercial","commercial","high","medium",9,"landing","/stoimost-importa-iz-kitaya"),
  kw("ec-03","калькулятор таможенных пошлин",       "com-calc","Расчёт экономики","commercial","commercial","medium","medium",8,"landing","/kalkulyator-tamozhennyh-poshlin"),
  kw("ec-04","себестоимость товара из Китая расчёт","com-calc","Расчёт экономики","commercial","commercial","high","medium",9,"landing","/sebestoimost-tovara-iz-kitaya"),
  kw("ec-05","сколько стоит импорт из Китая",       "com-calc","Расчёт экономики","commercial","informational","high","medium",9,"faq","/skolko-stoit-import-iz-kitaya"),

  // ═══ ИНФОРМАЦИОННЫЕ ════════════════════════════════════════════════
  kw("in-01","как начать импорт из Китая",          "info-how","Гайды","informational","informational","high","medium",8,"blog","/kak-nachat-import-iz-kitaya"),
  kw("in-02","как везти товар из Китая",            "info-how","Гайды","informational","informational","high","medium",8,"blog","/kak-vezti-tovar-iz-kitaya"),
  kw("in-03","как растаможить товар из Китая",      "info-how","Гайды","informational","informational","medium","medium",7,"blog","/kak-rastamojit-tovar-kitaj"),
  kw("in-04","таможенные пошлины из Китая 2025",   "info-how","Гайды","informational","informational","high","medium",8,"blog","/tamozh-poshliny-kitaj-2025"),
  kw("in-05","инкотермс при импорте из Китая",     "info-how","Гайды","informational","informational","medium","low", 6,"blog","/inkoterms-import-kitaj"),
  kw("in-06","сертификаты ЕАС для товаров из Китая","info-how","Гайды","informational","informational","medium","medium",7,"blog","/sertifikaty-eas-kitaj"),
  kw("in-07","ВЭД для малого бизнеса",             "info-how","Гайды","informational","informational","medium","medium",7,"blog","/ved-malyj-biznes"),
  kw("in-08","договор с поставщиком из Китая",     "info-how","Гайды","informational","informational","medium","low", 6,"blog","/dogovor-postavshik-kitaj"),
  kw("in-09","ошибки при импорте из Китая",        "info-how","Гайды","informational","informational","medium","medium",7,"blog","/oshibki-import-kitaj"),
  kw("in-10","что можно везти из Китая",           "info-how","Гайды","informational","informational","high","medium",8,"blog","/chto-mozhno-vezti-iz-kitaya"),
  kw("in-11","запрещённые товары из Китая",        "info-how","Гайды","informational","informational","medium","low", 6,"blog","/zapreshennye-tovary-kitaj"),
  kw("in-12","как найти товар для WB в Китае",     "info-how","Гайды","informational","informational","high","medium",9,"blog","/kak-najti-tovar-dlya-wb-kitaj"),
  kw("in-13","как выбрать поставщика на Alibaba",  "info-how","Гайды","informational","informational","high","medium",8,"blog","/vybrat-postavshika-alibaba"),
  kw("in-14","минимальная партия на 1688",         "info-how","Гайды","informational","informational","medium","low", 7,"faq","/minimalnaya-partiya-1688"),
  kw("in-15","срок доставки из Китая",             "info-how","Гайды","informational","informational","high","medium",8,"faq","/srok-dostavki-iz-kitaya"),

  // ═══ ГЕО: КЫРГЫЗСТАН ══════════════════════════════════════════════
  kw("kg-01","доставка из Китая в Кыргызстан",      "geo-kg","Кыргызстан","geo","commercial","medium","low",8,"landing","/dostavka-iz-kitaya-kyrgyzstan"),
  kw("kg-02","карго Китай Бишкек",                  "geo-kg","Кыргызстан","geo","commercial","medium","low",8,"landing","/kargo-kitaj-bishkek"),
  kw("kg-03","импорт из Китая Кыргызстан",          "geo-kg","Кыргызстан","geo","commercial","low","low",  7,"landing","/import-iz-kitaya-kyrgyzstan"),
  kw("kg-04","выкуп 1688 Кыргызстан",              "geo-kg","Кыргызстан","geo","commercial","low","low",  6,"landing","/vikup-1688-kyrgyzstan"),

  // ═══ ГЕО: АЗЕРБАЙДЖАН ════════════════════════════════════════════
  kw("az-01","доставка из Китая в Азербайджан",     "geo-az","Азербайджан","geo","commercial","medium","low",7,"landing","/dostavka-iz-kitaya-azerbajdzhan"),
  kw("az-02","карго Китай Баку",                    "geo-az","Азербайджан","geo","commercial","medium","low",7,"landing","/kargo-kitaj-baku"),
  kw("az-03","импорт из Китая Азербайджан",         "geo-az","Азербайджан","geo","commercial","low","low",  6,"landing","/import-iz-kitaya-azerbajdzhan"),

  // ═══ ГЕО: ГРУЗИЯ ══════════════════════════════════════════════════
  kw("ge-01","доставка из Китая в Грузию",          "geo-ge","Грузия","geo","commercial","medium","low",7,"landing","/dostavka-iz-kitaya-gruziya"),
  kw("ge-02","карго Китай Тбилиси",                 "geo-ge","Грузия","geo","commercial","medium","low",7,"landing","/kargo-kitaj-tbilisi"),
  kw("ge-03","импорт из Китая Грузия",              "geo-ge","Грузия","geo","commercial","medium","low",6,"landing","/import-iz-kitaya-gruziya"),

  // ═══ ГЕО: МОНГОЛИЯ ════════════════════════════════════════════════
  kw("mn-01","доставка из Китая в Монголию",        "geo-mn","Монголия","geo","commercial","low","low",7,"landing","/dostavka-iz-kitaya-mongoliya"),
  kw("mn-02","карго Китай Улан-Батор",              "geo-mn","Монголия","geo","commercial","low","low",7,"landing","/kargo-kitaj-ulan-bator"),

  // ═══ КАТЕГОРИИ: ПРОДУКТЫ ПИТАНИЯ ══════════════════════════════════
  kw("fd-01","продукты питания из Китая оптом",     "cat-food","Продукты","category","commercial","medium","medium",7,"landing","/produkty-iz-kitaya-optom"),
  kw("fd-02","чай из Китая оптом",                  "cat-food","Продукты","category","commercial","medium","medium",7,"landing","/chaj-iz-kitaya-optom"),
  kw("fd-03","орехи из Китая оптом",                "cat-food","Продукты","category","commercial","medium","low",  6,"landing","/orehi-iz-kitaya-optom"),
  kw("fd-04","специи из Китая оптом",               "cat-food","Продукты","category","commercial","low","low",    6,"landing","/specii-iz-kitaya-optom"),
  kw("fd-05","БАД из Китая оптом",                  "cat-food","Продукты","category","commercial","medium","medium",7,"landing","/bad-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: КОСМЕТИКА ═════════════════════════════════════════
  kw("cs-01","косметика из Китая оптом",            "cat-cosmetics","Косметика","category","commercial","medium","high",7,"landing","/kosmetika-iz-kitaya-optom"),
  kw("cs-02","корейская косметика из Китая",        "cat-cosmetics","Косметика","category","commercial","medium","high",6,"landing","/korejskaya-kosmetika-iz-kitaya"),
  kw("cs-03","уходовая косметика из Китая",         "cat-cosmetics","Косметика","category","commercial","medium","medium",7,"landing","/uhodovaya-kosmetika-kitaj"),
  kw("cs-04","парфюмерия из Китая оптом",           "cat-cosmetics","Косметика","category","commercial","medium","medium",6,"landing","/parfyumeriya-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: СПОРТ ═════════════════════════════════════════════
  kw("sp-01","спортивные товары из Китая оптом",    "cat-sport","Спорттовары","category","commercial","medium","medium",7,"landing","/sportivnye-tovary-iz-kitaya-optom"),
  kw("sp-02","спортивная одежда из Китая оптом",   "cat-sport","Спорттовары","category","commercial","medium","medium",7,"landing","/sportivnaya-odezhda-kitaj-optom"),
  kw("sp-03","тренажёры из Китая оптом",            "cat-sport","Спорттовары","category","commercial","medium","low", 6,"landing","/trenazhery-iz-kitaya-optom"),
  kw("sp-04","велосипеды из Китая оптом",           "cat-sport","Спорттовары","category","commercial","medium","low", 6,"landing","/velosipedy-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: ЗООТОВАРЫ ═════════════════════════════════════════
  kw("zo-01","зоотовары из Китая оптом",            "cat-zoo","Зоотовары","category","commercial","medium","low",7,"landing","/zootovary-iz-kitaya-optom"),
  kw("zo-02","корм для животных из Китая",          "cat-zoo","Зоотовары","category","commercial","medium","low",6,"landing","/korm-dlya-zhivotnyh-kitaj"),

  // ═══ КАТЕГОРИИ: ПОСУДА / ДОМ ══════════════════════════════════════
  kw("ho-01","посуда из Китая оптом",               "cat-home","Дом и посуда","category","commercial","medium","medium",7,"landing","/posuda-iz-kitaya-optom"),
  kw("ho-02","товары для дома из Китая оптом",      "cat-home","Дом и посуда","category","commercial","medium","medium",7,"landing","/tovary-dlya-doma-iz-kitaya-optom"),
  kw("ho-03","текстиль из Китая оптом",             "cat-home","Дом и посуда","category","commercial","medium","medium",7,"landing","/tekstil-iz-kitaya-optom"),
  kw("ho-04","постельное бельё из Китая оптом",     "cat-home","Дом и посуда","category","commercial","medium","medium",6,"landing","/postelnoe-bele-iz-kitaya-optom"),
  kw("ho-05","шторы из Китая оптом",                "cat-home","Дом и посуда","category","commercial","low","low",    5,"landing","/shtory-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: САДОВЫЕ ТОВАРЫ ════════════════════════════════════
  kw("ga-01","садовый инструмент из Китая",         "cat-garden","Сад / огород","category","commercial","medium","low",6,"landing","/sadovyj-instrument-iz-kitaya"),
  kw("ga-02","садовые товары из Китая оптом",       "cat-garden","Сад / огород","category","commercial","medium","low",6,"landing","/sadovye-tovary-iz-kitaya-optom"),

  // ═══ КАТЕГОРИИ: УПАКОВКА ══════════════════════════════════════════
  kw("pk-01","упаковка из Китая",                   "cat-pack","Упаковка","category","commercial","medium","medium",7,"landing","/upakovka-iz-kitaya"),
  kw("pk-02","пакеты из Китая оптом",               "cat-pack","Упаковка","category","commercial","medium","low", 6,"landing","/pakety-iz-kitaya-optom"),
  kw("pk-03","коробки из Китая оптом",              "cat-pack","Упаковка","category","commercial","medium","low", 6,"landing","/korobki-iz-kitaya-optom"),
  kw("pk-04","принт и упаковка под ключ Китай",     "cat-pack","Упаковка","category","commercial","low","low",    6,"landing","/print-upakovka-kitaj"),

  // ═══ КОММЕРЧЕСКИЕ: ЛОГИСТИКА ══════════════════════════════════════
  kw("lg-01","логистика из Китая",                  "com-logistics","Логистика","commercial","commercial","high","medium",8,"landing","/logistika-iz-kitaya"),
  kw("lg-02","морская доставка из Китая",           "com-logistics","Логистика","commercial","commercial","high","medium",8,"landing","/morskaya-dostavka-iz-kitaya"),
  kw("lg-03","авиадоставка из Китая",               "com-logistics","Логистика","commercial","commercial","high","medium",8,"landing","/aviadostavka-iz-kitaya"),
  kw("lg-04","доставка автотранспортом из Китая",   "com-logistics","Логистика","commercial","commercial","medium","medium",7,"landing","/dostavka-avtotransportom-iz-kitaya"),
  kw("lg-05","ж/д доставка из Китая",              "com-logistics","Логистика","commercial","commercial","medium","medium",7,"landing","/zhd-dostavka-iz-kitaya"),
  kw("lg-06","экспресс доставка из Китая",          "com-logistics","Логистика","commercial","commercial","high","medium",8,"landing","/ekspress-dostavka-iz-kitaya"),
  kw("lg-07","консолидация грузов из Китая",        "com-logistics","Логистика","commercial","commercial","medium","low", 7,"landing","/konsolidaciya-gruzov-iz-kitaya"),
  kw("lg-08","склад в Китае",                       "com-logistics","Логистика","commercial","commercial","medium","medium",7,"landing","/sklad-v-kitae"),

  // ═══ КОММЕРЧЕСКИЕ: ВЭД / ТАМОЖНЯ ═════════════════════════════════
  kw("vd-01","услуги ВЭД",                         "com-ved","ВЭД / таможня","commercial","commercial","high","medium",8,"landing","/uslugi-ved"),
  kw("vd-02","таможенный брокер",                   "com-ved","ВЭД / таможня","commercial","commercial","high","medium",8,"landing","/tamozhennyj-broker"),
  kw("vd-03","таможенное оформление под ключ",      "com-ved","ВЭД / таможня","commercial","commercial","high","medium",9,"landing","/tamozhennoe-oformlenie-pod-klyuch"),
  kw("vd-04","декларирование товаров из Китая",     "com-ved","ВЭД / таможня","commercial","commercial","medium","medium",7,"landing","/deklarirovanie-tovarov-kitaj"),
  kw("vd-05","фитосанитарный сертификат из Китая",  "com-ved","ВЭД / таможня","commercial","informational","low","low",  5,"blog","/fitosanitarnyj-sertifikat-kitaj"),
  kw("vd-06","код ТН ВЭД на товары из Китая",      "com-ved","ВЭД / таможня","commercial","informational","medium","low",7,"faq","/tnved-kod-kitaj"),

  // ═══ КОММЕРЧЕСКИЕ: ФИНАНСИРОВАНИЕ ════════════════════════════════
  kw("fn-01","финансирование закупок в Китае",      "com-finance","Финансирование","commercial","commercial","medium","low",7,"landing","/finansirovanie-zakupok-kitaj"),
  kw("fn-02","оплата поставщику в Китае",           "com-finance","Финансирование","commercial","commercial","high","medium",8,"landing","/oplata-postavshiku-v-kitae"),
  kw("fn-03","SWIFT перевод в Китай",               "com-finance","Финансирование","commercial","commercial","high","medium",8,"landing","/swift-perevod-v-kitaj"),
  kw("fn-04","юань оплата поставщику",              "com-finance","Финансирование","commercial","commercial","high","medium",9,"landing","/yuan-oplata-postavshiku"),
  kw("fn-05","как оплатить 1688",                  "com-finance","Финансирование","commercial","informational","high","medium",9,"faq","/kak-oplatit-1688"),
  kw("fn-06","оплата Alibaba из России",            "com-finance","Финансирование","commercial","informational","high","medium",8,"faq","/oplata-alibaba-iz-rossii"),

  // ═══ ИНФОРМАЦИОННЫЕ: МАРКЕТПЛЕЙСЫ ════════════════════════════════
  kw("mp-01","как продавать на WB импортный товар", "info-mp","Маркетплейсы","informational","informational","high","medium",9,"blog","/kak-prodavat-na-wb-importnyj-tovar"),
  kw("mp-02","маркировка товаров из Китая для WB",  "info-mp","Маркетплейсы","informational","informational","high","medium",9,"blog","/markirovka-tovarov-kitaj-wb"),
  kw("mp-03","как открыть ИП для WB",              "info-mp","Маркетплейсы","informational","informational","high","medium",8,"blog","/kak-otkryt-ip-dlya-wb"),
  kw("mp-04","как зайти на Ozon с импортным товаром","info-mp","Маркетплейсы","informational","informational","high","medium",8,"blog","/kak-zajti-na-ozon-import"),
  kw("mp-05","товары из Китая для маркетплейсов 2025","info-mp","Маркетплейсы","informational","informational","high","medium",9,"blog","/tovary-iz-kitaya-marketplejsy-2025"),

  // ═══ ИНФОРМАЦИОННЫЕ: КЕЙСЫ ════════════════════════════════════════
  kw("cs2-01","кейс импорт мебели из Китая",        "info-cases","Кейсы","informational","informational","medium","low",7,"blog","/kejs-import-mebeli-iz-kitaya"),
  kw("cs2-02","кейс закупка электроники из Китая",  "info-cases","Кейсы","informational","informational","medium","low",7,"blog","/kejs-zakupka-elektroniki-kitaj"),
  kw("cs2-03","кейс WB поставщик из Китая",         "info-cases","Кейсы","informational","informational","medium","low",7,"blog","/kejs-wb-postavshik-iz-kitaya"),

  // ═══ ИНФОРМАЦИОННЫЕ: СРАВНЕНИЕ / РЕЙТИНГИ ═════════════════════════
  kw("rt-01","1688 vs Alibaba — что лучше",         "info-compare","Сравнения","informational","informational","high","medium",8,"blog","/1688-vs-alibaba"),
  kw("rt-02","карго vs почта — что дешевле из Китая","info-compare","Сравнения","informational","informational","medium","low",7,"blog","/kargo-vs-pochta-iz-kitaya"),
  kw("rt-03","лучшие карго из Китая",               "info-compare","Сравнения","informational","informational","high","medium",8,"blog","/luchshie-kargo-iz-kitaya"),
  kw("rt-04","рейтинг поставщиков из Китая",        "info-compare","Сравнения","informational","informational","medium","medium",7,"blog","/rejting-postavshikov-iz-kitaya"),

  // ═══ ИНФОРМАЦИОННЫЕ: FAQ ══════════════════════════════════════════
  kw("fq-01","можно ли везти наличные в Китай",     "info-faq","FAQ","informational","informational","medium","low",5,"faq","/nalichnye-v-kitaj"),
  kw("fq-02","нужна ли лицензия на импорт из Китая","info-faq","FAQ","informational","informational","medium","low",6,"faq","/licenziya-na-import-kitaj"),
  kw("fq-03","что нельзя везти из Китая в Россию",  "info-faq","FAQ","informational","informational","medium","low",6,"faq","/chto-nelzya-vezti-iz-kitaya-rossiya"),
  kw("fq-04","НДС при импорте из Китая",            "info-faq","FAQ","informational","informational","medium","medium",7,"faq","/nds-import-iz-kitaya"),
  kw("fq-05","ТЗ на производство в Китае",          "info-faq","FAQ","informational","informational","medium","low",6,"faq","/tz-na-proizvodstvo-v-kitae"),

  // ═══ ГЕО: ДОПОЛНИТЕЛЬНЫЕ ГОРОДА КАЗАХСТАНА ════════════════════════
  kw("kz-16","доставка из Китая в Актобе",          "geo-kz","Казахстан","geo","commercial","low","low",6,"landing","/dostavka-iz-kitaya-aktobe"),
  kw("kz-17","доставка из Китая в Туркестан",       "geo-kz","Казахстан","geo","commercial","low","low",6,"landing","/dostavka-iz-kitaya-turkestan"),

  // ═══ ГЕО: ДОПОЛНИТЕЛЬНЫЕ ГОРОДА РОССИИ ════════════════════════════
  kw("ru-21","доставка из Китая в Красноярск",      "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-krasnoyarsk"),
  kw("ru-22","доставка из Китая в Ростов-на-Дону",  "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-rostov"),
  kw("ru-23","доставка из Китая в Самару",          "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-samara"),
  kw("ru-24","доставка из Китая в Тюмень",          "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-tyumen"),
  kw("ru-25","доставка из Китая в Уфу",             "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-ufa"),
  kw("ru-26","доставка из Китая в Иркутск",         "geo-ru","Россия","geo","commercial","medium","low",6,"landing","/dostavka-iz-kitaya-irkutsk"),
];


export function getClusterGroups(): Array<{ id: string; label: string; group: SeoKeyword["clusterGroup"]; count: number; color: string }> {
  const map = new Map<string, { label: string; group: SeoKeyword["clusterGroup"]; count: number; color: string }>();
  const colors: Record<string, string> = {
    "geo-kz": "#3b82f6", "geo-ru": "#8b5cf6", "geo-uz": "#06b6d4", "geo-by": "#14b8a6",
    "cat-mp": "#f59e0b", "cat-furniture": "#f97316", "cat-electronics": "#ec4899",
    "cat-auto": "#10b981", "cat-clothes": "#a78bfa", "cat-equipment": "#6366f1",
    "cat-build": "#84cc16", "cat-kids": "#fb923c",
    "com-supplier": "#00A86B", "com-calc": "#22d3ee",
    "info-how": "#94a3b8",
  };
  for (const kw of SEO_KEYWORDS) {
    if (!map.has(kw.cluster)) {
      map.set(kw.cluster, { label: kw.clusterLabel, group: kw.clusterGroup, count: 0, color: colors[kw.cluster] ?? "#64748b" });
    }
    map.get(kw.cluster)!.count++;
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
}
