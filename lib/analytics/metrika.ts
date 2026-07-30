declare global {
  interface Window {
    ym: (id: number, method: string, ...args: unknown[]) => void;
  }
}

export const METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
  ? Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
  : null;

export function reachGoal(goalName: string, params?: Record<string, unknown>) {
  if (!METRIKA_ID || typeof window === "undefined" || !window.ym) return;
  window.ym(METRIKA_ID, "reachGoal", goalName, params);
}

export function trackMetrikaPageView(url: string) {
  if (!METRIKA_ID || typeof window === "undefined" || !window.ym) return;
  window.ym(METRIKA_ID, "hit", url);
}
