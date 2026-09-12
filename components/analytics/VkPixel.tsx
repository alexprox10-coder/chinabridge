"use client";

import Script from "next/script";

const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID ?? "3787763";

declare global {
  interface Window {
    _vkGoalQueue?: string[];
  }
}

export function trackVkGoal(goal: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.VK?.Retargeting?.Goal === "function") {
    w.VK.Retargeting.Goal(goal);
  } else {
    // Queue goal until VK script initializes
    if (!window._vkGoalQueue) window._vkGoalQueue = [];
    window._vkGoalQueue.push(goal);
  }
}

export default function VkPixel() {
  if (!VK_PIXEL_ID) return null;

  return (
    <Script
      id="vk-pixel"
      src={`https://vk.com/js/api/openapi.js?169`}
      strategy="afterInteractive"
      onLoad={() => {
        const w = window as any;
        if (w.VK?.Retargeting) {
          w.VK.Retargeting.Init(VK_PIXEL_ID);
          w.VK.Retargeting.Hit();
          // Flush queued goals
          const queue = window._vkGoalQueue ?? [];
          window._vkGoalQueue = [];
          queue.forEach(g => {
            try { w.VK.Retargeting.Goal(g); } catch { /* ignore */ }
          });
        }
      }}
    />
  );
}
