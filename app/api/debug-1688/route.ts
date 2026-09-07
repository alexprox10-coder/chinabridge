import { NextResponse } from 'next/server';

export const runtime    = 'nodejs';
export const maxDuration = 15;

export async function GET() {
  const offerId = '842366652821';
  const urls = [
    `https://m.1688.com/offer/${offerId}.html`,
    `https://detail.1688.com/offer/${offerId}.html`,
  ];

  const results: Record<string, unknown> = {};

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent':      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer':         'https://m.1688.com/',
        },
        signal: AbortSignal.timeout(8000),
      });
      const html = await res.text();
      const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const priceM = html.match(/["']price["']\s*:\s*["']?([\d.]+)/i);
      results[u] = {
        status:      res.status,
        ok:          res.ok,
        title:       titleM?.[1]?.trim() ?? null,
        price_found: priceM?.[1] ?? null,
        html_len:    html.length,
        html_start:  html.slice(0, 300),
      };
    } catch (e) {
      results[u] = { error: String(e) };
    }
  }

  return NextResponse.json(results);
}
