import type { Metadata } from "next";
import { NicheLeadPage } from "@/components/niche/NicheLeadPage";

export const metadata: Metadata = {
  title: "Автозапчасти из Китая под заказ | ChinaBridge",
  description: "Доставка автозапчастей из Китая в Россию и Казахстан. Оригинал и аналоги напрямую с завода. Белый ввоз, полные сертификаты. КЗ от 30 кг, Россия от 100 кг, подбор по VIN.",

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
