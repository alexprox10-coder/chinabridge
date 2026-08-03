const SESSION_COOKIE = "cb_admin";

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(password: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "chinabridge-default-secret";
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(password));
  return Buffer.from(sig).toString("base64url");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return password === expected && expected.length > 0;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const password = process.env.ADMIN_PASSWORD ?? "";
    const expected = await createSessionToken(password);
    return token === expected;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
