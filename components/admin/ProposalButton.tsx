"use client";
import { useState } from "react";
import type { ProposalMode } from "@/lib/proposals/types";

const MODES: { mode: ProposalMode; label: string; desc: string; color: string }[] = [
  {
    mode: 'EXPRESS',
    label: 'EXPRESS',
    desc: '1 страница. Быстрый ответ клиенту.',
    color: 'border-green-500/40 hover:border-green-500 hover:bg-green-500/10',
  },
  {
    mode: 'BUSINESS',
    label: 'BUSINESS',
    desc: '3–5 страниц. Основной вариант.',
    color: 'border-blue-500/40 hover:border-blue-500 hover:bg-blue-500/10',
  },
  {
    mode: 'ENTERPRISE',
    label: 'ENTERPRISE',
    desc: 'Расширенный. Для крупных клиентов.',
    color: 'border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10',
  },
];

export function ProposalButton({ leadId, leadName }: { leadId: number; leadName: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProposalMode>('BUSINESS');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ proposalNumber: string; downloadUrl: string } | null>(null);
  const [error, setError] = useState('');

  async function create() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/proposals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, mode: selected }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ proposalNumber: data.proposalNumber, downloadUrl: data.downloadUrl });
      } else {
        setError(data.error ?? 'Ошибка генерации');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setError('');
    setSelected('BUSINESS');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-sm transition"
      >
        📄 Подготовить расчет
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
            {!result ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white font-semibold">Предварительный расчет</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{leadName}</p>
                  </div>
                  <button onClick={close} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
                </div>

                <p className="text-slate-400 text-sm mb-4">Выберите тип документа:</p>

                <div className="space-y-2 mb-5">
                  {MODES.map(({ mode, label, desc, color }) => (
                    <button
                      key={mode}
                      onClick={() => setSelected(mode)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected === mode
                          ? 'border-red-500 bg-red-500/10'
                          : `border-slate-700 ${color}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{label}</span>
                        {selected === mode && <span className="text-red-400 text-xs">✓ выбрано</span>}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={close}
                    className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:border-slate-500 transition"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={create}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
                  >
                    {loading ? 'Генерирую...' : 'Создать PDF'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">✅</div>
                  <h2 className="text-white font-semibold mb-1">Расчет готов</h2>
                  <p className="text-slate-500 text-sm">{result.proposalNumber}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={close}
                    className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:border-slate-500 transition"
                  >
                    Закрыть
                  </button>
                  <a
                    href={result.downloadUrl}
                    target="_blank"
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold text-center transition"
                  >
                    ↓ Скачать PDF
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
