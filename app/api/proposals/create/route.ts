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

  // Try numeric row ID first, then fall back to string lead_id
  const numId = Number(leadId);
  const tenantId = req.cookies.get("cb_admin")?.value
    ? "tenant-chinabridge"
    : (req.cookies.get("cb_tenant_id")?.value ?? "tenant-chinabridge");
  const lead = Number.isNaN(numId)
    ? await getLeadByLeadId(String(leadId), tenantId)
    : await getLead(numId, tenantId) ?? await getLeadByLeadId(String(leadId), tenantId);

  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });

  // Snapshot финансовых коэффициентов на момент генерации КП
  const SNAPSHOT_KEYS = [
    'CNY_RATE', 'USD_RATE', 'CUSTOMS_DUTY_DEFAULT',
    'WB_COMMISSION_STANDARD', 'OZON_COMMISSION_STANDARD',
    'KASPI_COMMISSION_STANDARD', 'YANDEX_COMMISSION_STANDARD',
    'CB_MARKUP_PERCENT', 'CB_MIN_MARGIN_PERCENT',
  ];
  const { getFactsSnapshot } = await import('@/lib/intelligence/client');
  const intelSnapshot = await getFactsSnapshot(SNAPSHOT_KEYS).catch(() => ({}));

  try {
    const result = await Promise.race([
      generateProposal(lead, mode),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('proposal_timeout')), 18000)
      ),
    ]);
    const { ctx, buffer } = result;

    const record: ProposalRecord = {
      proposal_id:     ctx.id,
      proposal_number: ctx.number,
      lead_id:         String(leadId),
      lead_name:       lead.name ?? '',
      proposal_type:   mode,
      service_type:    ctx.serviceKey,
      lead_data:       JSON.stringify(ctx.lead),
      created_at:      ctx.createdAt,
      created_by:      createdBy,
      status:          'ready',
      intel_snapshot:  Object.keys(intelSnapshot).length > 0
        ? JSON.stringify(intelSnapshot)
        : undefined,
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
