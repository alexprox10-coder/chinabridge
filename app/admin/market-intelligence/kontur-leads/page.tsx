import { Suspense } from "react";
import KonturLeadsClient from "./KonturLeadsClient";

export const metadata = { title: "Контур Лиды — ChinaBridge Admin" };

export default function KonturLeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Загрузка...</div>}>
      <KonturLeadsClient />
    </Suspense>
  );
}
