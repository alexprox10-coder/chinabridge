import Link from "next/link";

interface RelatedLink {
  href: string;
  emoji: string;
  title: string;
  description: string;
}

export function RelatedContent({ links }: { links: RelatedLink[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4 text-white">Читайте также</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-3 bg-[#0f2644]/40 border border-[#243a5e] hover:border-[#00A86B]/50 rounded-xl p-4 transition-colors group"
          >
            <span className="text-2xl shrink-0">{link.emoji}</span>
            <div>
              <p className="font-medium text-white group-hover:text-[#00A86B] transition-colors">{link.title}</p>
              <p className="text-[#8899aa] text-sm mt-0.5">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
