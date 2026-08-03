import { NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getClientOrders, getAllOrders } from "@/lib/client-portal/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = session.role === "CLIENT"
    ? await getClientOrders(session.clientId)
    : await getAllOrders();

  return NextResponse.json(orders);
}
