import { AdminNav } from "@/components/admin/AdminNav";
import TgMonitorClient from "./TgMonitorClient";

export const dynamic = "force-dynamic";

export default function TgMonitorPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <span className="text-3xl">📡</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Telegram Monitor</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Сканирует публичные группы и каналы · Claude Haiku классифицирует намерение · HOT/WARM → @Monitor24_TG_bot
            </p>
          </div>
        </div>

        <TgMonitorClient />

      </main>
    </div>
  );
}
