import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Автозапчасти из Китая под заказ | ChinaBridge",
  description: "Оригинал и аналоги напрямую с завода. Белый ввоз, полные документы, доставка в РФ и Казахстан.",

  alternates: { canonical: "https://chinabridge.pro/avtozapchasti" },
};

export default function Page() {
  return (
    <NicheLeadPage config={{
      emoji: "🔧",
      title: "Автозапчасти из Китая под заказ",
      subtitle: "Оригинал и аналоги напрямую с завода. Белый ввоз, полные документы, доставка в РФ и Казахстан.",
      product_placeholder: "Марка авто, номер запчасти...",
      source: "niche_auto_parts",
      benefits: [
        "Оригинальные запчасти и качественные аналоги",
      "Личная проверка на складе в Гуанчжоу",
      "Сертификаты соответствия и паспорта качества",
      "Растаможка под ключ"
      ],
    }} />
  );
}
