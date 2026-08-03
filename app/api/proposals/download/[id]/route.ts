import { NextRequest, NextResponse } from 'next/server';
import { getProposal } from '@/lib/proposals/crm';
import { generateProposal } from '@/lib/proposals/generator';
import type { CRMLead } from '@/lib/crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let leadData: Partial<CRMLead>;
  try {
    leadData = JSON.parse(proposal.lead_data ?? '{}');
  } catch {
    leadData = {};
  }

  // Reconstruct CRMLead-like object from stored snapshot
  const fakeLead: CRMLead = {
    id: Number(proposal.lead_id) || 0,
    lead_id: proposal.lead_id,
    name: (leadData as Record<string, string>).name ?? proposal.lead_name,
    phone: (leadData as Record<string, string>).phone ?? '',
    telegram: (leadData as Record<string, string>).telegram ?? '',
    email: (leadData as Record<string, string>).email ?? '',
    company: (leadData as Record<string, string>).company ?? '',
    product: (leadData as Record<string, string>).product ?? '',
    product_link: (leadData as Record<string, string>).productLink ?? '',
    category: (leadData as Record<string, string>).category ?? '',
    quantity: (leadData as Record<string, string>).quantity ?? '',
    weight: (leadData as Record<string, string>).weight ?? '',
    volume: (leadData as Record<string, string>).volume ?? '',
    country_destination: (leadData as Record<string, string>).countryDestination ?? '',
    city_destination: (leadData as Record<string, string>).toCity ?? '',
    delivery_type: '',
    service_type: (leadData as Record<string, string>).service ?? '',
    status: 'NEW',
    priority: 'COLD',
    estimated_value: 0,
    manager: '',
    comment: '',
    source: '',
    utm_source: '',
    utm_campaign: '',
    created_at: proposal.created_at,
    updated_at: proposal.created_at,
  };

  const { buffer } = await generateProposal(fakeLead, proposal.proposal_type);

  const filename = `${proposal.proposal_number}-${proposal.proposal_type}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
