export interface MarketplaceConfig {
  id: string;
  label: string;
  commission: number;
  icon: string;
}

export const MARKETPLACES: MarketplaceConfig[] = [
  { id: 'wb',     label: 'Wildberries',     commission: 15, icon: '🫐' },
  { id: 'ozon',   label: 'Ozon',            commission: 17, icon: '🟠' },
  { id: 'kaspi',  label: 'Kaspi',           commission: 10, icon: '🇰🇿' },
  { id: 'yandex', label: 'Яндекс Маркет',   commission: 12, icon: '🟡' },
  { id: 'shop',   label: 'Интернет-магазин', commission: 0,  icon: '🛒' },
  { id: 'opt',    label: 'Опт / B2B',        commission: 0,  icon: '📦' },
];

export function getCommission(marketplaceId: string): number {
  return MARKETPLACES.find(m => m.id === marketplaceId)?.commission ?? 0;
}
