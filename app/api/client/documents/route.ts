import { NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getClientDocuments, getAllOrders, getOrderDocuments } from "@/lib/client-portal/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (session.role === "CLIENT") {
    const docs = await getClientDocuments(session.clientId);
    return NextResponse.json(docs);
  }

  // Manager/Admin: get docs across all orders
  const orders = await getAllOrders();
  const allDocs = await Promise.all(orders.map((o) => getOrderDocuments(o.order_id)));
  return NextResponse.json(allDocs.flat());
}
