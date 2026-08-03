import { cookies } from "next/headers";
import type { SessionPayload } from "./types";

export const CLIENT_COOKIE = "cb_client";

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Buffer.from(buf).toString("hex");
}

export async function createClientToken(payload: SessionPayload): Promise<string> {
  const secret = process.env.CLIENT_SESSION_SECRET ?? "chinabridge-client-secret-2026";
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

export async function verifyClientToken(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const encoded = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const secret = process.env.CLIENT_SESSION_SECRET ?? "chinabridge-client-secret-2026";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    if (sigB64 !== Buffer.from(sig).toString("base64url")) return null;
    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  return verifyClientToken(token);
}
