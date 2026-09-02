import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Одежда и текстиль из Китая оптом | ChinaBridge",
  description: "Найдём фабрику под ваш бренд или готовый товар. Сборный груз от 50 кг — не нужен полный контейнер.",

  alternates: { canonical: "https://chinabridge.pro/odezhda" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "👕",
      title: "Одежда и текстиль из Китая оптом",
      subtitle: "Найдём фабрику под ваш бренд или готовый товар. Сборный груз от 50 кг — не нужен полный контейнер.",
      product_placeholder: "Худи, футболки, куртки...",
      source: "niche_clothing",
      benefits: [
        "Подбор фабрики под ваш артикул и ценовой диапазон",
      "Пошив под вашим брендом (OEM)",
      "Сборный груз от 50 кг без предоплаты контейнера",
      "Маркировка и этикетки для WB и Ozon"
      ],
    }} />
  );
}
