import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CTASection } from "@/components/seo/CTASection";
import { ArticleCard } from "@/components/seo/ArticleCard";
import { getArticleBySlug, getPublishedArticles, ARTICLES } from "@/lib/blog/articles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARTICLES.filter((a) => a.published).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.seo_title,
    description: article.seo_description,
    alternates: { canonical: `https://chinabridge.pro/blog/${article.slug}` },
    openGraph: {
      title: article.seo_title,
      description: article.seo_description,
      url: `https://chinabridge.pro/blog/${article.slug}`,
      type: "article",
      publishedTime: article.created_at,
    },
  };
}

function renderContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    elements.push(
      <div key={key++} className="overflow-x-auto my-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#243a5e]">
              {tableHeader.map((h, i) => (
                <th key={i} className="text-left py-2 px-4 text-[#8899aa] font-medium">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-[#243a5e]/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-2 px-4 text-[#8899aa]">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    tableHeader = [];
    inTable = false;
  };

  for (const line of lines) {
    if (line.startsWith("|")) {
      if (!inTable) inTable = true;
      const cells = line.split("|").slice(1, -1);
      if (line.includes("---")) continue;
      if (tableHeader.length === 0) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-white mt-8 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="text-lg font-semibold text-white mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={key++} className="font-semibold text-white mt-3 mb-1">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="flex gap-2 text-[#8899aa] text-sm mb-1">
          <span className="text-[#00A86B] mt-0.5 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }} />
        </li>
      );
    } else if (line.startsWith("🚩 ")) {
      elements.push(
        <li key={key++} className="flex gap-2 text-[#8899aa] text-sm mb-1">
          <span className="shrink-0">🚩</span>
          <span>{line.slice(3)}</span>
        </li>
      );
    } else if (line.startsWith("```")) {
      // skip code fences
    } else if (line.trim() === "") {
      // spacer
    } else {
      elements.push(
        <p key={key++} className="text-[#8899aa] text-sm leading-relaxed mb-3"
           dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }} />
      );
    }
  }

  if (inTable) flushTable();

  return <>{elements}</>;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.created_at,
    author: { "@type": "Organization", name: "ChinaBridge" },
    publisher: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
    url: `https://chinabridge.pro/blog/${article.slug}`,
  };

  const others = getPublishedArticles().filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Блог", href: "/blog" },
          { label: article.title },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-0.5 bg-[#00A86B]/20 text-[#00A86B] rounded-full">{article.category}</span>
          <time className="text-xs text-[#8899aa]">
            {new Date(article.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </time>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>
        <p className="text-[#8899aa] text-base mb-8 border-l-2 border-[#00A86B] pl-4">{article.description}</p>

        <div className="prose-custom">
          {renderContent(article.content)}
        </div>

        {/* CTA in article */}
        <div className="mt-10 p-6 bg-[#0f2644]/60 border border-[#00A86B]/30 rounded-2xl text-center">
          <p className="text-white font-semibold mb-3">Готовы рассчитать стоимость доставки?</p>
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать доставку →
          </Link>
        </div>
      </article>

      {others.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold mb-6">Читайте также</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {others.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      <CTASection />
    </main>
  );
}
