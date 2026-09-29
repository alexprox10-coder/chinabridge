import { NextRequest, NextResponse } from "next/server";
import { getClientSuppliers, confirmHSCode } from "@/lib/docs/master_data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userKey = req.nextUrl.searchParams.get("telegram") ||
                  req.nextUrl.searchParams.get("key") ||
                  req.cookies.get("cb_docs_session")?.value || "";

  if (!userKey) return NextResponse.json({ suppliers: [] });

  const suppliers = await getClientSuppliers(userKey);
  return NextResponse.json({ suppliers, user_key: userKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { action?: string; product_id?: string; hs_code?: string };
    if (body.action === "confirm_hs" && body.product_id && body.hs_code) {
      await confirmHSCode(body.product_id, body.hs_code);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
