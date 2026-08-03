export type ProposalMode = 'EXPRESS' | 'BUSINESS' | 'ENTERPRISE';
export type ProposalStatus = 'draft' | 'ready' | 'sent' | 'viewed';

export type ServiceKey =
  | 'consolidation'
  | 'container'
  | 'supplier-search'
  | 'inspection'
  | 'cargo'
  | '1688-buyout'
  | 'general';

export interface LeadSnapshot {
  id: string;
  name: string;
  company: string;
  phone: string;
  telegram: string;
  email: string;
  product: string;
  category: string;
  productLink: string;
  quantity: string;
  weight: string;
  volume: string;
  fromCity: string;
  toCity: string;
  countryDestination: string;
  service: string;
}

export interface ServiceTemplate {
  title: string;
  description: string;
  benefits: string[];
  processSteps: string[];
  deliveryTime: string;
}

export interface ProposalContext {
  id: string;
  number: string;
  mode: ProposalMode;
  createdAt: string;
  lead: LeadSnapshot;
  serviceKey: ServiceKey;
  template: ServiceTemplate;
  missingFields: string[];
}

export interface ProposalRecord {
  proposal_id: string;
  proposal_number: string;
  lead_id: string;
  lead_name: string;
  proposal_type: ProposalMode;
  service_type: string;
  lead_data: string; // JSON string of LeadSnapshot
  created_at: string;
  created_by: string;
  status: ProposalStatus;
}

export interface CreateProposalRequest {
  leadId: number;
  mode: ProposalMode;
  createdBy?: string;
}
