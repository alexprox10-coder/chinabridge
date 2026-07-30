declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function trackGAEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

export function trackGAPageView(url: string) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_ID, { page_path: url });
}
