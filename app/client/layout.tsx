import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/client-portal/auth";
import { neon } from "@neondatabase/serverless";
import ClientNav from "@/components/client/ClientNav";

export const metadata = { title: "ChinaBridge — Личный кабинет", robots: "noindex,nofollow" };

async function getCalcPaid(clientId: string): Promise<boolean> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT 1 FROM calc_subscriptions
      WHERE client_id = ${clientId} AND subscribed_until > NOW() LIMIT 1`;
    return rows.length > 0;
  } catch { return false; }
}

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  // Login page doesn't need auth or nav
  if (pathname === "/client/login") {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session) redirect("/client/login");

  const isPaidCalc = await getCalcPaid(session.clientId);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <ClientNav session={session} isPaidCalc={isPaidCalc} />

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-64 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
