declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function trackGAEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("event", name, params);
    return;
  }
  // gtag not yet loaded — poll until ready (max 5s)
  let attempts = 0;
  const iv = setInterval(() => {
    if (window.gtag) {
      window.gtag("event", name, params);
      clearInterval(iv);
    } else if (++attempts >= 50) {
      clearInterval(iv);
    }
  }, 100);
}

export function trackGAPageView(url: string) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_ID, { page_path: url });
}
