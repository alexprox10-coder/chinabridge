import { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/blog/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getPublishedArticles();

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `https://chinabridge.pro/blog/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    { url: "https://chinabridge.pro", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://chinabridge.pro/services", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://chinabridge.pro/services/china-delivery", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/services/1688-buyout", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/services/supplier-search", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/services/cargo-consolidation", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/services/inspection", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/delivery", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/delivery/china-moscow", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/delivery/china-spb", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://chinabridge.pro/delivery/china-khabarovsk", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://chinabridge.pro/delivery/china-blagoveshchensk", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://chinabridge.pro/delivery/china-kazakhstan", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://chinabridge.pro/import-iz-kitaya", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://chinabridge.pro/dostavka-iz-kitaya", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://chinabridge.pro/rastamozhka", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/postavschiki-kitaya", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://chinabridge.pro/blog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://chinabridge.pro/faq", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://chinabridge.pro/contacts", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    ...articleUrls,
  ];
}
