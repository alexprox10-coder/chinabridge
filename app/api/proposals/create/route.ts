import { NextRequest, NextResponse } from 'next/server';
import { getLead, getLeadByLeadId } from '@/lib/crm/client';
import { generateProposal } from '@/lib/proposals/generator';
import { saveProposal } from '@/lib/proposals/crm';
import type { CreateProposalRequest, ProposalRecord } from '@/lib/proposals/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<CreateProposalRequest>;
  const { leadId, mode = 'BUSINESS', createdBy = 'manager' } = body;

  if (!leadId) return NextResponse.json({ ok: false, error: 'leadId required' }, { status: 400 });

  // Try numeric row ID first, then fall back to string lead_id UUID
  const numId = Number(leadId);
  const lead = Number.isNaN(numId)
    ? await getLeadByLeadId(String(leadId))
    : await getLead(numId) ?? await getLeadByLeadId(String(leadId));

  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });

  try {
    const { ctx, buffer } = await generateProposal(lead, mode);

    const record: ProposalRecord = {
      proposal_id: ctx.id,
      proposal_number: ctx.number,
      lead_id: String(leadId),
      lead_name: lead.name ?? '',
      proposal_type: mode,
      service_type: ctx.serviceKey,
      lead_data: JSON.stringify(ctx.lead),
      created_at: ctx.createdAt,
      created_by: createdBy,
      status: 'ready',
    };

    // Fire-and-forget save to n8n (best-effort, non-blocking)
    saveProposal(record).catch(() => {});
    fetch(`${process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru'}/webhook/crm-save-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'proposal_created', ...record }),
    }).catch(() => {});

    const filename = `${ctx.number}-${mode}.pdf`;

    return NextResponse.json({
      ok: true,
      proposalId: ctx.id,
      proposalNumber: ctx.number,
      filename,
      // Return PDF inline so client can download without a second request
      pdfBase64: buffer.toString('base64'),
      downloadUrl: `/api/proposals/download/${ctx.id}`,
    });
  } catch (err) {
    console.error('[proposals/create]', err);
    return NextResponse.json({ ok: false, error: 'generation_failed' }, { status: 500 });
  }
}
