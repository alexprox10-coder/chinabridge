import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const SESSION_COOKIE = "cb_calc_session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getSessionId(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null;
}

// Returns existing session_id or generates a new one.
// The caller must set the cookie on the response using setSessionCookie().
export function getOrCreateSessionId(req: NextRequest): { session_id: string; isNew: boolean } {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  if (existing) return { session_id: existing, isNew: false };
  return { session_id: randomUUID(), isNew: true };
}

export function setSessionCookie(res: NextResponse, session_id: string): void {
  res.cookies.set(SESSION_COOKIE, session_id, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   MAX_AGE,
    path:     "/",
  });
}

export function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
