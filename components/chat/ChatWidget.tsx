"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-[340px] h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-[#243a5e] animate-in slide-in-from-bottom-4 duration-200">
          <ChatWindow onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
        className="w-14 h-14 rounded-full bg-[#00A86B] hover:bg-[#008f59] shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Pulse ring when closed */}
      {!open && (
        <span className="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-[#00A86B] opacity-30 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
