import Link from "next/link";
import type { Article } from "@/lib/blog/types";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl overflow-hidden hover:border-[#00A86B]/40 transition-colors"
    >
      <div className="h-40 bg-gradient-to-br from-[#0B1F3A] to-[#0f2644] flex items-center justify-center text-5xl">
        {article.category === "Доставка" ? "🚚" :
         article.category === "Закупка" ? "🛒" :
         article.category === "Поставщики" ? "🏭" :
         article.category === "Маркетплейсы" ? "📦" :
         article.category === "Таможня" ? "📋" : "💡"}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-[#00A86B]/20 text-[#00A86B] rounded-full">{article.category}</span>
          <span className="text-xs text-[#8899aa]">
            {new Date(article.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <h3 className="font-semibold text-white text-sm leading-snug mb-2 group-hover:text-[#00A86B] transition-colors">
          {article.title}
        </h3>
        <p className="text-[#8899aa] text-xs leading-relaxed flex-1">{article.description}</p>
        <span className="mt-4 text-[#00A86B] text-xs font-medium">Читать →</span>
      </div>
    </Link>
  );
}
