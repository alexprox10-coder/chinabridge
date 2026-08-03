export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  cover_image?: string;
  category: string;
  created_at: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
}

export const CATEGORIES = [
  "Доставка",
  "Закупка",
  "Поставщики",
  "Маркетплейсы",
  "Таможня",
  "Советы",
] as const;
