import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ChatWidgetLoader from "@/components/chat/ChatWidgetLoader";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chinabridge.pro"),
  title: "ChinaBridge — поиск товаров и доставка из Китая",
  description: "Помогаем предпринимателям находить производителей в Китае, проверять фабрики и доставлять товары в Казахстан и Россию",
  keywords: "доставка из Китая, поиск поставщика Китай, закупки Китай Казахстан, проверка фабрики Китай",
  openGraph: {
    title: "ChinaBridge — Ваш представитель в Китае",
    description: "Найдём производителя, проверим фабрику, выкупим товар и доставим в Казахстан и Россию",
    type: "website",
    locale: "ru_RU",
    siteName: "ChinaBridge",
    url: "https://chinabridge.pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChinaBridge — поиск товаров и доставка из Китая",
    description: "Представитель в Китае. Проверка фабрик. Сборные грузы от 50 кг.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <body className="bg-background text-foreground antialiased font-sans">
        <AnalyticsProvider />
        {children}
        <ChatWidgetLoader />
      </body>
    </html>
  );
}
