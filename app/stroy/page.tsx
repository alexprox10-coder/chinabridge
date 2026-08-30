import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Стройматериалы из Китая оптом | ChinaBridge",
  description: "Плитка, арматура, сантехника, опалубка — сборным грузом от 50 кг или полным контейнером.",
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "🏗",
      title: "Стройматериалы из Китая оптом",
      subtitle: "Плитка, арматура, сантехника, опалубка — сборным грузом от 50 кг или полным контейнером.",
      product_placeholder: "Плитка, арматура, сантехника...",
      source: "niche_construction",
      benefits: [
        "Сборные грузы от 50 кг — не нужно ждать полного контейнера",
      "Сертификаты и паспорта качества",
      "Доставка в любой город РФ и Казахстана",
      "Растаможка с полным пакетом документов"
      ],
    }} />
  );
}
