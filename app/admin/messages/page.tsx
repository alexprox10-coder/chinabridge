"use client";
import { useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { ClientMessage } from "@/lib/client-portal/types";

interface ClientThread {
  clientId: string;
  clientName: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<ClientThread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ClientMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadAll() {
    const res = await fetch("/api/admin/client-messages", { cache: "no-store" });
    if (!res.ok) return;
    const all: ClientMessage[] = await res.json();

    // Group by client_id
    const map = new Map<string, ClientMessage[]>();
    for (const m of all) {
      const arr = map.get(m.client_id) ?? [];
      arr.push(m);
      map.set(m.client_id, arr);
    }

    const built: ClientThread[] = [];
    map.forEach((messages, clientId) => {
      const sorted = [...messages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const last = sorted[0];
      const clientMsgs = messages.filter((m) => m.author_role === "CLIENT");
      const name =
        clientMsgs.find((m) => m.author_name)?.author_name ?? clientId;
      built.push({
        clientId,
        clientName: name,
        lastMsg: last.text,
        lastTime: last.created_at,
        unread: messages.filter((m) => m.author_role === "CLIENT" && !m.is_read).length,
      });
    });

    built.sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
    setThreads(built);

    if (selected) {
      const filtered = all
        .filter((m) => m.client_id === selected)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMsgs(filtered);
    }
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/admin/client-messages?client_id=${selected}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ClientMessage[]) =>
        setMsgs(
          [...data].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        )
      );
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    try {
      await fetch("/api/admin/client-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, client_id: selected }),
      });
      setText("");
      await loadAll();
    } finally {
      setSending(false);
    }
  }

  const selectedThread = threads.find((t) => t.clientId === selected);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <div className="flex h-screen pt-0 lg:pt-0">
          {/* Thread list */}
          <div className="w-72 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800">
              <h1 className="text-white font-bold text-base">Сообщения клиентов</h1>
              <p className="text-slate-500 text-xs mt-0.5">{threads.length} диалогов</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-slate-600 text-sm">Нет сообщений</p>
                </div>
              )}
              {threads.map((t) => (
                <button
                  key={t.clientId}
                  onClick={() => setSelected(t.clientId)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition ${
                    selected === t.clientId ? "bg-slate-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-sm font-medium truncate">{t.clientName}</span>
                    {t.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-2 shrink-0">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs truncate">{t.lastMsg}</p>
                  <p className="text-slate-700 text-xs mt-0.5">
                    {new Date(t.lastTime).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-slate-500 text-sm">Выберите диалог</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900">
                  <p className="text-white font-semibold">{selectedThread?.clientName}</p>
                  <p className="text-slate-500 text-xs">{selected}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {msgs.map((msg) => {
                    const isManager = msg.author_role === "MANAGER";
                    return (
                      <div key={msg.id} className={`flex ${isManager ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] flex flex-col ${isManager ? "items-end" : "items-start"}`}>
                          {!isManager && (
                            <p className="text-xs text-slate-500 mb-1 px-1">{msg.author_name}</p>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm ${
                              isManager
                                ? "bg-red-600 text-white rounded-br-sm"
                                : "bg-slate-800 text-slate-100 rounded-bl-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="border-t border-slate-800 p-4 flex gap-3 bg-slate-900">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ответить клиенту..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {sending ? "..." : "→"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
