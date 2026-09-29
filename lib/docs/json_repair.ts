// Inline JSON repair for LLM responses — no external dependencies

export function repairJson(s: string): string {
  // 1. Strip markdown code fences
  let r = s.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // 2. Extract outermost JSON object
  const start = r.indexOf("{");
  const end = r.lastIndexOf("}");
  if (start !== -1 && end > start) r = r.slice(start, end + 1);

  // 3. Remove trailing commas before ] or }
  r = r.replace(/,(\s*[\]}])/g, "$1");

  // 4. Escape unescaped control characters inside strings
  const chars: string[] = [];
  let inStr = false, esc = false;
  for (const ch of r) {
    if (esc) { chars.push(ch); esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; chars.push(ch); continue; }
    if (ch === '"') { inStr = !inStr; chars.push(ch); continue; }
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) {
      chars.push(ch === "\t" ? "\\t" : "\\n");
      continue;
    }
    chars.push(ch);
  }
  r = chars.join("");

  // 5. Close unclosed brackets/braces (handles truncated responses)
  const stack: string[] = [];
  inStr = false; esc = false;
  for (const ch of r) {
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack.length) stack.pop();
  }
  r = r + stack.reverse().join("");

  return r;
}

export function safeParseJson<T>(raw: string, fallback: T): T {
  // Try 1: direct parse of extracted JSON
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return fallback;

  const slice = raw.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Try 2: repair then parse
    try {
      return JSON.parse(repairJson(slice)) as T;
    } catch {
      return fallback;
    }
  }
}
