"use client";

import { useEffect, useRef } from "react";

export default function VideoBlock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.2 }
    );
    el.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 bg-[#060f1e]" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Как это работает&nbsp;
            <span className="text-gradient">за 2 минуты</span>
          </h2>
          <p className="text-[#8899aa] text-base">
            Смотрите, как AI-платформа ChinaBridge превращает импорт в прозрачный управляемый процесс
          </p>
        </div>

        {/* Video placeholder — пусто, видео будет добавлено позже */}
        <div className="fade-up relative rounded-2xl overflow-hidden bg-[#0B1F3A] border border-[#243a5e] aspect-video shadow-2xl shadow-[#00A86B]/5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f2644] via-[#0B1F3A] to-[#071628]" />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,168,107,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8899aa]">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="text-sm opacity-40">Видео скоро появится</span>
          </div>
        </div>
      </div>
    </section>
  );
}
