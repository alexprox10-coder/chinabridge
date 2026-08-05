"use client";

import { useState, useRef, useEffect } from "react";
import { trackGAEvent } from "@/lib/analytics/ga";

export default function VideoBlock() {
  const [playing, setPlaying] = useState(false);
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

  function handlePlay() {
    trackGAEvent("video_start", { block: "main_page" });
    setPlaying(true);
  }

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

        <div className="fade-up relative rounded-2xl overflow-hidden bg-[#0B1F3A] border border-[#243a5e] aspect-video shadow-2xl shadow-[#00A86B]/5">
          {playing ? (
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="ChinaBridge — как работает AI-платформа импорта"
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              {/* Placeholder bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f2644] via-[#0B1F3A] to-[#071628]" />

              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(0,168,107,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }} />

              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#00A86B]/10 blur-3xl pointer-events-none" />

              {/* Play button */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex flex-col items-center justify-center group"
                aria-label="Воспроизвести видео"
              >
                <div className="w-20 h-20 rounded-full bg-[#00A86B] flex items-center justify-center shadow-xl shadow-[#00A86B]/30 group-hover:scale-110 group-hover:bg-[#009060] transition-all mb-4">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-base group-hover:text-[#00A86B] transition-colors">
                  Смотреть видео
                </span>
                <span className="text-[#8899aa] text-sm mt-1">2 минуты · без воды</span>
              </button>

              {/* Duration badge */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2.5 py-1 rounded-lg">
                2:14
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
