import Link from 'next/link';
import { getProposals } from '@/lib/proposals/crm';
import { AdminNav } from '@/components/admin/AdminNav';
import type { ProposalMode, ProposalStatus } from '@/lib/proposals/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MODE_COLORS: Record<ProposalMode, string> = {
  EXPRESS: 'text-green-400 border-green-500/30 bg-green-500/10',
  BUSINESS: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  ENTERPRISE: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'text-slate-400 border-slate-600 bg-slate-800',
  ready: 'text-green-400 border-green-600/30 bg-green-600/10',
  sent: 'text-blue-400 border-blue-600/30 bg-blue-600/10',
  viewed: 'text-yellow-400 border-yellow-600/30 bg-yellow-600/10',
};

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Черновик',
  ready: 'Готов',
  sent: 'Отправлен',
  viewed: 'Просмотрен',
};

export default async function ProposalsPage() {
  const proposals = await getProposals();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Расчеты и КП</h1>
            <p className="text-slate-500 text-sm mt-1">Предварительные расчеты поставки</p>
          </div>
          <span className="text-slate-500 text-sm">{proposals.length} документов</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-left">
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Услуга</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-600">
                    Расчеты не создавались. Нажмите «Подготовить расчет» в карточке лида.
                  </td>
                </tr>
              )}
              {proposals.map((p) => {
                const mode = (p.proposal_type ?? 'BUSINESS') as ProposalMode;
                const status = (p.status ?? 'ready') as ProposalStatus;
                return (
                  <tr key={p.proposal_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-300 text-xs">{p.proposal_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${p.lead_id}`} className="text-white hover:text-red-400 transition">
                        {p.lead_name || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.service_type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${MODE_COLORS[mode]}`}>
                        {mode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {(p.created_at ?? '').slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/proposals/download/${p.proposal_id}`}
                        target="_blank"
                        className="text-red-400 hover:text-red-300 text-xs transition"
                      >
                        ↓ PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
