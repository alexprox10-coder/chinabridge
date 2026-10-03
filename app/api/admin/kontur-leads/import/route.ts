import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const maxDuration = 120;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  // Read JSON from filesystem (only works in dev/local Next.js)
  let companies: Record<string, string>[];
  try {
    const jsonPath = join(process.cwd(), "scripts", "kontur_leads.json");
    companies = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch {
    // Try to read from request body as fallback
    try {
      const body = await req.json();
      companies = body.companies;
      if (!Array.isArray(companies)) throw new Error("companies must be array");
    } catch {
      return NextResponse.json({ ok: false, error: "Cannot read JSON file or body" }, { status: 400 });
    }
  }

  let inserted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const c of companies) {
    const inn = (c["ИНН"] || "").trim();
    if (!inn) { skipped++; continue; }

    const revenue = parseInt(c["Выручка"] || "0", 10) || null;
    const employees = parseInt(c["Количество сотрудников"] || "0", 10) || null;

    let score = 20;
    if (revenue) {
      if (revenue > 500_000_000) score += 30;
      else if (revenue > 100_000_000) score += 20;
      else score += 10;
    }
    if (c["Электронная почта"]) score += 15;
    if (c["Ссылка на сайт"]) score += 10;
    if (employees && employees >= 20) score += 10;
    score = Math.min(score, 100);

    const extraJson = JSON.stringify({
      phone: c["Номер телефона"] || null,
      phone2: c["Дополнительный телефон 1"] || null,
      email: c["Электронная почта"] || null,
      email2: c["Дополнительная электронная почта 1"] || null,
      site_url: c["Ссылка на сайт"] || null,
      director: c["ФИО руководителя"] || null,
      director_inn: c["ИННФЛ руководителя"] || null,
      position: c["Должность руководителя"] || null,
      revenue,
      employees,
      ogrn: c["ОГРН"] || null,
      fullName: c["Наименование"] || null,
      okvad_full: c["Основной вид деятельности"] || null,
      okvad_secondary: c["Другие виды деятельности"] || null,
      msp_category: c["Реестр МСП"] || null,
    });

    try {
      const result = await sql`
        INSERT INTO outreach_contacts
          (company_name, inn, okvad, okvad_name, region,
           has_china_keywords, china_keywords_found,
           lead_score, is_internet_seller, status, source)
        VALUES (
          ${c["Наименование"]}, ${inn}, ${"kontur_marketplace"},
          ${extraJson},
          ${c["Регион регистрации"] || null},
          false, '{}', ${score}, true, 'new', 'kontur_compass'
        )
        ON CONFLICT (inn) DO UPDATE SET
          okvad      = 'kontur_marketplace',
          okvad_name = EXCLUDED.okvad_name,
          lead_score = GREATEST(outreach_contacts.lead_score, EXCLUDED.lead_score),
          source     = 'kontur_compass'
        RETURNING (xmax = 0) as is_insert
      `;
      if (result[0]?.is_insert) inserted++; else updated++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${c["Наименование"]}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    inserted,
    updated,
    skipped,
    total: companies.length,
    errors: errors.slice(0, 10),
  });
}
