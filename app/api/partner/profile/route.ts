import { NextRequest, NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-portal/auth";
import { getPartnerById, updatePartnerProfile } from "@/lib/partner-portal/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partner = await getPartnerById(session.partnerId);
  if (!partner) {
    return NextResponse.json({
      partner_id: session.partnerId,
      email: session.email,
      name_ru: session.name,
      name_cn: "",
      role: session.role,
      language: session.language,
    });
  }

  const { password_hash: _, ...safe } = partner;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partner = await getPartnerById(session.partnerId);
  if (!partner) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Partial<{
    name_ru: string; name_cn: string; company: string; city: string; phone: string; wechat: string;
  }>;

  const ok = await updatePartnerProfile(partner.id, body);
  return NextResponse.json({ ok });
}
