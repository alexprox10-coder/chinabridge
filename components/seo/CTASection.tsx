import Link from "next/link";

interface CTASectionProps {
  title?: string;
  text?: string;
  buttonText?: string;
  href?: string;
}

export function CTASection({
  title = "Готовы начать?",
  text = "Рассчитайте стоимость доставки из Китая онлайн за 30 секунд. Бесплатно и без обязательств.",
  buttonText = "Рассчитать доставку",
  href = "/#calculator",
}: CTASectionProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#0f2644] to-[#0B1F3A] border border-[#243a5e] rounded-3xl p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{title}</h2>
          <p className="text-[#8899aa] mb-8 max-w-lg mx-auto">{text}</p>
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#00A86B]/20 text-sm"
          >
            {buttonText} →
          </Link>
        </div>
      </div>
    </section>
  );
}
