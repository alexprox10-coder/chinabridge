"use client";

import Script from "next/script";

const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID;

export function trackVkGoal(goal: string) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).VK?.Goal(goal);
}

export default function VkPixel() {
  if (!VK_PIXEL_ID) return null;

  return (
    <Script id="vk-pixel" strategy="afterInteractive">
      {`
        !function(){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src='https://vk.com/js/api/openapi.js?169',t.onload=function(){VK.Retargeting.Init("${VK_PIXEL_ID}"),VK.Retargeting.Hit()},document.head.appendChild(t)}();
      `}
    </Script>
  );
}
