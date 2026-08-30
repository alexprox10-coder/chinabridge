import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

// ─── nalog.ru EGRUL ────────────────────────────────────────────────────────

interface EgrulRaw {
  n?: string; g?: string; r?: string; a?: string;
  runn?: string; runp?: string; k?: string; o?: string;
  phone?: string; email?: string; site?: string;
}

async function fetchEgrul(inn: string): Promise<EgrulRaw | null> {
  try {
    const r1 = await fetch("https://egrul.nalog.ru/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://egrul.nalog.ru/index.html",
      },
      body: `query=${encodeURIComponent(inn)}&page=&pageSize=&pbuf=`,
      signal: AbortSignal.timeout(8000),
    });
    if (!r1.ok) return null;
    const j1 = await r1.json() as { t?: string };
    if (!j1.t) return null;

    await new Promise(r => setTimeout(r, 700));
    const r2 = await fetch(`https://egrul.nalog.ru/search-result/${j1.t}`, {
      headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", "Referer": "https://egrul.nalog.ru/index.html" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r2.ok) return null;
    const j2 = await r2.json() as { rows?: EgrulRaw[] };
    return j2.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── rusprofile.ru scraper ─────────────────────────────────────────────────

interface ContactInfo {
  phone:   string | null;
  email:   string | null;
  website: string | null;
}

function extractText(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

async function fetchRusprofile(inn: string): Promise<ContactInfo & { companyUrl: string | null }> {
  const empty = { phone: null, email: null, website: null, companyUrl: null };
  try {
    // Step 1: search page
    const sResp = await fetch(
      `https://www.rusprofile.ru/search?query=${encodeURIComponent(inn)}&type=ul`,
      {
        headers: { "User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9", "Accept": "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!sResp.ok) return empty;
    const sHtml = await sResp.text();

    // Extract first company link like /id/12345678
    const linkMatch = sHtml.match(/href="(\/id\/\d+)"/);
    if (!linkMatch) return empty;
    const companyPath = linkMatch[1];

    // Step 2: company page
    const cResp = await fetch(`https://www.rusprofile.ru${companyPath}`, {
      headers: { "User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9", "Accept": "text/html,application/xhtml+xml", "Referer": "https://www.rusprofile.ru" },
      signal: AbortSignal.timeout(10000),
    });
    if (!cResp.ok) return { ...empty, companyUrl: `https://www.rusprofile.ru${companyPath}` };
    const cHtml = await cResp.text();

    // Parse phone (tel: links)
    const phonRaw = extractText(cHtml, /href="tel:([^"]+)"/);
    const phone = phonRaw ? phonRaw.replace(/[^\d+]/g, "").replace(/^(\d{11})$/, "+$1") : null;

    // Parse email (mailto: links)
    const email = extractText(cHtml, /href="mailto:([^"]+)"/);

    // Parse website — look for external link in contacts section
    const websiteRaw = extractText(cHtml, /class="[^"]*company-site[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"/);
    const website = websiteRaw ??
      extractText(cHtml, /(?:Сайт|Веб-сайт)[^"]*<\/[^>]+>\s*<[^>]+href="(https?:\/\/[^"]+)"/);

    return {
      phone:   phone   || null,
      email:   email   || null,
      website: website || null,
      companyUrl: `https://www.rusprofile.ru${companyPath}`,
    };
  } catch {
    return empty;
  }
}

// ─── 2GIS fallback ─────────────────────────────────────────────────────────

async function fetch2gis(name: string, region: string | null): Promise<ContactInfo> {
  const empty = { phone: null, email: null, website: null };
  try {
    const q = encodeURIComponent(`${name} ${region ?? ""}`.trim());
    const resp = await fetch(
      `https://catalog.api.2gis.com/2.0/catalog/branch/search?q=${q}&type=branch&page_size=1&key=demo`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!resp.ok) return empty;
    const json = await resp.json() as { result?: { items?: Array<{ contact_groups?: Array<{ contacts?: Array<{ type: string; value: string }> }> }> } };
    const contacts = json.result?.items?.[0]?.contact_groups?.flatMap(g => g.contacts ?? []) ?? [];
    const phone   = contacts.find(c => c.type === "phone")?.value ?? null;
    const email   = contacts.find(c => c.type === "email")?.value ?? null;
    const website = contacts.find(c => c.type === "website")?.value ?? null;
    return { phone, email, website };
  } catch {
    return empty;
  }
}

// ─── GET ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const inn = req.nextUrl.searchParams.get("inn")?.trim();
  if (!inn) return NextResponse.json({ ok: false, error: "inn required" }, { status: 400 });

  const db = neon(process.env.DATABASE_URL!);

  // Run all fetches in parallel
  const [dbRows, egrulRow, rusprofileData] = await Promise.all([
    db`SELECT name, region, contact_phone, contact_email, website,
              win_count, win_count_365d, total_amount, repeat_winner
       FROM tender_companies WHERE inn = ${inn}`,
    fetchEgrul(inn),
    fetchRusprofile(inn),
  ]);

  const dbCo = dbRows[0] as Record<string, unknown> | undefined;

  // Merge: prefer rusprofile/egrul over DB if DB is empty
  let phone   = (dbCo?.contact_phone   as string | null) || rusprofileData.phone;
  let email   = (dbCo?.contact_email   as string | null) || rusprofileData.email;
  let website = (dbCo?.website         as string | null) || rusprofileData.website;

  // Also check EGRUL for phone/email/site (sometimes companies provide these)
  if (!phone   && egrulRow?.phone) phone   = egrulRow.phone;
  if (!email   && egrulRow?.email) email   = egrulRow.email;
  if (!website && egrulRow?.site)  website = egrulRow.site;

  // Auto-save if we found contacts and DB was empty
  if ((phone || email || website) && !dbCo?.contact_phone && !dbCo?.contact_email && !dbCo?.website) {
    try {
      await db`
        UPDATE tender_companies
        SET contact_phone = ${phone ?? null},
            contact_email = ${email ?? null},
            website       = ${website ?? null},
            updated_at    = NOW()
        WHERE inn = ${inn}`;
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    ok: true,
    inn,
    contacts: { phone, email, website },
    rusprofile_url: rusprofileData.companyUrl,
    egrul: egrulRow ? {
      name:     egrulRow.n   ?? null,
      ogrn:     egrulRow.g   ?? null,
      address:  egrulRow.a   ?? null,
      region:   egrulRow.r   ?? null,
      director: egrulRow.runn ? `${egrulRow.runp ?? "Директор"}: ${egrulRow.runn}` : null,
      status:   egrulRow.k   ?? null,
    } : null,
    db: dbCo ?? null,
  });
}

// ─── PATCH — manual save ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { inn?: string; phone?: string; email?: string; website?: string };
  const { inn, phone, email, website } = body;
  if (!inn) return NextResponse.json({ ok: false, error: "inn required" }, { status: 400 });

  const db = neon(process.env.DATABASE_URL!);
  await db`
    UPDATE tender_companies
    SET contact_phone = ${phone ?? null},
        contact_email = ${email ?? null},
        website       = ${website ?? null},
        updated_at    = NOW()
    WHERE inn = ${inn}`;

  return NextResponse.json({ ok: true });
}
