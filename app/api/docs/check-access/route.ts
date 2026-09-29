import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCS_FREE_LIMIT = 3;
const DOCS_SESSION_COOKIE = "cb_docs_session";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(DOCS_SESSION_COOKIE)?.value;
  if (!sessionId || !process.env.DATABASE_URL) {
    return NextResponse.json({ free_left: DOCS_FREE_LIMIT, has_access: true });
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT used FROM docs_free_usage WHERE session_id = ${sessionId}` as Array<{ used: number }>;
    const used = rows[0]?.used ?? 0;
    const free_left = Math.max(0, DOCS_FREE_LIMIT - used);
    return NextResponse.json({ free_left, has_access: free_left > 0, used });
  } catch {
    return NextResponse.json({ free_left: DOCS_FREE_LIMIT, has_access: true });
  }
}
