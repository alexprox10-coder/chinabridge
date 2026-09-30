"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = `Здравствуйте! Я ChinaBridge AI — ваш сотрудник по импорту из Китая.

Расскажите что хотите привезти, пришлите ссылку на товар с 1688/Alibaba, или загрузите фото инвойса — я посчитаю полную стоимость, сравню маршруты и подскажу оптимальный вариант.`;

export default function ChinaBridgeAIPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [telegram, setTelegram] = useState("");
  const [gateOpen, setGateOpen] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [paywall, setPaywall] = useState<{ message: string; price_rub: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startDialog() {
    if (!telegram.trim()) {
      setGateOpen(false);
      return;
    }
    setRestoring(true);
    try {
      const res = await fetch(`/api/ai/session?user_telegram=${encodeURIComponent(telegram.trim())}`);
      const data = await res.json();
      if (data.session_id && data.messages?.length) {
        setSessionId(data.session_id);
        setMessages([
          { role: "assistant", content: WELCOME },
          ...data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ]);
      }
    } catch {
      // не удалось восстановить — начинаем с чистого листа
    }
    setRestoring(false);
    setGateOpen(false);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendToApi(payload: Record<string, unknown>) {
    setLoading(true);
    setPaywall(null);
    setStatusText("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, session_id: sessionId, user_telegram: telegram }),
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
            setSessionId(String(evt.session_id));
            setMessages((prev) => [...prev, { role: "assistant", content: String(evt.response) }]);
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

  if (gateOpen) {
    return (
      <main className="min-h-screen bg-[#060f1e] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-block bg-sky-900/20 border border-sky-800/40 rounded-full px-4 py-1.5 text-xs text-sky-400 mb-6">
            🆕 ChinaBridge AI
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">ChinaBridge AI</h1>
          <p className="text-[#8899aa] mb-8">Ваш AI-сотрудник по импорту из Китая — считает, проверяет и предлагает варианты поставки.</p>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="Ваш Telegram (для сохранения истории)"
            className="w-full bg-[#0B1F3A] border border-[#243a5e] text-white text-sm rounded-xl px-4 py-3 mb-4 placeholder-[#5a7899] focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={startDialog}
            disabled={restoring}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-3 transition"
          >
            {restoring ? "⏳ Загружаю историю..." : "Начать диалог →"}
          </button>
          <p className="text-xs text-[#5a7899] mt-4">3 бесплатных анализа. Затем 490₽ за полный анализ поставки.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060f1e] flex flex-col">
      <div className="border-b border-[#1a3a5c] px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-white font-bold">ChinaBridge AI</h1>
        <span className="text-xs text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Онлайн
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-600 text-white rounded-br-sm"
                  : "bg-[#0B1F3A] border border-[#243a5e] text-[#dfe8f5] rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
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
      </div>
    </main>
  );
}
