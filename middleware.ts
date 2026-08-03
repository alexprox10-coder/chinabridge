import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Admin auth ───────────────────────────────────────────
const ADMIN_COOKIE = "cb_admin";

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET ?? "chinabridge-default-secret";
    const password = process.env.ADMIN_PASSWORD ?? "";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(password));
    return token === Buffer.from(sig).toString("base64url");
  } catch {
    return false;
  }
}

// ── Client auth ──────────────────────────────────────────
const CLIENT_COOKIE = "cb_client";

async function verifyClientToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return false;
    const encoded = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const secret = process.env.CLIENT_SESSION_SECRET ?? "chinabridge-client-secret-2026";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    return sigB64 === Buffer.from(sig).toString("base64url");
  } catch {
    return false;
  }
}

// ── Partner auth ─────────────────────────────────────────
const PARTNER_COOKIE = "cb_partner";

async function verifyPartnerToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return false;
    const encoded = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const secret = process.env.PARTNER_SESSION_SECRET ?? "chinabridge-partner-secret-2026";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    return sigB64 === Buffer.from(sig).toString("base64url");
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* (except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value ?? "";
    if (!token || !(await verifyAdminToken(token))) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect /client/* (except /client/login)
  if (pathname.startsWith("/client") && !pathname.startsWith("/client/login")) {
    const token = request.cookies.get(CLIENT_COOKIE)?.value ?? "";
    if (!token || !(await verifyClientToken(token))) {
      const url = new URL("/client/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect /partner/* (except /partner/login)
  if (pathname.startsWith("/partner") && !pathname.startsWith("/partner/login")) {
    const token = request.cookies.get(PARTNER_COOKIE)?.value ?? "";
    if (!token || !(await verifyPartnerToken(token))) {
      const url = new URL("/partner/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Pass current pathname to layouts via header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*", "/partner/:path*"],
};
