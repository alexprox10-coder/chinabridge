import Link from "next/link";

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export function ServiceCard({ icon, title, description, href }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 p-6 bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl hover:border-[#00A86B]/40 transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-[#00A86B] transition-colors">
        {title}
      </h3>
      <p className="text-[#8899aa] text-xs leading-relaxed">{description}</p>
      <span className="text-[#00A86B] text-xs font-medium mt-auto">Подробнее →</span>
    </Link>
  );
}
