import { cookies } from "next/headers";
import type { PartnerSession } from "./types";

export const PARTNER_COOKIE = "cb_partner";

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Buffer.from(buf).toString("hex");
}

export async function createPartnerToken(payload: PartnerSession): Promise<string> {
  const secret = process.env.PARTNER_SESSION_SECRET ?? "chinabridge-partner-secret-2026";
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${Buffer.from(sig).toString("base64url")}`;
}

export async function verifyPartnerToken(token: string): Promise<PartnerSession | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const encoded = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const secret = process.env.PARTNER_SESSION_SECRET ?? "chinabridge-partner-secret-2026";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    if (sigB64 !== Buffer.from(sig).toString("base64url")) return null;
    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as PartnerSession;
  } catch {
    return null;
  }
}

export async function getPartnerSession(): Promise<PartnerSession | null> {
  const store = await cookies();
  const token = store.get(PARTNER_COOKIE)?.value;
  if (!token) return null;
  return verifyPartnerToken(token);
}
