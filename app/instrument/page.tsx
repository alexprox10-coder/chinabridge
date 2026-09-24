import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Инструменты и оборудование из Китая | ChinaBridge",
  description: "Инструменты и промышленное оборудование из Китая в Россию и Казахстан. Проверим завод лично, согласуем цену, доставим с сертификатами. Сборный груз от 50 кг.",

  alternates: { canonical: "https://chinabridge.pro/instrument" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "⚙️",
      title: "Инструменты и оборудование из Китая",
      subtitle: "Проверим завод лично, согласуем цену, доставим официально с сертификатами.",
      product_placeholder: "Болгарки, дрели, компрессоры...",
      source: "niche_equipment",
      benefits: [
        "Личная проверка завода нашим представителем в Гуанчжоу",
      "Сертификаты CE, ISO, ТР ТС по запросу",
      "Контейнерные и сборные отправки",
      "Оборудование от 100 кг"
      ],
    }} />
  );
}
