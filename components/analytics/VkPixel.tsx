"use client";

import Script from "next/script";

const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID;

export function trackVkGoal(goal: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.VK?.Retargeting?.Goal(goal);
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
        w.VK && w.VK.Retargeting && w.VK.Retargeting.Init(VK_PIXEL_ID);
        w.VK && w.VK.Retargeting && w.VK.Retargeting.Hit();
      }}
    />
  );
}
