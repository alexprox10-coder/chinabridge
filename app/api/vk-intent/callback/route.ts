import { NextRequest, NextResponse } from "next/server";
import { saveVkToken } from "@/lib/vk-intent/tokens";

const CLIENT_ID    = "54735650";
const REDIRECT_URI = "https://chinabridge.pro/api/vk-intent/callback";
const ADMIN_URL    = "https://chinabridge.pro/admin/market-intelligence/vk-intent";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) return NextResponse.redirect(`${ADMIN_URL}?vk_error=${encodeURIComponent(error)}`);
  if (!code) return NextResponse.redirect(`${ADMIN_URL}?vk_error=no_code`);

  const secret = process.env.VK_CLIENT_SECRET ?? "";
  if (!secret) return NextResponse.redirect(`${ADMIN_URL}?vk_error=no_client_secret`);

  const tokenUrl = new URL("https://oauth.vk.com/access_token");
  tokenUrl.searchParams.set("client_id",     CLIENT_ID);
  tokenUrl.searchParams.set("client_secret", secret);
  tokenUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
  tokenUrl.searchParams.set("code",          code);

  try {
    const res  = await fetch(tokenUrl.toString(), { signal: AbortSignal.timeout(10_000) });
    const data = await res.json() as { error?: string; error_description?: string; access_token?: string; user_id?: number };

    if (data.error || !data.access_token) {
      const msg = data.error_description ?? data.error ?? "token_error";
      return NextResponse.redirect(`${ADMIN_URL}?vk_error=${encodeURIComponent(msg)}`);
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.redirect(`${ADMIN_URL}?vk_error=no_db`);

    await saveVkToken(dbUrl, { access_token: data.access_token, user_id: data.user_id ?? 0 });
    return NextResponse.redirect(`${ADMIN_URL}?vk_connected=1`);
  } catch (e) {
    return NextResponse.redirect(`${ADMIN_URL}?vk_error=${encodeURIComponent(String(e))}`);
  }
}
