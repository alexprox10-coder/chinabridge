"use client";

export type Country = "KZ" | "RU" | "OTHER";
export type CountrySource = "user" | "landing" | "campaign" | "geo" | "unknown";

export interface CountryContext {
  country: Country;
  source: CountrySource;
  city?: string;
  currency: "KZT" | "RUB" | "USD";
}

const STORAGE_KEY = "cb_country_ctx";

// Detect country from browser timezone
function detectFromTimezone(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Asia/Almaty") || tz.startsWith("Asia/Aqtau") ||
        tz.startsWith("Asia/Aqtobe") || tz.startsWith("Asia/Atyrau") ||
        tz.startsWith("Asia/Oral") || tz.startsWith("Asia/Qyzylorda") ||
        tz.startsWith("Asia/Qostanay")) {
      return "KZ";
    }
    if (tz.startsWith("Europe/Moscow") || tz.startsWith("Europe/Samara") ||
        tz.startsWith("Europe/Volgograd") || tz.startsWith("Asia/Yekaterinburg") ||
        tz.startsWith("Asia/Novosibirsk") || tz.startsWith("Asia/Omsk") ||
        tz.startsWith("Asia/Krasnoyarsk") || tz.startsWith("Asia/Irkutsk") ||
        tz.startsWith("Asia/Vladivostok") || tz.startsWith("Asia/Sakhalin") ||
        tz.startsWith("Asia/Kamchatka") || tz.startsWith("Europe/Kaliningrad") ||
        tz.startsWith("Europe/Saratov") || tz.startsWith("Europe/Ulyanovsk") ||
        tz.startsWith("Europe/Kirov") || tz.startsWith("Europe/Astrakhan")) {
      return "RU";
    }
  } catch { /* ignore */ }
  return "OTHER";
}

// Get stored context (user/landing/campaign explicit choice)
export function getStoredCountryContext(): CountryContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CountryContext;
  } catch {
    return null;
  }
}

// Set explicit context (from landing page or user choice)
export function setCountryContext(ctx: CountryContext) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch { /* ignore */ }
}

// Resolve country — user/landing > campaign > geo
export function resolveCountry(): CountryContext {
  const stored = getStoredCountryContext();
  if (stored && (stored.source === "user" || stored.source === "landing")) {
    return stored;
  }

  // Check UTM campaign
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const campaign = params.get("utm_campaign") ?? "";
    const landing = params.get("landing") ?? "";
    if (campaign.includes("kz") || landing.includes("kz")) {
      const ctx: CountryContext = { country: "KZ", source: "campaign", currency: "KZT" };
      setCountryContext(ctx);
      return ctx;
    }
    if (campaign.includes("ru") || landing.includes("ru")) {
      const ctx: CountryContext = { country: "RU", source: "campaign", currency: "RUB" };
      setCountryContext(ctx);
      return ctx;
    }
  }

  // Campaign stored context (lower priority than user/landing)
  if (stored?.source === "campaign") return stored;

  // Fallback: geo from timezone
  const geo = detectFromTimezone();
  return {
    country: geo,
    source: "geo",
    currency: geo === "KZ" ? "KZT" : "RUB",
  };
}

// Convenience — just the country string or "RU" as default
export function getCountry(): Country {
  if (typeof window === "undefined") return "RU";
  return resolveCountry().country;
}
