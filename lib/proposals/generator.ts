import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { registerFonts } from './pdf/fonts';
import { ProposalDocument } from './pdf/document';
import { loadTemplate, detectServiceKey } from './templates';
import { getMissingFields } from './sections';
import { generateProposalNumber } from './numbering';
import type { CRMLead } from '@/lib/crm/types';
import type { ProposalContext, ProposalMode, LeadSnapshot } from './types';

export async function generateProposal(
  lead: CRMLead,
  mode: ProposalMode,
): Promise<{ ctx: ProposalContext; buffer: Buffer }> {
  registerFonts();

  const leadSnapshot: LeadSnapshot = {
    id: String(lead.id ?? lead.lead_id ?? ''),
    name: lead.name ?? '',
    company: lead.company ?? '',
    phone: lead.phone ?? '',
    telegram: lead.telegram ?? '',
    email: lead.email ?? '',
    product: lead.product ?? '',
    category: lead.category ?? '',
    productLink: lead.product_link ?? '',
    quantity: lead.quantity ?? '',
    weight: lead.weight ?? '',
    volume: lead.volume ?? '',
    fromCity: '',
    toCity: lead.city_destination ?? '',
    countryDestination: lead.country_destination ?? '',
    service: lead.service_type ?? '',
  };

  const serviceKey = detectServiceKey(leadSnapshot.service);
  const template = loadTemplate(serviceKey);
  const missingFields = getMissingFields(leadSnapshot as unknown as Record<string, string>);

  const ctx: ProposalContext = {
    id: crypto.randomUUID(),
    number: generateProposalNumber(),
    mode,
    createdAt: new Date().toISOString(),
    lead: leadSnapshot,
    serviceKey,
    template,
    missingFields,
  };

  // ProposalDocument renders a @react-pdf/renderer <Document> at its root.
  // We cast via unknown to satisfy renderToBuffer's DocumentProps generic.
  const element = React.createElement(ProposalDocument, { ctx });
  const buffer = await renderToBuffer(
    element as unknown as Parameters<typeof renderToBuffer>[0],
  );

  return { ctx, buffer };
}
