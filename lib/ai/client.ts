interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function getLLMConfig() {
  return {
    baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey:  process.env.OPENROUTER_API_KEY ?? "",
    model:   process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  };
}

export async function callLLM(
  systemPrompt: string,
  history: LLMMessage[],
): Promise<string> {
  const { baseURL, apiKey, model } = getLLMConfig();

  if (!apiKey) {
    return "Агент временно недоступен. Напишите нам: @chinabridge";
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge AI Sales Agent",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 600,
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  // Strip markdown code fences that some models wrap around JSON output
  return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}
