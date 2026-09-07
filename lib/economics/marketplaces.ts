// Тарифы проверяются по официальным кабинетам продавцов.
// ВАЖНО: WB и Ozon меняют тарифы несколько раз в год.
// При изменении обновлять tariff_date и значения.

export interface MarketplaceConfig {
  id:              string;
  label:           string;
  icon:            string;
  // Комиссия с выручки (включает эквайринг для WB)
  commission_pct:  number;
  // Логистика маркетплейса ₽/ед (FBW/FBO) — зависит от веса
  logistics_base_rub:              number;
  logistics_per_kg_rub:            number;
  logistics_weight_threshold_kg:   number;
  // Последняя миля Яндекс: % от цены (не применимо у других — 0)
  last_mile_pct:   number;
  last_mile_max_rub: number;
  // Хранение ₽/ед/месяц (приблизительно, при 60-дневной оборачиваемости)
  storage_per_unit_month_rub: number;
  // Возвраты: % продаж (для расчёта средних потерь)
  returns_pct:     number;
  // Примечание по категориям
  commission_note: string;
  tariff_date:     string; // дата последней проверки тарифов
}

// ─── Реальные тарифы 2026 ────────────────────────────────────────────────────
// WB: с 15.05.2026 логистика объёмная (литры, не кг). Комиссии актуальны на 07.07.2026.
//   Шкала FBW: ≤0.2л=23₽, 0.4л=26₽, 0.6л=29₽, 0.8л=30₽, 1л=32₽, >1л: 46₽+14₽/доп.л
//   Аппроксимация через вес: 1кг ≈ 2л → порог 0.5кг=1л=32₽, дополнительно 28₽/кг
// Ozon: с 28.08.2026 повышение комиссий и логистики. С 01.09.2026 last-mile 1.1₽/л.
//   Совокупная нагрузка (комиссия+логистика): дом/одежда ~52%, электроника ~47%
// Kaspi: 10,9% + НДС 16% КЗ = 12,6%. Доставка — Kaspi платит из своей комиссии.
// Яндекс Маркет: с 01.09.2026 FBY и FBS выравнены.
// Карго из Китая: авто $2/кг (ChinaBridge, 18-22 дня), авиа ~$23/кг

export const MARKETPLACES: MarketplaceConfig[] = [
  {
    id:    'wb',
    label: 'Wildberries',
    icon:  '🫐',
    // Общие товары: 19-23% | Одежда/обувь: 25-35% (КВВ доходит до 43%) | Электроника: 10-15%
    commission_pct: 23,
    // FBW логистика объёмная с 15.05.2026 (1кг≈2л):
    // ≤0.5кг (~1л) = 32₽; сверх 0.5кг = +28₽/кг (14₽/л × 2)
    logistics_base_rub:            32,
    logistics_per_kg_rub:          28,
    logistics_weight_threshold_kg: 0.5,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 6,   // ~0.08₽/л/день × 2л × 30 дней
    returns_pct:       8,
    commission_note:   'Одежда/обувь: 25–43% | Электроника: 10–15% | Логистика объёмная с мая 2026',
    tariff_date:       '2026-08-15',
  },
  {
    id:    'ozon',
    label: 'Ozon',
    icon:  '🟠',
    // С 28.08.2026: совокупная нагрузка ~52% (дом/одежда), ~47% (электроника).
    // Базовая комиссия ~20-26% + логистика. Смартфоны: ~5-8%.
    commission_pct: 20,
    // FBO логистика с 01.09.2026: last-mile 1.1₽/л. Приёмка + обработка: ~55₽/ед
    // 1кг≈2л → base 55₽; +25₽/кг сверх 0.5кг
    logistics_base_rub:            55,
    logistics_per_kg_rub:          25,
    logistics_weight_threshold_kg: 0.5,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 10,
    returns_pct:       5,
    commission_note:   'С 28.08.2026: нагрузка дом/одежда ~52%, электроника ~47%. Смартфоны: ~5%',
    tariff_date:       '2026-09-01',
  },
  {
    id:    'kaspi',
    label: 'Kaspi',
    icon:  '🇰🇿',
    // 10,9% комиссия + НДС 16% КЗ = 12,6%. Доставка покупателю — Kaspi платит сам.
    commission_pct: 12.6,
    // Доставка внутри КЗ оплачивается Kaspi из их комиссии — у продавца 0
    logistics_base_rub:            0,
    logistics_per_kg_rub:          0,
    logistics_weight_threshold_kg: 1,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 0,
    returns_pct:       2,
    commission_note:   'Включает НДС 16%. Доставка Kaspi включена в комиссию. Рассрочка Fusion: +0,75–5%',
    tariff_date:       '2026-09-07',
  },
  {
    id:    'yandex',
    label: 'Яндекс Маркет',
    icon:  '🟡',
    // 5% (категория) + до 12% логистика + last mile 4,5%
    // Пакет FBY до конца 2026: ≈12% combined
    commission_pct: 12,
    logistics_base_rub:            60,
    logistics_per_kg_rub:          20,
    logistics_weight_threshold_kg: 0.5,
    // Last mile: 4,5% от цены, но не более 1000₽
    last_mile_pct:     4.5,
    last_mile_max_rub: 1000,
    storage_per_unit_month_rub: 0,
    returns_pct:       3,
    commission_note:   'FBY=FBS с 01.09.2026. Last mile: 4,5% (макс. 1000₽)',
    tariff_date:       '2026-09-01',
  },
  {
    id:    'shop',
    label: 'Интернет-магазин',
    icon:  '🛒',
    commission_pct: 0,
    // СДЭК / Boxberry / Почта РФ: базовая стоимость доставки
    logistics_base_rub:            350,
    logistics_per_kg_rub:          30,
    logistics_weight_threshold_kg: 1,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 0,
    returns_pct:       5,
    commission_note:   'Эквайринг ≈ 2,5%. Доставка СДЭК/аналог.',
    tariff_date:       '2026-01-01',
  },
  {
    id:    'opt',
    label: 'Опт / B2B',
    icon:  '📦',
    commission_pct: 0,
    logistics_base_rub:            0,
    logistics_per_kg_rub:          0,
    logistics_weight_threshold_kg: 0,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 0,
    returns_pct:       1,
    commission_note:   'Покупатель самовывоз или своя логистика.',
    tariff_date:       '2026-01-01',
  },
];

export function getMarketplace(id: string): MarketplaceConfig | undefined {
  return MARKETPLACES.find(m => m.id === id);
}

export function getCommission(id: string): number {
  return getMarketplace(id)?.commission_pct ?? 15;
}

// Keyword sets for category detection
const CLOTHING_KW  = /одежда|платье|брюки|джинсы|куртка|пальто|свитер|рубашка|футболка|блузка|юбка|clothing|dress|pants|jacket|shirt|jeans|sweater|服装|连衣裙|牛仔|外套/i;
const FOOTWEAR_KW  = /обувь|кроссовки|ботинки|кеды|сандалии|туфли|сапоги|мокасины|тапочки|shoes|sneakers|boots|sandals|slippers|运动鞋|鞋/i;
const LAPTOP_KW    = /ноутбук|laptop|笔记本/i;
const PHONE_KW     = /смартфон|iphone|samsung galaxy|xiaomi|honor|realme|oppo|vivo|телефон android|手机|智能手机/i;

/**
 * Returns the correct commission % for a marketplace based on product category.
 * Falls back to the marketplace default if no category match.
 */
export function detectCommissionPct(
  marketplaceId: string,
  productName?: string,
  productNameEn?: string,
  productNameCn?: string,
): number {
  const mp = getMarketplace(marketplaceId);
  if (!mp) return 15;

  const text = [productName, productNameEn, productNameCn].filter(Boolean).join(' ');

  if (marketplaceId === 'wb') {
    if (FOOTWEAR_KW.test(text) || CLOTHING_KW.test(text)) return 35; // с 2026: 25-43% в зависимости от КВВ
    if (LAPTOP_KW.test(text)) return 23.5;
    return mp.commission_pct; // 23%
  }

  if (marketplaceId === 'ozon') {
    if (FOOTWEAR_KW.test(text)) return 52; // с 28.08.2026: совокупная нагрузка ~52%
    if (CLOTHING_KW.test(text)) return 26; // комиссия выросла с 22% до 26%
    if (PHONE_KW.test(text))    return 5;
    return mp.commission_pct; // 20%
  }

  return mp.commission_pct;
}

// ₽ за единицу проданного товара (логистика маркетплейса, не доставка из Китая)
export function calcMarketplaceLogisticsPerUnit(mp: MarketplaceConfig, weightKg = 0.5, salePriceRub = 0): number {
  const base  = mp.logistics_base_rub;
  const extra = Math.max(0, weightKg - mp.logistics_weight_threshold_kg) * mp.logistics_per_kg_rub;
  const lastMile = mp.last_mile_pct > 0
    ? Math.min(salePriceRub * mp.last_mile_pct / 100, mp.last_mile_max_rub)
    : 0;
  return Math.round(base + extra + lastMile);
}
