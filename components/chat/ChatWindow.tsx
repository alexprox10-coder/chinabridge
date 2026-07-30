"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import AgentBadge from "./AgentBadge";
import { AgentRole, ChatApiResponse } from "@/lib/ai/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: AgentRole;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Привет! Я консультант ChinaBridge. Помогаю с закупками и доставкой товаров из Китая в Казахстан и Россию.\n\nЧем могу помочь?",
  agent: "consultant",
};

interface Props {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentAgent, setCurrentAgent] = useState<AgentRole>("consultant");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Generate session ID once
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ChatApiResponse = await res.json();
      setCurrentAgent(data.agent);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, agent: data.agent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка. Напишите нам напрямую: @chinabridge",
          agent: currentAgent,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#060f1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0B1F3A] border-b border-[#243a5e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">
            CB
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">ChinaBridge</div>
            <AgentBadge agent={currentAgent} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#8899aa]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} agent={m.agent} />
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[#00A86B] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              CB
            </div>
            <div className="bg-[#0f2644] border border-[#243a5e] rounded-2xl rounded-tl-sm px-3 py-2">
              <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={loading} />
    </div>
  );
}
