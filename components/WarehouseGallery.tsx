import Image from "next/image";

const PHOTOS = [
  {
    src:  "/photos/warehouse-office.jpg",
    alt:  "Офис ChinaBridge внутри склада в Китае",
    span: "col-span-2 row-span-2",
    caption: "Наш офис и склад в Китае — работаем на месте",
  },
  {
    src:  "/photos/office-china.jpg",
    alt:  "Офис ChinaBridge в Китае",
    span: "",
    caption: "Офис в Китае",
  },
  {
    src:  "/photos/warehouse-full.jpg",
    alt:  "Склад ChinaBridge — партии готовы к отправке",
    span: "",
    caption: "Партии готовы к отправке",
  },
  {
    src:  "/photos/warehouse-boxes.jpg",
    alt:  "Склад ChinaBridge — товары клиентов",
    span: "col-span-2",
    caption: "Товары клиентов на консолидационном складе",
  },
] as const;

export default function WarehouseGallery() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00A86B] mb-2">
          Мы реально там
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Наш офис и склад в Китае
        </h2>
        <p className="text-[#8899aa] text-sm max-w-xl mx-auto">
          Собственный офис и консолидационный склад — не посредник, а прямой представитель.
          Товар у нас, пока едет к вам.
        </p>
      </div>

      {/* Grid — mobile: 2 cols, desktop: 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[200px] sm:auto-rows-[220px]">
        {/* Big photo — spans 2 cols + 2 rows on desktop, full width on mobile */}
        <div className="relative rounded-2xl overflow-hidden col-span-2 row-span-1 sm:row-span-2 group">
          <Image
            src="/photos/warehouse-office.jpg"
            alt="Офис ChinaBridge внутри склада в Китае"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
            Наш офис и склад — работаем на месте в Китае
          </p>
        </div>

        {/* Office photo */}
        <div className="relative rounded-2xl overflow-hidden group">
          <Image
            src="/photos/office-china.jpg"
            alt="Офис ChinaBridge в Китае"
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-medium">Офис в Китае</p>
        </div>

        {/* Warehouse full */}
        <div className="relative rounded-2xl overflow-hidden group">
          <Image
            src="/photos/warehouse-full.jpg"
            alt="Склад ChinaBridge — партии готовы к отправке"
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-medium">Готовим партии к отправке</p>
        </div>

        {/* Warehouse boxes — spans 2 cols */}
        <div className="relative rounded-2xl overflow-hidden col-span-2 group">
          <Image
            src="/photos/warehouse-boxes.jpg"
            alt="Склад ChinaBridge — товары клиентов"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
            Консолидационный склад — товары клиентов ждут рейса
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-3 gap-4 border border-white/10 rounded-2xl p-5 bg-white/5">
        {[
          { n: "2019", label: "Работаем с" },
          { n: "500+", label: "Партий доставлено" },
          { n: "Китай", label: "Офис на месте" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-white">{s.n}</p>
            <p className="text-xs text-[#8899aa] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
