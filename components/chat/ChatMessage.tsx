import { AgentRole } from "@/lib/ai/types";
import AgentBadge from "./AgentBadge";

interface Props {
  role: "user" | "assistant";
  content: string;
  agent?: AgentRole;
}

export default function ChatMessage({ role, content, agent }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
          isUser ? "bg-[#243a5e] text-[#8899aa]" : "bg-[#00A86B] text-white"
        }`}
      >
        {isUser ? "Вы" : "CB"}
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && agent && <AgentBadge agent={agent} />}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#00A86B] text-white rounded-tr-sm"
              : "bg-[#0f2644] border border-[#243a5e] text-white rounded-tl-sm"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
