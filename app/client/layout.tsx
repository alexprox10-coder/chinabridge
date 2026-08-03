import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/client-portal/auth";
import ClientNav from "@/components/client/ClientNav";

export const metadata = { title: "ChinaBridge — Личный кабинет", robots: "noindex,nofollow" };

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  // Login page doesn't need auth or nav
  if (pathname === "/client/login") {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session) redirect("/client/login");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <ClientNav session={session} />

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-64 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
