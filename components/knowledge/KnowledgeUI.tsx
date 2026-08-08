"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Send, BookOpen, MessageCircle, Clock, Tag, ChevronRight, Search } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface ArticleSummary {
  id: string;
  category: string;
  categorySlug: string;
  title: string;
  description: string;
  tags: string[];
  readTime: number;
}

interface ArticleFull extends ArticleSummary {
  body: string;
}

interface Category {
  slug: string;
  label: string;
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
  "tool:calculator":      { label: "Калькулятор доставки", href: "/delivery-calculator", icon: "🧮" },
  "tool:product-finder":  { label: "AI Поиск товаров",     href: "/product-finder",       icon: "🔍" },
  "tool:supplier-finder": { label: "AI Поиск поставщиков", href: "/supplier-finder",       icon: "🏭" },
};

const QUICK_QUESTIONS = [
  "Как рассчитать стоимость доставки?",
  "Какая комиссия за выкуп товара?",
  "Как найти надёжного поставщика?",
  "Что нужно для первой поставки?",
];

const CATEGORY_COLORS: Record<string, string> = {
  suppliers:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  logistics:    "bg-purple-500/20 text-purple-300 border-purple-500/30",
  customs:      "bg-orange-500/20 text-orange-300 border-orange-500/30",
  marketplaces: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  finance:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

// ─── AccordionItem ────────────────────────────────────────────────────────────

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

// ─── ArticleCard ──────────────────────────────────────────────────────────────

function ArticleCard({
  article,
  onClick,
}: {
  article: ArticleSummary;
  onClick: (id: string) => void;
}) {
  const colorClass = CATEGORY_COLORS[article.categorySlug] ?? "bg-white/10 text-white/60 border-white/20";
  return (
    <button
      onClick={() => onClick(article.id)}
      className="w-full text-left card-glass rounded-xl p-5 hover:border-[#00A86B]/40 border border-transparent transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
          {article.category}
        </span>
        <span className="flex items-center gap-1 text-[#8899aa] text-[11px] shrink-0">
          <Clock className="w-3 h-3" />
          {article.readTime} мин
        </span>
      </div>
      <h3 className="text-white text-sm font-semibold mb-2 group-hover:text-[#00A86B] transition-colors leading-snug">
        {article.title}
      </h3>
      <p className="text-[#8899aa] text-xs leading-relaxed line-clamp-2">{article.description}</p>
      <div className="flex items-center gap-1 mt-3 text-[#00A86B] text-xs">
        <span>Читать</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}

// ─── ArticleModal ─────────────────────────────────────────────────────────────

function ArticleModal({
  article,
  onClose,
}: {
  article: ArticleFull;
  onClose: () => void;
}) {
  const colorClass = CATEGORY_COLORS[article.categorySlug] ?? "bg-white/10 text-white/60 border-white/20";

  // Render body with markdown-like bold and newlines
  const renderBody = (text: string) => {
    return text.split("\n\n").map((para, i) => {
      const parts = para.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="mb-4 text-[#c0d4e8] text-sm leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="text-white font-semibold">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {article.category}
          </span>
          <button
            onClick={onClose}
            className="text-[#8899aa] hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <h2 className="text-white text-xl font-bold mb-2 leading-snug">{article.title}</h2>
        <p className="text-[#00A86B] text-sm mb-5">{article.description}</p>
        <div className="border-t border-[#243a5e] pt-5">{renderBody(article.body)}</div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#243a5e]">
          {article.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] text-[#8899aa] bg-white/5 px-2 py-0.5 rounded-full"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ArticlesTab ──────────────────────────────────────────────────────────────

function ArticlesTab() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openArticle, setOpenArticle] = useState<ArticleFull | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [activeCategory, search]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("q", search);
      const res = await fetch(`/api/knowledge/articles?${params}`);
      const data = await res.json();
      if (data.ok) {
        setArticles(data.articles);
        if (data.categories) setCategories(data.categories);
      }
    } finally {
      setLoading(false);
    }
  };

  const openArticleById = async (id: string) => {
    setArticleLoading(true);
    try {
      const res = await fetch(`/api/knowledge/articles/${id}`);
      const data = await res.json();
      if (data.ok) setOpenArticle(data.article);
    } finally {
      setArticleLoading(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8899aa]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по статьям..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeCategory === "all"
              ? "bg-[#00A86B] text-white"
              : "bg-white/5 text-[#8899aa] hover:text-white hover:bg-white/10"
          }`}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat.slug
                ? "bg-[#00A86B] text-white"
                : "bg-white/5 text-[#8899aa] hover:text-white hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-glass rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-white/10 rounded mb-3 w-1/3" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-[#8899aa]">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Статьи не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} onClick={openArticleById} />
          ))}
        </div>
      )}

      {articleLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-white text-sm">Загрузка...</div>
        </div>
      )}

      {openArticle && (
        <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
      )}
    </div>
  );
}

// ─── Main KnowledgeUI ─────────────────────────────────────────────────────────

export function KnowledgeUI() {
  const [activeTab, setActiveTab] = useState<"faq" | "articles">("faq");
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
      {/* ── Left: FAQ + Articles ── */}
      <div className="lg:col-span-3 space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "faq"
                ? "bg-[#00A86B] text-white"
                : "text-[#8899aa] hover:text-white"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Частые вопросы
          </button>
          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "articles"
                ? "bg-[#00A86B] text-white"
                : "text-[#8899aa] hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Статьи
            <span className="ml-1 text-[10px] bg-[#00A86B]/30 text-[#00A86B] px-1.5 py-0.5 rounded-full">15</span>
          </button>
        </div>

        {/* FAQ tab */}
        {activeTab === "faq" && (
          <>
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
          </>
        )}

        {/* Articles tab */}
        {activeTab === "articles" && (
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">База знаний</h2>
            <p className="text-[#8899aa] text-xs mb-5">
              15 подробных статей по поиску поставщиков, логистике, таможне, маркетплейсам и финансам
            </p>
            <ArticlesTab />
          </div>
        )}
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
