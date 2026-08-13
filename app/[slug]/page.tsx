import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

type SeoPage = {
  slug: string; keyword: string; cluster: string;
  title: string; description: string; h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
  cta_text: string;
};

async function getPage(slug: string): Promise<SeoPage | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT slug, keyword, cluster, title, description, h1, intro, sections, faq, cta_text
      FROM seo_pages WHERE slug = ${slug} AND status = 'published' LIMIT 1
    ` as SeoPage[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Страница не найдена" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `https://chinabridge.pro/${slug}` },
    openGraph: { title: page.title, description: page.description, url: `https://chinabridge.pro/${slug}` },
  };
}

export default async function SeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const sections = Array.isArray(page.sections) ? page.sections : [];
  const faq = Array.isArray(page.faq) ? page.faq : [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
    description: page.description,
    areaServed: ["Russia", "Kazakhstan"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />
      <main className="min-h-screen bg-[#040d1a] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              ChinaBridge · Импорт из Китая
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-5">{page.h1}</h1>
            <p className="text-lg text-[#8899aa] leading-relaxed max-w-2xl">{page.intro}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12 p-5 rounded-2xl border border-[#243a5e] bg-[#0B1F3A]/50">
            {[
              { v: "500+", l: "поставок с 2019" },
              { v: "25–35", l: "дней до склада" },
              { v: "20–40%", l: "экономия vs Alibaba" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold text-[#00A86B]">{s.v}</div>
                <div className="text-xs text-[#8899aa] mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Content sections */}
          {sections.length > 0 && (
            <div className="space-y-8 mb-12">
              {sections.map((s, i) => (
                <div key={i} className="p-6 rounded-2xl border border-[#243a5e] bg-[#0B1F3A]/30">
                  <h2 className="text-xl font-bold mb-3">{s.heading}</h2>
                  <p className="text-[#8899aa] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA block */}
          <div className="mb-12 p-8 rounded-3xl border border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/10 to-[#0B1F3A] text-center">
            <p className="text-lg font-semibold mb-2">{page.cta_text}</p>
            <p className="text-[#8899aa] text-sm mb-6">Менеджер ответит в течение 2 часов и пришлёт расчёт</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ai-calculator"
                className="px-6 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all">
                Рассчитать стоимость →
              </Link>
              <Link href="/#calculator"
                className="px-6 py-3 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white rounded-xl transition-all">
                Оставить заявку
              </Link>
            </div>
          </div>

          {/* FAQ */}
          {faq.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Частые вопросы</h2>
              <div className="space-y-4">
                {faq.map((item, i) => (
                  <details key={i} className="group p-5 rounded-2xl border border-[#243a5e] bg-[#0B1F3A]/30 cursor-pointer">
                    <summary className="font-semibold list-none flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-[#00A86B] text-xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                    </summary>
                    <p className="mt-3 text-[#8899aa] leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/" className="text-[#8899aa] hover:text-white transition-colors">← Главная</Link>
            <Link href="/ai-calculator" className="text-[#8899aa] hover:text-white transition-colors">Калькулятор маржи</Link>
            <Link href="/delivery" className="text-[#8899aa] hover:text-white transition-colors">Доставка из Китая</Link>
            <Link href="/fulfilment" className="text-[#8899aa] hover:text-white transition-colors">Фулфилмент</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
