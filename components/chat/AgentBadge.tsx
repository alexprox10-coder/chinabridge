import { AgentRole } from "@/lib/ai/types";

const CONFIG: Record<AgentRole, { label: string; color: string }> = {
  consultant:    { label: "Консультант",     color: "#00A86B" },
  qualification: { label: "Специалист",      color: "#00A86B" },
  logistic:      { label: "Логист",          color: "#3b82f6" },
  sales:         { label: "Менеджер",        color: "#f59e0b" },
  operator:      { label: "Живой менеджер",  color: "#ef4444" },
};

export default function AgentBadge({ agent }: { agent: AgentRole }) {
  const { label, color } = CONFIG[agent];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}22`, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
