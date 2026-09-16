"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const KZ_SESSION_KEY = "cb_kz_sessions";

export default function KzSessionTracker() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KZ_SESSION_KEY);
      const count = raw ? parseInt(raw, 10) : 0;
      const next = count + 1;
      localStorage.setItem(KZ_SESSION_KEY, String(next));

      if (next >= 3) {
        analytics.fire("high_intent_visitor", { sessions: next, country: "KZ" });
      }
    } catch {
      // localStorage unavailable — skip silently
    }
  }, []);

  return null;
}
