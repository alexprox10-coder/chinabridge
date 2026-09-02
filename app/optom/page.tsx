import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Любой товар из Китая оптом | ChinaBridge",
  description: "Есть офис в Гуанчжоу и склад — везём всё. Найдём поставщика, проверим, привезём.",

  alternates: { canonical: "https://chinabridge.pro/optom" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "🛒",
      title: "Любой товар из Китая оптом",
      subtitle: "Есть офис в Гуанчжоу и склад — везём всё. Найдём поставщика, проверим, привезём.",
      product_placeholder: "Любой товар, который вам нужен",
      source: "niche_general",
      benefits: [
        "Поиск поставщика и проверка фабрики",
      "Переговоры с производителем на китайском",
      "Белый ввоз с полным пакетом документов",
      "Доставка в РФ и Казахстан от 7 дней"
      ],
    }} />
  );
}
