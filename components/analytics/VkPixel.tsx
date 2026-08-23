"use client";

import Script from "next/script";

const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID;

export function trackVkGoal(goal: string) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w._tmr = w._tmr || [];
  w._tmr.push({ type: 'reachGoal', id: VK_PIXEL_ID, goal });
}

export default function VkPixel() {
  if (!VK_PIXEL_ID) return null;

  return (
    <Script id="vk-pixel" strategy="afterInteractive">
      {`
        var _tmr = window._tmr || (window._tmr = []);
        _tmr.push({id: "${VK_PIXEL_ID}", type: "pageView", start: (new Date()).getTime()});
        (function(d,w,id){
          if(d.getElementById(id)) return;
          var ts=d.createElement("script");ts.type="text/javascript";ts.async=true;ts.id=id;
          ts.src="https://top-fwz1.mail.ru/js/code.js";
          var f=function(){var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(ts,s);};
          if(w.opera=="[object Opera]"){d.addEventListener("DOMContentLoaded",f,false);}else{f();}
        })(document,window,"tmr-code");
      `}
    </Script>
  );
}
