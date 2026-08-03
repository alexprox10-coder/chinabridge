export const WHY_CHINABRIDGE = [
  'Представители в ключевых городах Китая',
  'Физическая проверка производителей',
  'Контроль качества на каждом этапе',
  'Фото и видео отчеты с фабрики',
  'Консолидация грузов разных поставщиков',
  'Доставка в Россию и Казахстан',
  'Таможенное сопровождение под ключ',
  'Персональный менеджер для каждого клиента',
  'Поддержка на русском языке 7 дней в неделю',
];

export const COOPERATION_STEPS = [
  'Анализ заявки и подбор решения',
  'Поиск и проверка поставщика',
  'Согласование условий и цены',
  'Выкуп товара у поставщика',
  'Контроль качества на складе',
  'Консолидация и упаковка',
  'Таможенное оформление',
  'Международная доставка',
  'Получение груза клиентом',
];

export const CONTACTS = {
  phone: '+7 (XXX) XXX-XX-XX',
  telegram: '@ChinaBridgeManager',
  email: 'info@chinabridge.ru',
  website: 'chinabridge.ru',
};

export const FIELD_LABELS: Record<string, string> = {
  product: 'Наименование товара',
  productLink: 'Ссылка на товар (Alibaba / 1688)',
  weight: 'Вес груза (кг)',
  volume: 'Объём груза (м³)',
  quantity: 'Количество / объём заказа',
  toCity: 'Город / адрес доставки',
  category: 'Категория товара',
  countryDestination: 'Страна назначения',
  phone: 'Контактный телефон',
  email: 'Email',
};

export function getMissingFields(lead: Record<string, string>): string[] {
  const checks: Array<{ key: string; value: string }> = [
    { key: 'product', value: lead.product },
    { key: 'productLink', value: lead.productLink },
    { key: 'weight', value: lead.weight },
    { key: 'volume', value: lead.volume },
    { key: 'quantity', value: lead.quantity },
    { key: 'toCity', value: lead.toCity },
    { key: 'countryDestination', value: lead.countryDestination },
  ];
  return checks.filter(c => !c.value).map(c => FIELD_LABELS[c.key] ?? c.key);
}
