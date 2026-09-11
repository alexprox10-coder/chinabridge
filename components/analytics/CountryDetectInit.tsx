"use client";
import { useEffect } from "react";
import { resolveCountry, getStoredCountryContext } from "@/lib/utils/country-detect";
import { analytics } from "@/lib/analytics";

// Fires country_detected once per browser session (not per page)
export default function CountryDetectInit() {
  useEffect(() => {
    const SESSION_KEY = "cb_country_fired";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const wasStored = getStoredCountryContext();
    const ctx = resolveCountry();

    // Only fire if this is the first detection (no prior explicit choice)
    if (!wasStored || wasStored.source === "geo") {
      analytics.countryDetected({ country: ctx.country, source: ctx.source });
    }

    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  return null;
}
