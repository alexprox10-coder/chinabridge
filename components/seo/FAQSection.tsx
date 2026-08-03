"use client";
import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
  withSchema?: boolean;
}

export function FAQSection({ items, title = "Часто задаваемые вопросы", withSchema = true }: FAQSectionProps) {
  const [open, setOpen] = useState<number | null>(null);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section className="py-12 px-4">
      {withSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">{title}</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="border border-[#243a5e] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white text-sm leading-relaxed">{item.question}</span>
                <span className={`text-[#00A86B] text-lg shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-[#8899aa] text-sm leading-relaxed border-t border-[#243a5e]/50 pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
