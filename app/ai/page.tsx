"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  showHandoffCta?: boolean;
  analysisId?: string | null;
}

const WELCOME = `Здравствуйте! Я ChinaBridge AI — ваш сотрудник по импорту из Китая.

Расскажите что хотите привезти, пришлите ссылку на товар с 1688/Alibaba, или загрузите фото инвойса — я посчитаю полную стоимость, сравню маршруты и подскажу оптимальный вариант.`;

const CAPABILITIES = [
  { icon: "🔎", text: "Проверить товар и поставщика" },
  { icon: "💰", text: "Посчитать полную себестоимость" },
  { icon: "🚚", text: "Сравнить маршруты доставки" },
  { icon: "📋", text: "Определить ТН ВЭД и пошлины" },
  { icon: "📊", text: "Рассчитать маржу и ROI" },
  { icon: "💡", text: "Предложить оптимальный вариант" },
];

function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "cb_ai_anon_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = `anon-${crypto.randomUUID()}`;
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

const mdComponents = {
  h1: (p: React.ComponentProps<"h1">) => <h1 className="text-lg font-bold text-white mt-3 mb-1.5 first:mt-0" {...p} />,
  h2: (p: React.ComponentProps<"h2">) => <h2 className="text-base font-bold text-white mt-3 mb-1.5 first:mt-0" {...p} />,
  h3: (p: React.ComponentProps<"h3">) => <h3 className="text-sm font-bold text-white mt-2.5 mb-1" {...p} />,
  strong: (p: React.ComponentProps<"strong">) => <strong className="font-semibold text-emerald-400" {...p} />,
  hr: () => <hr className="border-[#243a5e] my-3" />,
  ul: (p: React.ComponentProps<"ul">) => <ul className="list-disc pl-5 my-1.5 space-y-0.5" {...p} />,
  ol: (p: React.ComponentProps<"ol">) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5" {...p} />,
  li: (p: React.ComponentProps<"li">) => <li className="text-[#dfe8f5]" {...p} />,
  p: (p: React.ComponentProps<"p">) => <p className="my-1.5 first:mt-0 last:mb-0" {...p} />,
  a: (p: React.ComponentProps<"a">) => <a className="text-sky-400 underline hover:text-sky-300" target="_blank" rel="noopener noreferrer" {...p} />,
  table: (p: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-[#243a5e]">
      <table className="w-full text-xs border-collapse" {...p} />
    </div>
  ),
  thead: (p: React.ComponentProps<"thead">) => <thead className="bg-[#0d2440]" {...p} />,
  th: (p: React.ComponentProps<"th">) => <th className="text-left px-2.5 py-1.5 font-semibold text-[#8899aa] border-b border-[#243a5e]" {...p} />,
  td: (p: React.ComponentProps<"td">) => <td className="px-2.5 py-1.5 border-b border-[#1a3a5c]" {...p} />,
  code: (p: React.ComponentProps<"code">) => <code className="bg-[#0d2440] text-emerald-300 px-1 py-0.5 rounded text-xs" {...p} />,
};

function ExampleDialogPreview({ onTry }: { onTry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
      <p className="text-xs uppercase tracking-wide text-[#5a7899] mb-2 text-center">Пример диалога</p>
      <div className="opacity-80 border border-dashed border-[#243a5e] rounded-2xl p-3 space-y-2 bg-[#08152a]">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm bg-sky-600/60 text-white">
            Хочу привезти 500 электрических сушилок из Гуанчжоу в Алматы. Цена фабрики $8.50. Найди оптимальный вариант.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm bg-[#0B1F3A]/80 border border-[#243a5e] text-[#dfe8f5] leading-relaxed">
            <strong className="text-emerald-400">Провёл расчёт.</strong> Партия: 500 шт · Закупка: $4 250
            <br />
            <br />
            <strong className="text-emerald-400">Вариант A (дешевле):</strong> $12.40/шт · 28 дней · маржа 34%
            <br />
            <strong className="text-emerald-400">Вариант B (быстрее):</strong> $13.10/шт · 20 дней · маржа 30%
            <br />
            <strong className="text-emerald-400">Вариант C (оптимальный):</strong> $12.70/шт · 23 дня · маржа 32%
            <br />
            <br />
            Рекомендую вариант C — баланс срока и маржи. Следующий шаг: проверить поставщика и получить точное КП.
          </div>
        </div>
      </div>
      <button
        onClick={onTry}
        className="w-full mt-3 text-sm text-sky-400 hover:text-sky-300 font-medium text-center transition"
      >
        Попробовать со своим товаром →
      </button>
    </div>
  );
}

function CapabilitiesGrid() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CAPABILITIES.map((c) => (
          <div
            key={c.text}
            className="bg-[#0d1b2a] border border-[#1a3a5c] rounded-xl px-3 py-3 flex flex-col items-center text-center gap-1.5"
          >
            <span className="text-xl">{c.icon}</span>
            <span className="text-xs text-[#c3d2e3] leading-snug">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoffCard({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="bg-emerald-900/15 border border-emerald-700/40 rounded-2xl px-4 py-3.5 text-sm">
      <p className="text-emerald-300 font-medium mb-2">Хотите перейти от расчёта к поставке?</p>
      <ul className="space-y-1 text-[#c3d2e3] mb-3">
        <li>🏭 Проверим фабрику</li>
        <li>💰 Запросим финальную цену</li>
        <li>📦 Организуем выкуп</li>
        <li>🚚 Подберём точный маршрут</li>
        <li>📋 Подготовим документы</li>
      </ul>
      <button
        onClick={onSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
      >
        Передать поставку ChinaBridge →
      </button>
    </div>
  );
}

export default function ChinaBridgeAIPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [telegram, setTelegram] = useState("");
  const [anonymousId, setAnonymousId] = useState("");
  const [statusText, setStatusText] = useState("");
  const [paywall, setPaywall] = useState<{ message: string; price_rub: number } | null>(null);
  const [telegramPrompt, setTelegramPrompt] = useState<{ mode: "save" | "handoff"; analysisId?: string | null } | null>(null);
  const [telegramPromptValue, setTelegramPromptValue] = useState("");
  const [saved, setSaved] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = getAnonymousId();
    setAnonymousId(id);
    try {
      const savedTelegram = window.localStorage.getItem("cb_ai_telegram");
      const savedSession = window.localStorage.getItem("cb_ai_session_id");
      if (savedTelegram) setTelegram(savedTelegram);
      if (savedSession) {
        setSessionId(savedSession);
        fetch(`/api/ai/session?user_telegram=${encodeURIComponent(savedTelegram || id)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.session_id && data.messages?.length) {
              setSessionId(data.session_id);
              setMessages([
                { role: "assistant", content: WELCOME },
                ...data.messages.map((m: { role: string; content: string }) => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                })),
              ]);
            }
          })
          .catch(() => null);
      }
    } catch {
      // localStorage недоступен — работаем без восстановления истории
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function scrollToChat() {
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function sendToApi(payload: Record<string, unknown>) {
    setLoading(true);
    setPaywall(null);
    setStatusText("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, session_id: sessionId, user_telegram: telegram, anonymous_id: anonymousId }),
      });

      if (!res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotFinal = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let evt: Record<string, unknown>;
          try {
            evt = JSON.parse(json);
          } catch {
            continue;
          }

          if (evt.status) {
            setStatusText(String(evt.status));
          } else if (evt.error) {
            setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${evt.error}` }]);
          } else if (evt.response) {
            gotFinal = true;
            const newSessionId = String(evt.session_id);
            setSessionId(newSessionId);
            try {
              window.localStorage.setItem("cb_ai_session_id", newSessionId);
            } catch {
              // ignore
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: String(evt.response),
                showHandoffCta: Boolean(evt.show_handoff_cta),
                analysisId: (evt.analysis_id as string | null) ?? null,
              },
            ]);
            if (evt.paywall) setPaywall(evt.paywall as { message: string; price_rub: number });
          }
        }
      }

      if (!gotFinal) {
        setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Соединение прервалось. Попробуйте ещё раз." }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Ошибка сети: ${String(e)}` }]);
    } finally {
      setStatusText("");
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    await sendToApi({ message: userMessage });
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setMessages((prev) => [...prev, { role: "user", content: `📎 Загружен документ: ${file.name}` }]);
      await sendToApi({
        message: "Посмотри этот документ и посчитай стоимость поставки",
        attachments: [{ type: "image", mime_type: file.type, base64 }],
      });
    };
    reader.readAsDataURL(file);
  }

  async function linkTelegram(value: string) {
    try {
      await fetch("/api/ai/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, anonymous_id: anonymousId, user_telegram: value }),
      });
      window.localStorage.setItem("cb_ai_telegram", value);
    } catch {
      // не удалось привязать — не критично, попробуем в следующий раз
    }
    setTelegram(value);
  }

  async function submitTelegramPrompt() {
    const value = telegramPromptValue.trim();
    if (!value) return;
    const mode = telegramPrompt?.mode;
    const analysisId = telegramPrompt?.analysisId;
    await linkTelegram(value);
    if (mode === "handoff") {
      await fetch("/api/ai/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: analysisId, user_telegram: value }),
      }).catch(() => null);
    }
    setTelegramPrompt(null);
    setTelegramPromptValue("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleHandoff(analysisId: string | null | undefined) {
    if (telegram) {
      await fetch("/api/ai/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: analysisId, user_telegram: telegram }),
      }).catch(() => null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }
    setTelegramPromptValue("");
    setTelegramPrompt({ mode: "handoff", analysisId });
  }

  return (
    <main className="min-h-screen bg-[#060f1e] flex flex-col">
      <a
        href="/ai"
        className="block bg-gradient-to-r from-sky-600 to-sky-500 text-white text-center py-2 px-4 text-xs font-medium"
      >
        🆕 ChinaBridge AI — опишите поставку словами, AI сам посчитает маршрут, таможню и маржу
      </a>

      <div className="border-b border-[#1a3a5c] px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white font-bold">ChinaBridge AI</h1>
          <p className="text-[#8899aa] text-xs mt-0.5 max-w-md">
            Дайте ему ссылку на товар, инвойс или просто опишите задачу. AI сам рассчитает поставку, сравнит маршруты и
            скажет, что делать дальше.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saved && <span className="text-xs text-emerald-400">✓ Сохранено</span>}
          <button
            onClick={() => {
              setTelegramPromptValue(telegram);
              setTelegramPrompt({ mode: "save" });
            }}
            className="text-xs text-[#8899aa] hover:text-white border border-[#243a5e] rounded-lg px-2.5 py-1.5 transition"
          >
            {telegram ? "✓ История сохраняется" : "Сохранить диалог"}
          </button>
        </div>
      </div>

      {messages.length <= 1 && (
        <>
          <ExampleDialogPreview onTry={scrollToChat} />
          <CapabilitiesGrid />
        </>
      )}

      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-sky-600 text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-[#0B1F3A] border border-[#243a5e] text-[#dfe8f5] rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
            {msg.showHandoffCta && (
              <div className="flex justify-start">
                <div className="max-w-[85%] w-full">
                  <HandoffCard onSubmit={() => handleHandoff(msg.analysisId)} />
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              {statusText ? (
                <span className="text-xs text-[#8899aa]">{statusText}</span>
              ) : (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a7899] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a7899] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a7899] animate-bounce" />
                </div>
              )}
            </div>
          </div>
        )}
        {paywall && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-300">
            💳 {paywall.message}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {telegramPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5 max-w-sm w-full">
            <p className="text-white font-semibold mb-1">
              {telegramPrompt.mode === "handoff" ? "Куда написать по поставке?" : "Сохранить диалог"}
            </p>
            <p className="text-[#8899aa] text-xs mb-3">
              {telegramPrompt.mode === "handoff"
                ? "Укажите Telegram — менеджер ChinaBridge свяжется с вами по этой поставке."
                : "Укажите Telegram, чтобы вернуться к этому диалогу с любого устройства."}
            </p>
            <input
              autoFocus
              value={telegramPromptValue}
              onChange={(e) => setTelegramPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTelegramPrompt()}
              placeholder="@username"
              className="w-full bg-[#0d2440] border border-[#243a5e] text-white text-sm rounded-xl px-3.5 py-2.5 mb-3 placeholder-[#5a7899] focus:outline-none focus:border-sky-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTelegramPrompt(null)}
                className="flex-1 text-sm text-[#8899aa] hover:text-white py-2.5 transition"
              >
                Отмена
              </button>
              <button
                onClick={submitTelegramPrompt}
                disabled={!telegramPromptValue.trim()}
                className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-[#1a3a5c] px-4 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-10 h-10 rounded-xl border border-[#243a5e] text-[#8899aa] hover:text-white hover:border-sky-500 transition flex items-center justify-center"
            title="Прикрепить инвойс"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Например: хочу привезти 500 наушников из Гуанчжоу в Алматы"
            rows={1}
            className="flex-1 bg-[#0B1F3A] border border-[#243a5e] text-white text-sm rounded-xl px-4 py-2.5 placeholder-[#5a7899] focus:outline-none focus:border-sky-500 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="shrink-0 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            →
          </button>
        </div>
        <p className="text-center text-[10px] text-[#5a7899] mt-2">3 бесплатных анализа. Затем 490₽ за полный анализ поставки.</p>
      </div>
    </main>
  );
}
