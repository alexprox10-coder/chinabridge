import LeadMagnetForm from "./LeadMagnetForm";

export default function LeadMagnetSection() {
  return (
    <section id="lead-magnet" className="py-20 bg-[#0B1F3A]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4">
            Бесплатно
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Получите руководство по&nbsp;
            <span className="text-gradient">импорту из Китая</span>
          </h2>
          <p className="text-[#8899aa] text-base">
            PDF с калькулятором себестоимости, списком надёжных фабрик и чеклистом для первой поставки
          </p>
        </div>

        <div className="card-glass rounded-2xl p-7 border border-[#243a5e]">
          <LeadMagnetForm />
        </div>
      </div>
    </section>
  );
}
