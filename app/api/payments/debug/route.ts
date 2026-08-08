import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";

export const runtime     = "nodejs";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const jwt    = process.env.TOCHKA_JWT ?? "";
  const custCode = process.env.TOCHKA_CUSTOMER_CODE ?? "";
  const merchantId = process.env.TOCHKA_MERCHANT_ID ?? "";

  // Check JWT shape (don't expose full token)
  const jwtTrimmed = jwt.trim();
  const parts = jwtTrimmed.split(".");
  const jwtInfo = {
    len:          jwt.length,
    trimmedLen:   jwtTrimmed.length,
    hasCR:        jwt.includes("\r"),
    hasNewline:   jwt.includes("\n"),
    partsCount:   parts.length,
    prefix:       jwt.slice(0, 30) + "...",
    customerCode: custCode,
    merchantId,
  };

  // Try a real Tochka call — list retailers
  let tochkaTest: unknown = null;
  try {
    const res = await fetch(
      "https://enter.tochka.com/uapi/open-banking/v1.0/retailers",
      {
        headers: {
          Authorization: `Bearer ${jwtTrimmed}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    const body = await res.json();
    tochkaTest = { status: res.status, body };
  } catch (e) {
    tochkaTest = { error: String(e) };
  }

  // Try creating a minimal test payment
  let paymentTest: unknown = null;
  try {
    const res = await fetch("https://enter.tochka.com/uapi/acquiring/v1.0/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtTrimmed}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        Data: {
          customerCode:    custCode,
          merchantId,
          amount:          100,
          purpose:         "test payment debug",
          paymentMode:     ["sbp", "tinkoff", "card"],
          redirectUrl:     "https://chinabridge.pro/admin/settings/billing?paid=1",
          failRedirectUrl: "https://chinabridge.pro/admin/settings/billing?paid=0",
          paymentLinkId:   `debug-${Date.now()}`,
          ttl:             60,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json();
    paymentTest = { status: res.status, body };
  } catch (e) {
    paymentTest = { error: String(e) };
  }

  return NextResponse.json({ jwtInfo, tochkaTest, paymentTest });
}
