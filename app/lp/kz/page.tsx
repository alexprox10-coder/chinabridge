import type { Metadata } from "next";
import KzForm from "./KzForm";

export const metadata: Metadata = {
  title: "Доставка из Китая в Казахстан | ChinaBridge",
  description:
    "Карго и сборные грузы из Китая в Казахстан. Представитель на месте в Китае. От 50 кг. Получите расчёт бесплатно за 15 минут.",
  robots: { index: false, follow: false },
};

export default function KzLandingPage() {
  return <KzForm />;
}
