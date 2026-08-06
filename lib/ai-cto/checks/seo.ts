import type { CheckResult } from "../types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";

async function checkRobots(): Promise<CheckResult> {
  try {
    const res  = await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    if (!res.ok) return { name: "robots.txt", status: "ERROR", message: `HTTP ${res.status}` };
    if (!text.includes("User-agent")) return { name: "robots.txt", status: "WARNING", message: "No User-agent directive" };
    return { name: "robots.txt", status: "OK", message: "Valid" };
  } catch (e) {
    return { name: "robots.txt", status: "ERROR", message: String(e) };
  }
}

async function checkSitemap(): Promise<CheckResult> {
  try {
    const res  = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    if (!res.ok) return { name: "sitemap.xml", status: "ERROR", message: `HTTP ${res.status}` };
    const urlCount = (text.match(/<url>/g) ?? []).length;
    if (urlCount < 5) return { name: "sitemap.xml", status: "WARNING", message: `Only ${urlCount} URLs` };
    return { name: "sitemap.xml", status: "OK", message: `${urlCount} URLs` };
  } catch (e) {
    return { name: "sitemap.xml", status: "ERROR", message: String(e) };
  }
}

async function checkHomepageMeta(): Promise<CheckResult[]> {
  try {
    const res  = await fetch(BASE, { signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const results: CheckResult[] = [];

    const hasTitle = /<title[^>]*>(.+?)<\/title>/i.test(html);
    results.push({ name: "Homepage <title>", status: hasTitle ? "OK" : "ERROR", message: hasTitle ? "Present" : "Missing" });

    const hasDesc = /name="description"/i.test(html);
    results.push({ name: "Meta description", status: hasDesc ? "OK" : "WARNING", message: hasDesc ? "Present" : "Missing" });

    const hasOg = /property="og:title"/i.test(html);
    results.push({ name: "OG tags",          status: hasOg ? "OK" : "WARNING",  message: hasOg ? "Present" : "Missing" });

    const has404 = html.includes("404") && !html.includes("ChinaBridge");
    results.push({ name: "404 page",         status: "SKIP",  message: "Checked separately" });

    return results;
  } catch (e) {
    return [{ name: "Homepage meta", status: "ERROR", message: String(e) }];
  }
}

async function check404(): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}/this-page-does-not-exist-xyz`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return { name: "404 page", status: "OK", message: "Returns 404" };
    return { name: "404 page", status: "WARNING", message: `Returns ${res.status} instead of 404` };
  } catch (e) {
    return { name: "404 page", status: "ERROR", message: String(e) };
  }
}

export async function checkSeo(): Promise<CheckResult[]> {
  const [robots, sitemap, meta404] = await Promise.all([
    checkRobots(),
    checkSitemap(),
    Promise.all([checkHomepageMeta(), check404()]),
  ]);
  const [metaResults, notFound] = meta404;
  return [robots, sitemap, ...metaResults, notFound];
}
