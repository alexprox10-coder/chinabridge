import { NextRequest, NextResponse } from "next/server";
import { updateDocumentStatus } from "@/lib/documents/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  const doc = await updateDocumentStatus(Number(id), status);
  return NextResponse.json({ document: doc });
}
