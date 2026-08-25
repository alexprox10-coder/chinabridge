import { NextResponse } from "next/server";

const CLIENT_ID   = "54735650";
const REDIRECT_URI = "https://chinabridge.pro/api/vk-intent/callback";

export async function GET() {
  const url = new URL("https://oauth.vk.com/authorize");
  url.searchParams.set("client_id",     CLIENT_ID);
  url.searchParams.set("display",       "page");
  url.searchParams.set("redirect_uri",  REDIRECT_URI);
  url.searchParams.set("scope",         "offline,wall,groups");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("v",             "5.199");
  return NextResponse.redirect(url.toString());
}
