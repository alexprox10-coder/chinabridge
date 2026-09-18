// Server-side calculator funnel tracker — fires fire-and-forget POST per step.
// anonymous_id: persisted in localStorage, survives sessions.
// session_id: created once per calculator open (calc_open_<timestamp>).

export type CalcStep =
  | "calculator_view"
  | "calculator_start"
  | "input_started"
  | "product_parsed"
  | "fields_completed"
  | "calculation_started"
  | "calculation_success"
  | "result_view"
  | "delivery_request";

function getOrCreateAnonymousId(): string {
  try {
    const key = "cb_anon_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_mem_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function getSessionId(): string {
  try {
    const key = "cb_calc_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `sess_mem_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function getSource(): { source: string; campaign: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source:   params.get("utm_source")   ?? params.get("source")   ?? "",
      campaign: params.get("utm_campaign") ?? params.get("campaign") ?? "",
    };
  } catch {
    return { source: "", campaign: "" };
  }
}

function getDevice(): string {
  try {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return "mobile";
    if (/Tablet|iPad/i.test(ua)) return "tablet";
    return "desktop";
  } catch {
    return "unknown";
  }
}

export function trackCalcStep(
  step: CalcStep,
  meta?: { country?: string; calculator_mode?: string },
): void {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;
  try {
    const { source, campaign } = getSource();
    const payload = {
      step,
      anonymous_id:    getOrCreateAnonymousId(),
      session_id:      getSessionId(),
      source,
      campaign,
      country:         meta?.country        ?? "",
      calculator_mode: meta?.calculator_mode ?? "",
      device:          getDevice(),
    };
    fetch("/api/track/calc-step", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }).catch(() => null);
  } catch {
    // never throw from analytics
  }
}

// Reset session_id on new calculator open (so each calc = separate session)
export function resetCalcSession(): void {
  try {
    sessionStorage.removeItem("cb_calc_session");
  } catch {
    // ignore
  }
}
