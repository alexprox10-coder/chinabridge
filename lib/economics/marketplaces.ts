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
// WB: комиссии с 07.07.2026, логистика FBW с 15.09.2025
// Ozon: комиссии с 01.07.2026, логистика FBO актуальная
// Kaspi: с 01.01.2026 (10,9% + 16% НДС = 12,6%)
// Яндекс Маркет: с 01.02.2026 (FBY)

export const MARKETPLACES: MarketplaceConfig[] = [
  {
    id:    'wb',
    label: 'Wildberries',
    icon:  '🫐',
    // Для общих товаров (игрушки, дом, товары для спорта): 23%
    // Одежда/обувь: 43,5% | Ноутбуки: 23,5% | Электроника: 23-28%
    // + эквайринг 1,5% (РФ) — включён в 23%
    commission_pct: 23,
    // FBW логистика (расчёт по объёму, но аппроксимируем весом 1кг≈2л)
    // До 0,5кг (~1л): ~75₽ (32₽ × кэф.склада 1.5-2.0, среднее)
    // За каждый кг выше 0,5кг: +35₽
    logistics_base_rub:            75,
    logistics_per_kg_rub:          35,
    logistics_weight_threshold_kg: 0.5,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 12,
    returns_pct:       8,
    commission_note:   'Одежда/обувь: 43,5% | Электроника: 23–28% | Ноутбуки: 23,5%',
    tariff_date:       '2026-07-07',
  },
  {
    id:    'ozon',
    label: 'Ozon',
    icon:  '🟠',
    // Дом/Игрушки: 18% | Одежда: 22% | Смартфоны: 5% | Обувь: 50%
    // Last mile включён в комиссию; эквайринг в комиссии
    commission_pct: 18,
    // FBO логистика: до 1л = 43₽, каждый доп. литр +10₽
    // 1кг≈2л → 0,5кг=1л=43₽; 1кг=2л=53₽; 2кг=4л=73₽
    logistics_base_rub:            43,
    logistics_per_kg_rub:          20,
    logistics_weight_threshold_kg: 0.5,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 8,
    returns_pct:       5,
    commission_note:   'Одежда: 22% | Смартфоны: 5% | Обувь: 50% | Электроника: 15%',
    tariff_date:       '2026-07-01',
  },
  {
    id:    'kaspi',
    label: 'Kaspi',
    icon:  '🇰🇿',
    // 10,9% + 16% НДС Казахстана = ~12,6%
    commission_pct: 12.6,
    // Доставка покупателю по Казахстану (~1000-2000₸ ≈ 200-400₽)
    logistics_base_rub:            300,
    logistics_per_kg_rub:          50,
    logistics_weight_threshold_kg: 1,
    last_mile_pct:     0,
    last_mile_max_rub: 0,
    storage_per_unit_month_rub: 0,
    returns_pct:       2,
    commission_note:   'Включает НДС 16%. Рассрочка Fusion: +0,75–5%',
    tariff_date:       '2026-01-01',
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
    commission_note:   'FBY пакет до конца 2026. Last mile: 4,5% (макс. 1000₽)',
    tariff_date:       '2026-02-01',
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

// ₽ за единицу проданного товара (логистика маркетплейса, не доставка из Китая)
export function calcMarketplaceLogisticsPerUnit(mp: MarketplaceConfig, weightKg = 0.5, salePriceRub = 0): number {
  const base  = mp.logistics_base_rub;
  const extra = Math.max(0, weightKg - mp.logistics_weight_threshold_kg) * mp.logistics_per_kg_rub;
  const lastMile = mp.last_mile_pct > 0
    ? Math.min(salePriceRub * mp.last_mile_pct / 100, mp.last_mile_max_rub)
    : 0;
  return Math.round(base + extra + lastMile);
}
