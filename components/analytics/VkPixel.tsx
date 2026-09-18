"use client";

import Script from "next/script";

const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID ?? "3787763";

declare global {
  interface Window {
    _tmr?: Array<Record<string, unknown>>;
  }
}

export function trackVkGoal(goal: string) {
  if (typeof window === "undefined") return;
  try {
    window._tmr = window._tmr ?? [];
    window._tmr.push({ type: "reachGoal", id: VK_PIXEL_ID, goal });
  } catch {
    // ignore
  }
}

export default function VkPixel() {
  if (!VK_PIXEL_ID) return null;

  const initScript = `var _tmr=window._tmr||(window._tmr=[]);_tmr.push({id:"${VK_PIXEL_ID}",type:"pageView",start:(new Date()).getTime()});`;

  return (
    <>
      <script
        id="vk-pixel-init"
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
      <Script
        id="vk-pixel"
        src="https://top-fwz1.mail.ru/js/code.js"
        strategy="afterInteractive"
      />
    </>
  );
}
