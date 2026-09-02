import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { KnowledgeUI } from "@/components/knowledge/KnowledgeUI";

export const metadata: Metadata = {
  title: "База знаний по импорту из Китая — ChinaBridge",
  description:
    "Ответы на частые вопросы об импорте из Китая, доставке, таможне и работе с поставщиками. AI-консультант онлайн.",

  alternates: { canonical: "https://chinabridge.pro/knowledge" },
};

export default function KnowledgePage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
              FAQ и AI-консультант
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Вопросы об <span className="text-gradient">импорте</span>
              <br />
              из Китая
            </h1>
            <p className="text-[#8899aa] text-lg">
              Ответы на частые вопросы и AI-консультант онлайн — бесплатно
            </p>
          </div>
          <KnowledgeUI />
        </div>
      </div>
      <Footer />
    </main>
  );
}
