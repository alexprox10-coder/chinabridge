import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  verification: {
    yandex: "be3fd486b564a5bd",
    google: "lgZfH3nQygv8lk-9Sy4BTqvM63qARyY9xDq5UJX8vAg",
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
        <Script id="vk-ads-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{__html: `var _tmr=window._tmr||(window._tmr=[]);_tmr.push({id:"3787763",type:"pageView",start:(new Date()).getTime()});(function(d,w,id){if(d.getElementById(id))return;var ts=d.createElement("script");ts.type="text/javascript";ts.async=true;ts.id=id;ts.src="https://top-fwz1.mail.ru/js/code.js";var f=function(){var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(ts,s);};if(w.opera=="[object Opera]"){d.addEventListener("DOMContentLoaded",f,false);}else{f();}})(document,window,"tmr-code");`}} />
        <noscript><div><img src="https://top-fwz1.mail.ru/counter?id=3787763;js=na" style={{position:"absolute",left:"-9999px"}} alt="Top.Mail.Ru" /></div></noscript>
      </body>
    </html>
  );
}
