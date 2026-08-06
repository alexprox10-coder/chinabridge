import type { CheckResult } from "../types";

const OPENROUTER_BASE  = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_KEY   = process.env.OPENROUTER_API_KEY  ?? "";

interface ModelSpec {
  id:    string;
  label: string;
  model: string;
}

const MODELS: ModelSpec[] = [
  { id: "gemini-flash",   label: "Gemini 2.5 Flash",  model: "google/gemini-2.5-flash" },
  { id: "claude-haiku",   label: "Claude Haiku 4.5",  model: "anthropic/claude-haiku-4-5" },
  { id: "deepseek-chat",  label: "DeepSeek Chat",     model: "deepseek/deepseek-chat" },
  { id: "gpt-4o-mini",    label: "GPT-4o Mini",       model: "openai/gpt-4o-mini" },
  { id: "qwen-plus",      label: "Qwen Plus",         model: "qwen/qwen-plus" },
];

async function testModel(spec: ModelSpec): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: spec.model,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const ms   = Date.now() - t0;
    const json = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const msg = (json.error as Record<string, unknown>)?.message ?? `HTTP ${res.status}`;
      return { name: spec.label, status: "WARNING", message: String(msg), ms };
    }

    const choices = (json.choices as Array<{ message?: { content?: string } }>);
    const text    = choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { name: spec.label, status: "WARNING", message: "Empty response", ms };

    return { name: spec.label, status: "OK", message: `${ms}ms — "${text}"`, ms };
  } catch (e) {
    return { name: spec.label, status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkOpenRouterKey(): Promise<CheckResult> {
  if (!OPENROUTER_KEY) return { name: "OpenRouter API key", status: "ERROR", message: "Not set" };
  return { name: "OpenRouter API key", status: "OK", message: `Set (${OPENROUTER_KEY.slice(0, 10)}...)` };
}

export async function checkAiProviders(): Promise<CheckResult[]> {
  const keyCheck = await checkOpenRouterKey();
  if (keyCheck.status === "ERROR") return [keyCheck];

  const modelResults = await Promise.allSettled(MODELS.map(testModel));
  const checked = modelResults.map((r, i) =>
    r.status === "fulfilled" ? r.value : { name: MODELS[i].label, status: "ERROR" as const, message: String(r.reason) }
  );
  return [keyCheck, ...checked];
}
