import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

interface EgrulRow {
  n?: string;   // company name
  g?: string;   // ОГРН
  r?: string;   // region
  a?: string;   // address
  e?: string;   // type (ЮЛ/ИП)
  o?: string;   // ОКВЭД main
  runn?: string; // director name
  runp?: string; // director position
  k?: string;   // status
}

async function fetchEgrul(inn: string): Promise<EgrulRow | null> {
  try {
    // Step 1: submit search, get session token
    const r1 = await fetch("https://egrul.nalog.ru/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://egrul.nalog.ru/index.html",
      },
      body: `query=${encodeURIComponent(inn)}&page=&pageSize=&pbuf=`,
      signal: AbortSignal.timeout(8000),
    });
    if (!r1.ok) return null;
    const j1 = await r1.json() as { t?: string };
    const token = j1.t;
    if (!token) return null;

    // Step 2: get search result (sometimes needs a short wait)
    await new Promise(res => setTimeout(res, 600));
    const r2 = await fetch(`https://egrul.nalog.ru/search-result/${token}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://egrul.nalog.ru/index.html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!r2.ok) return null;
    const j2 = await r2.json() as { rows?: EgrulRow[] };
    return j2.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const inn = req.nextUrl.searchParams.get("inn")?.trim();
  if (!inn) return NextResponse.json({ ok: false, error: "inn required" }, { status: 400 });

  const db = neon(process.env.DATABASE_URL!);

  // Fetch DB company data and EGRUL in parallel
  const [dbRows, egrulRow] = await Promise.all([
    db`SELECT name, region, contact_phone, contact_email, website,
              win_count, win_count_365d, total_amount, repeat_winner
       FROM tender_companies WHERE inn = ${inn}`,
    fetchEgrul(inn),
  ]);

  const dbCompany = dbRows[0] as Record<string, unknown> | undefined;

  return NextResponse.json({
    ok: true,
    inn,
    db: dbCompany ?? null,
    egrul: egrulRow
      ? {
          name:     egrulRow.n ?? null,
          ogrn:     egrulRow.g ?? null,
          address:  egrulRow.a ?? null,
          region:   egrulRow.r ?? null,
          director: egrulRow.runn ? `${egrulRow.runp ?? "Директор"}: ${egrulRow.runn}` : null,
          status:   egrulRow.k ?? null,
          okved:    egrulRow.o ?? null,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { inn?: string; phone?: string; email?: string; website?: string };
  const { inn, phone, email, website } = body;
  if (!inn) return NextResponse.json({ ok: false, error: "inn required" }, { status: 400 });

  const db = neon(process.env.DATABASE_URL!);
  await db`
    UPDATE tender_companies
    SET
      contact_phone = ${phone ?? null},
      contact_email = ${email ?? null},
      website       = ${website ?? null},
      updated_at    = NOW()
    WHERE inn = ${inn}`;

  return NextResponse.json({ ok: true });
}
