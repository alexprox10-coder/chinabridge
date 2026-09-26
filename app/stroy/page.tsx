import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Стройматериалы из Китая оптом | ChinaBridge",
  description: "Стройматериалы из Китая оптом: плитка, арматура, сантехника, опалубка, фасадные панели. Доставка в Россию и Казахстан. КЗ от 30 кг, Россия от 100 кг или полный контейнер.",

  alternates: { canonical: "https://chinabridge.pro/stroy" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "🏗",
      title: "Стройматериалы из Китая оптом",
      subtitle: "Плитка, арматура, сантехника, опалубка — сборным грузом (КЗ от 30 кг, РФ от 100 кг) или полным контейнером.",
      product_placeholder: "Плитка, арматура, сантехника...",
      source: "niche_construction",
      benefits: [
        "Сборные грузы: КЗ от 30 кг, Россия от 100 кг — не нужно ждать полного контейнера",
      "Сертификаты и паспорта качества",
      "Доставка в любой город РФ и Казахстана",
      "Растаможка с полным пакетом документов"
      ],
    }} />
  );
}
