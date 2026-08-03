import { NextRequest, NextResponse } from "next/server";
import { getDocumentsByLead, createDocument, genDocNumber } from "@/lib/documents/api";
import type { DocumentType } from "@/lib/documents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  const docs = await getDocumentsByLead(leadId);
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lead_id, document_type } = body as { lead_id: string; document_type: DocumentType };
  if (!lead_id || !document_type) return NextResponse.json({ error: "lead_id + document_type required" }, { status: 400 });

  const existing = await getDocumentsByLead(lead_id);
  const sameType  = existing.filter((d) => d.document_type === document_type);
  const num = genDocNumber(document_type, sameType.length + 1);

  const doc = await createDocument({
    lead_id,
    document_type,
    document_number: num,
    status: "draft",
    file_url: `/api/admin/documents/pdf?type=${document_type}&lead_id=${lead_id}&num=${encodeURIComponent(num)}`,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
