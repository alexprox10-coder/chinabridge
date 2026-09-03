import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Электроника и гаджеты из Китая | ChinaBridge",
  description: "Найдём производителя, проверим фабрику, привезём с документами. Работаем с любым ассортиментом.",

  alternates: { canonical: "https://chinabridge.pro/elektronika" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "📱",
      title: "Электроника и гаджеты из Китая",
      subtitle: "Найдём производителя, проверим фабрику, привезём с документами. Работаем с любым ассортиментом.",
      product_placeholder: "Наушники, смартфоны, гаджеты...",
      source: "niche_electronics",
      benefits: [
        "Прямые поставки с заводов Shenzhen и Dongguan",
        "Проверка качества до отправки",
        "Белый ввоз с полным пакетом документов",
        "Авиа 5-7 дней или море 18-25 дней"
      ],
      price_anchor: "от $2.5/кг авиа · от $0.8/кг море",
      social_proof: "200+ клиентов · работаем с 2020",
    }} />
  );
}
