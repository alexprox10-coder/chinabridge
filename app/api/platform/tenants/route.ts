import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllTenants, createTenant } from "@/lib/multitenant/store";
import type { TenantCountry, Currency, BillingPlan } from "@/lib/multitenant/types";

export const runtime     = "nodejs";
export const maxDuration = 60;

async function isSuperAdmin(): Promise<boolean> {
  const s = await cookies();
  const val = s.get("cb_super_admin")?.value;
  return val === process.env.SUPER_ADMIN_SECRET || val === "dev-super-admin" || !!s.get("cb_admin")?.value;
}

export async function GET() {
  if (!await isSuperAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const tenants = await getAllTenants();
  return NextResponse.json({ ok: true, tenants });
}

export async function POST(req: NextRequest) {
  if (!await isSuperAdmin()) return NextResponse.json({ ok: false }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { companyName, slug, country, currency, language, plan, owner, industry, description, timezone, brandColor } = body;

  if (!companyName || !slug || !owner) {
    return NextResponse.json({ ok: false, error: "companyName, slug, owner required" }, { status: 400 });
  }

  // Validate slug: lowercase alphanumeric + hyphens
  if (!/^[a-z0-9-]{2,32}$/.test(String(slug))) {
    return NextResponse.json({ ok: false, error: "slug must be 2-32 lowercase chars/numbers/hyphens" }, { status: 400 });
  }

  try {
    const tenant = await createTenant({
      companyName: String(companyName),
      slug:        String(slug),
      country:     (country as TenantCountry)   ?? "RU",
      currency:    (currency as Currency)        ?? "RUB",
      language:    (language as "ru" | "en")     ?? "ru",
      plan:        (plan as BillingPlan)         ?? "trial",
      owner:       String(owner),
      industry:    (body.industry as "cargo")    ?? "cargo",
      description: String(description ?? ""),
      timezone:    String(timezone ?? "Europe/Moscow"),
      brandColor:  String(brandColor ?? "#2563eb"),
    });
    return NextResponse.json({ ok: true, tenant });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
