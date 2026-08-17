export type IntelDepartment = 'IMPORT' | 'WB' | 'OZON' | 'COMPETITOR' | 'LOGISTICS' | 'GENERAL';
export type SourceType      = 'OFFICIAL' | 'REGULATOR' | 'MARKETPLACE' | 'COMPETITOR' | 'NEWS' | 'COMMUNITY';
export type CrawlFrequency  = 'REALTIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL';
export type Confidence      = 'HIGH' | 'MEDIUM' | 'LOW';
export type ImpactLevel     = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ChangeType      = 'CHANGE' | 'NEWS' | 'ANNOUNCEMENT' | 'CLARIFICATION' | 'WARNING' | 'PROPOSAL' | 'ERROR';
export type ChangeStatus    = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
export type FactCategory    = 'COMMISSION' | 'LOGISTICS' | 'CUSTOMS' | 'CURRENCY' | 'RULE' | 'TARIFF' | 'STORAGE' | 'RETURN' | 'OTHER';

export interface IntelSource {
  id: number;
  name: string;
  url: string;
  department: IntelDepartment;
  source_type: SourceType;
  priority: number;
  active: boolean;
  crawl_frequency: CrawlFrequency;
  last_checked: string | null;
  last_success: string | null;
  error_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelFact {
  id: number;
  fact_key: string;
  department: IntelDepartment;
  category: FactCategory;
  entity: string;
  metric: string;
  current_value: string;
  unit: string | null;
  valid_from: string;
  source_id: number | null;
  source_url: string | null;
  confidence: Confidence;
  impact_level: ImpactLevel;
  label: string;
  notes: string | null;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelFactVersion {
  id: number;
  fact_id: number;
  fact_key: string;
  value: string;
  valid_from: string;
  valid_to: string | null;
  source_url: string | null;
  confidence: Confidence;
  change_id: number | null;
  created_at: string;
}

export interface IntelChange {
  id: number;
  change_code: string;
  fact_id: number | null;
  fact_key: string;
  department: IntelDepartment;
  source_id: number | null;
  source_url: string | null;
  entity: string;
  metric: string;
  old_value: string | null;
  new_value: string;
  difference: string | null;
  unit: string | null;
  change_type: ChangeType;
  effective_from: string | null;
  detected_at: string;
  confidence: Confidence;
  impact: ImpactLevel;
  impact_summary: string | null;
  affected_systems: string[];
  status: ChangeStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateFactInput {
  fact_key: string;
  department: IntelDepartment;
  category: FactCategory;
  entity: string;
  metric: string;
  current_value: string;
  unit?: string | null;
  valid_from: string;
  source_id?: number | null;
  source_url?: string | null;
  confidence: Confidence;
  impact_level: ImpactLevel;
  label: string;
  notes?: string | null;
  requires_approval?: boolean;
}

export interface CreateChangeInput {
  fact_key: string;
  department: IntelDepartment;
  source_id?: number | null;
  source_url?: string | null;
  entity: string;
  metric: string;
  old_value?: string | null;
  new_value: string;
  difference?: string | null;
  unit?: string | null;
  change_type: ChangeType;
  effective_from?: string | null;
  confidence: Confidence;
  impact: ImpactLevel;
  impact_summary?: string | null;
  affected_systems?: string[];
  notes?: string | null;
}

export interface IntelStats {
  sources_total: number;
  sources_active: number;
  facts_total: number;
  facts_critical: number;
  changes_pending: number;
  changes_applied: number;
}
