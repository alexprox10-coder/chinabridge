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
  } else {
    // gtag not yet loaded (fires before afterInteractive scripts) — retry after load
    const fire = () => { if (window.gtag) window.gtag("event", name, params); };
    window.addEventListener("load", fire, { once: true });
  }
}

export function trackGAPageView(url: string) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_ID, { page_path: url });
}
