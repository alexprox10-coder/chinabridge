"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    ref.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[#243a5e]">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Напишите сообщение..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-[#0B1F3A] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#8899aa] outline-none transition-colors max-h-28 overflow-y-auto disabled:opacity-50"
        style={{ lineHeight: "1.4" }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 flex items-center justify-center transition-colors"
      >
        <Send className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}
