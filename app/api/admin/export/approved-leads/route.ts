import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllLeads } from "@/lib/import-leads/crm";
import { getMILeads } from "@/lib/market-intelligence/db";

export const dynamic     = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const store   = await cookies();
  const isAdmin = store.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tenantId = store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
  const fmt      = req.nextUrl.searchParams.get("format") ?? "json";

  // 1. Import leads with status "approved"
  const allImport = await getAllLeads().catch(() => []);
  const approvedImport = allImport.filter(l => l.status === "approved");

  // 2. MI leads with pipeline "CLIENT"
  const clientMI = await getMILeads(tenantId, { pipeline: "CLIENT" }).catch(() => []);

  interface ContactRow {
    source: string;
    company: string;
    phone: string;
    email: string;
    telegram: string;
    website: string;
    city: string;
    score: number | string;
    temperature: string;
    why: string;
    offer: string;
  }

  const rows: ContactRow[] = [
    ...approvedImport.map(l => ({
      source:      "Импорт",
      company:     l.company ?? "",
      phone:       l.phone   ?? "",
      email:       l.email   ?? "",
      telegram:    l.telegram ?? "",
      website:     l.website  ?? "",
      city:        l.city     ?? "",
      score:       l.score    ?? "",
      temperature: l.score != null ? (l.score >= 4 ? "HOT" : l.score >= 2 ? "WARM" : "COLD") : "",
      why:         l.why      ?? "",
      offer:       l.offer    ?? "",
    })),
    ...clientMI.map(l => ({
      source:      "Lead Finder",
      company:     l.company     ?? "",
      phone:       l.phone       ?? "",
      email:       l.email       ?? "",
      telegram:    l.telegram    ?? "",
      website:     l.website     ?? "",
      city:        l.city        ?? "",
      score:       l.score       ?? "",
      temperature: l.temperature ?? "",
      why:         l.scoreReason ?? "",
      offer:       l.nextAction  ?? "",
    })),
  ];

  if (fmt === "csv") {
    const header = "Источник,Компания,Телефон,Email,Telegram,Сайт,Город,Score,Температура,Почему интересны,Что предложить";
    const csvRows = rows.map(r =>
      [r.source, r.company, r.phone, r.email, r.telegram, r.website, r.city, r.score, r.temperature, r.why, r.offer]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="approved-leads-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: true, total: rows.length, import: approvedImport.length, mi: clientMI.length, rows });
}
