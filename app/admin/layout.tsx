import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChinaBridge CRM",
  robots: "noindex,nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout-root min-h-screen lg:pl-64 pb-16 lg:pb-0" style={{background:"#F9FAFB", color:"#111827"}}>
      {children}
    </div>
  );
}
