"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { ClientMessage } from "@/lib/client-portal/types";

function MessagesView() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? undefined;

  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const url = `/api/client/messages${orderId ? `?order_id=${orderId}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, order_id: orderId }),
      });
      if (!res.ok) {
        setSendError("Не удалось отправить сообщение. Попробуйте ещё раз.");
        return;
      }
      setText("");
      await load();
    } catch {
      setSendError("Ошибка сети. Проверьте соединение.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Сообщения</h1>
        {orderId && (
          <p className="text-sm text-slate-400 mt-1">Заявка #{orderId}</p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-sm">Загрузка...</p>
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-slate-500 text-sm">Сообщений пока нет</p>
              <p className="text-slate-400 text-xs mt-1">Напишите менеджеру — ответим в рабочее время</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {sendError && (
          <div className="px-4 pb-2">
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{sendError}</p>
          </div>
        )}
        <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            {sending ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ClientMessage }) {
  const isClient = msg.author_role === "CLIENT";
  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isClient ? "items-end" : "items-start"} flex flex-col`}>
        {!isClient && (
          <p className="text-xs text-slate-400 mb-1 px-1">{msg.author_name}</p>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          isClient
            ? "bg-green-600 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}>
          {msg.text}
        </div>
        <p className="text-xs text-slate-400 mt-1 px-1">
          {new Date(msg.created_at).toLocaleString("ru-RU", {
            hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
          })}
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesView />
    </Suspense>
  );
}
