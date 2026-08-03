import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getOrderById, getOrderTracking, getOrderDocuments } from "@/lib/client-portal/api";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Clients can only see their own orders
  if (session.role === "CLIENT" && order.client_id !== session.clientId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [tracking, documents] = await Promise.all([
    getOrderTracking(id),
    getOrderDocuments(id),
  ]);

  return NextResponse.json({ order, tracking, documents });
}
