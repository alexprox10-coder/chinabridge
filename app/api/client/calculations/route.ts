import { NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getClientCalculations } from "@/lib/client-portal/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const calcs = await getClientCalculations(session.clientId);
  return NextResponse.json({ calcs });
}
