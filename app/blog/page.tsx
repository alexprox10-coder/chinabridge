import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ArticleCard } from "@/components/seo/ArticleCard";
import { CTASection } from "@/components/seo/CTASection";
import { getPublishedArticles } from "@/lib/blog/articles";

export const metadata: Metadata = {
  title: "Блог о доставке из Китая — ChinaBridge",
  description: "Статьи о доставке из Китая, закупках на 1688, Alibaba, работе с поставщиками, таможне и маркетплейсах. Полезные руководства для импортёров.",
  keywords: "блог доставка из Китая, закупки в Китае, поставщики 1688, таможня Китай, маркетплейсы доставка",
  alternates: { canonical: "https://chinabridge.pro/blog" },
  openGraph: {
    title: "Блог о доставке из Китая — ChinaBridge",
    description: "Полезные статьи для импортёров: закупки, поставщики, таможня, маркетплейсы.",
    url: "https://chinabridge.pro/blog",
    type: "website",
  },
};

export default function BlogPage() {
  const articles = getPublishedArticles();

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Блог" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Блог о доставке из Китая
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-10">
          Практические руководства для предпринимателей, которые работают или планируют
          работать с китайскими поставщиками.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <CTASection />
    </main>
  );
}
