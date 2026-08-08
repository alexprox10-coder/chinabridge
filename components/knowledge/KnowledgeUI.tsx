"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const FAQ_ITEMS = [
  {
    q: "Как начать работу с ChinaBridge?",
    a: "Оставьте заявку на сайте или напишите @chinabridge в Telegram. Опишите товар — ответим за 15 минут в рабочее время.",
  },
  {
    q: "Есть ли минимальный заказ?",
    a: "Для сборного груза (консолидации) — от 50 кг. Для поиска поставщика и других услуг — минимума нет.",
  },
  {
    q: "Как рассчитать стоимость доставки?",
    a: "Используйте наш калькулятор — введите товар, вес/объём и город назначения, получите мгновенный расчёт. Для точной цены менеджер уточнит детали.",
  },
  {
    q: "Как вы гарантируете качество товара?",
    a: "Проводим инспекцию на складе в Китае перед отправкой: замеры, комплектность, фотоотчёт. Услуга «Контроль качества» от 12 000 ₽.",
  },
  {
    q: "В какой валюте вы работаете?",
    a: "Принимаем оплату в рублях и тенге. Сами конвертируем и платим производителю в юанях.",
  },
  {
    q: "Работаете ли с частными лицами?",
    a: "Да, работаем с физическими лицами, ИП и юридическими лицами.",
  },
  {
    q: "Сколько времени занимает доставка?",
    a: "Казахстан: 12–18 дней (сборный груз). Россия: 10–21 день (сборный). Контейнер — 18–35 дней в зависимости от маршрута.",
  },
  {
    q: "Что нельзя везти из Китая?",
    a: "Запрещены: оружие, наркотики, реплики люксовых брендов с логотипами (Nike, Gucci и т.д.), опасные химикаты, военные БПЛА. Ноунеймы и аналоги без логотипов — без проблем.",
  },
  {
    q: "Сколько стоит поиск поставщика?",
    a: "От 15 000 ₽ — получите 3-5 проверенных производителей со сравнительной таблицей цен и контактами.",
  },
  {
    q: "Как проводится проверка фабрики?",
    a: "Наш представитель лично выезжает на производство в Китае. Видеоотчёт, сертификаты, оценка мощностей. От 25 000 ₽ за фабрику.",
  },
];

const TOOL_LINKS: Record<string, { label: string; href: string; icon: string }> = {
  "tool:calculator":       { label: "Калькулятор доставки", href: "/delivery-calculator", icon: "🧮" },
  "tool:product-finder":   { label: "AI Поиск товаров",     href: "/product-finder",       icon: "🔍" },
  "tool:supplier-finder":  { label: "AI Поиск поставщиков", href: "/supplier-finder",       icon: "🏭" },
};

const QUICK_QUESTIONS = [
  "Как рассчитать стоимость доставки?",
  "Какая комиссия за выкуп товара?",
  "Как найти надёжного поставщика?",
  "Что нужно для первой поставки?",
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#243a5e]/60 last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-white hover:text-[#00A86B] transition-colors gap-3"
        onClick={() => setOpen(v => !v)}
      >
        <span>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#8899aa] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="text-[#8899aa] text-sm pb-4 leading-relaxed pr-7">{a}</p>
      )}
    </div>
  );
}

export function KnowledgeUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/knowledge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data.answer, suggestions: data.suggestions ?? [] },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data.error ?? "Ошибка. Попробуйте ещё раз." },
        ]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка соединения." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* ── Left: FAQ ── */}
      <div className="lg:col-span-3 space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Частые вопросы</h2>
          <p className="text-[#8899aa] text-xs mb-5">Ответы на самые популярные вопросы об импорте из Китая</p>
          <div>
            {FAQ_ITEMS.map(item => (
              <AccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Quick tool links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🧮", label: "Калькулятор доставки", desc: "Рассчитайте стоимость", href: "/delivery-calculator" },
            { icon: "🔍", label: "Поиск товаров",        desc: "AI находит варианты",  href: "/product-finder" },
            { icon: "🏭", label: "Поиск поставщиков",    desc: "Supplier Score",        href: "/supplier-finder" },
          ].map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="card-glass rounded-xl p-4 hover:border-[#00A86B]/40 border border-transparent transition-all group"
            >
              <div className="text-2xl mb-2">{tool.icon}</div>
              <p className="text-white text-sm font-medium group-hover:text-[#00A86B] transition-colors">{tool.label}</p>
              <p className="text-[#8899aa] text-xs mt-0.5">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Right: AI Chat ── */}
      <div className="lg:col-span-2">
        <div className="card-glass rounded-2xl flex flex-col h-full min-h-[500px]">
          {/* Chat header */}
          <div className="p-5 border-b border-[#243a5e]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AI-консультант</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
                  <p className="text-[#8899aa] text-xs">Онлайн</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[#8899aa] text-sm mb-4">Задайте вопрос об импорте из Китая</p>
                <div className="space-y-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs px-3 py-2 bg-white/5 border border-white/10 hover:border-[#00A86B]/40 text-[#8899aa] hover:text-[#00A86B] rounded-xl transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#00A86B]/20 border border-[#00A86B]/30 text-white"
                      : "bg-[#0B1F3A] border border-[#243a5e] text-[#d0e0f0]"
                  }`}
                >
                  {m.content}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                      {m.suggestions.map(s => {
                        const tool = TOOL_LINKS[s];
                        if (!tool) return null;
                        return (
                          <Link
                            key={s}
                            href={tool.href}
                            className="flex items-center gap-1 px-2 py-1 bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] text-[11px] rounded-lg hover:bg-[#00A86B]/20 transition-colors"
                          >
                            {tool.icon} {tool.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#8899aa] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#243a5e]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Задайте вопрос..."
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 rounded-xl transition-all"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 card-glass rounded-2xl p-5 text-center">
          <p className="text-white font-semibold text-sm mb-1">Нужна личная консультация?</p>
          <p className="text-[#8899aa] text-xs mb-3">Менеджер ответит за 15 минут</p>
          <div className="flex flex-col gap-2">
            <a
              href="https://t.me/chinabridge"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all"
            >
              Написать в Telegram
            </a>
            <Link
              href="/signup"
              className="px-4 py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-white text-sm rounded-xl transition-all hover:bg-white/5"
            >
              Начать 14 дней бесплатно
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
