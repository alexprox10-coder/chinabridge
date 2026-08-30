import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Товары для дома из Китая для маркетплейсов | ChinaBridge",
  description: "Поставки напрямую с производства. Маркировка и документы под WB и Ozon включены в стоимость.",
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "🏠",
      title: "Товары для дома из Китая для маркетплейсов",
      subtitle: "Поставки напрямую с производства. Маркировка и документы под WB и Ozon включены в стоимость.",
      product_placeholder: "Органайзеры, посуда, декор...",
      source: "niche_home_goods",
      benefits: [
        "Прямые контракты с производителями",
      "Штрихкоды, ярлыки и упаковка под маркетплейс",
      "Инспекция качества перед отправкой",
      "Море 18-25 дней, авиа 5-7 дней"
      ],
    }} />
  );
}
