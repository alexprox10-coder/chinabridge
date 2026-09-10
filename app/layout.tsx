import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
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
  verification: {
    yandex: "be3fd486b564a5bd",
    google: "lgZfH3nQygv8lk-9Sy4BTqvM63qARyY9xDq5UJX8vAg",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://chinabridge.pro/#organization",
      "name": "ChinaBridge",
      "url": "https://chinabridge.pro",
      "description": "Импорт товаров из Китая под ключ в Россию и Казахстан. Доставка, таможня, поиск поставщиков для Wildberries и Ozon.",
      "foundingDate": "2019",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["Russian", "Chinese"],
          "url": "https://t.me/ChinaBridgeLID_bot"
        },
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["Russian"],
          "email": "info@chinabridge.pro"
        }
      ],
      "address": [
        {
          "@type": "PostalAddress",
          "addressCountry": "RU",
          "addressLocality": "Благовещенск",
          "addressRegion": "Амурская область"
        },
        {
          "@type": "PostalAddress",
          "addressCountry": "CN",
          "addressLocality": "Гуанчжоу"
        }
      ],
      "areaServed": ["RU", "KZ", "BY", "AM"],
      "sameAs": ["https://t.me/chinabridgeline"]
    },
    {
      "@type": "WebSite",
      "@id": "https://chinabridge.pro/#website",
      "url": "https://chinabridge.pro",
      "name": "ChinaBridge",
      "publisher": { "@id": "https://chinabridge.pro/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://chinabridge.pro/ai-calculator?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* Reload once on ChunkLoadError — clears stale JS bundle references */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            if (e && e.message && (e.message.indexOf('Loading chunk') !== -1 || e.message.indexOf('ChunkLoadError') !== -1)) {
              if (!sessionStorage.getItem('_chunk_reload')) {
                sessionStorage.setItem('_chunk_reload', '1');
                window.location.reload();
              }
            }
          }, true);
        `}} />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
