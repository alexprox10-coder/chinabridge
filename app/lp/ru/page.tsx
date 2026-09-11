import type { Metadata } from "next";
import RuForm from "./RuForm";

export const metadata: Metadata = {
  title: "Доставка из Китая в Россию | ChinaBridge",
  description:
    "Карго и сборные грузы из Китая в Россию. Wildberries, Ozon. Представитель на месте в Китае. Оставьте заявку — расчёт за 15 минут.",
  robots: { index: false, follow: false },
};

export default function RuLandingPage() {
  return <RuForm />;
}
