import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChinaBridge — поиск товаров и доставка из Китая",
  description: "Помогаем предпринимателям находить производителей в Китае, проверять фабрики и доставлять товары в Казахстан и Россию",
  keywords: "доставка из Китая, поиск поставщика Китай, закупки Китай Казахстан, проверка фабрики Китай",
  openGraph: {
    title: "ChinaBridge — Ваш представитель в Китае",
    description: "Найдём производителя, проверим фабрику, выкупим товар и доставим в Казахстан и Россию",
    type: "website",
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChinaBridge — поиск товаров и доставка из Китая",
    description: "Представитель в Пекине. Проверка фабрик. Сборные грузы от 50 кг.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
