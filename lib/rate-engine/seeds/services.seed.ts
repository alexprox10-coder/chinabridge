import type { AdditionalService } from '../types';

type SeedService = Omit<AdditionalService, 'id'>;

export const SEED_SERVICES: SeedService[] = [
  {
    name: 'Инспекция',
    description: 'Проверка товара перед отправкой: соответствие заказу, качество, количество',
    price_type: 'FIXED',
    price_value: 50,
    currency: 'USD',
    status: 'active',
  },
  {
    name: 'Фото-отчёт',
    description: 'Фотографии товара, упаковки и маркировки перед отправкой',
    price_type: 'FIXED',
    price_value: 20,
    currency: 'USD',
    status: 'active',
  },
  {
    name: 'Видео-инспекция',
    description: 'Видеофиксация распаковки и проверки товара на складе',
    price_type: 'FIXED',
    price_value: 40,
    currency: 'USD',
    status: 'active',
  },
  {
    name: 'Проверка поставщика',
    description: 'Верификация фабрики: лицензии, производственные мощности, репутация',
    price_type: 'FIXED',
    price_value: 50,
    currency: 'USD',
    status: 'active',
  },
  {
    name: 'Выкуп товара',
    description: 'Выкупаем товар с 1688/Taobao/Alibaba на свой счёт',
    price_type: 'PERCENT',
    price_value: 3,
    currency: 'USD',
    status: 'active',
  },
  {
    name: 'Страхование',
    description: 'Страхование груза на время транспортировки',
    price_type: 'PERCENT',
    price_value: 2,
    currency: 'USD',
    status: 'active',
  },
];
