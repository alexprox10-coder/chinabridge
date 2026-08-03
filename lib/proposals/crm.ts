import type { ProposalRecord } from './types';

const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';

export async function saveProposal(record: ProposalRecord): Promise<boolean> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-save-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getProposals(): Promise<ProposalRecord[]> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.rows ?? []);
  } catch {
    return [];
  }
}

export async function getProposal(proposalId: string): Promise<ProposalRecord | null> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.rows ?? [data]);
    return rows.find((r: ProposalRecord) => r.proposal_id === proposalId) ?? null;
  } catch {
    return null;
  }
}
