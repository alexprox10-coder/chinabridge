import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPartnerToken, PARTNER_COOKIE } from "@/lib/partner-portal/auth";
import { I18nProvider } from "@/lib/partner-portal/i18n";
import PartnerNav from "@/components/partner/PartnerNav";
import type { Lang } from "@/lib/partner-portal/types";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  if (pathname === "/partner/login") {
    return <>{children}</>;
  }

  const token = cookieStore.get(PARTNER_COOKIE)?.value;
  if (!token) redirect("/partner/login");

  const session = await verifyPartnerToken(token);
  if (!session) redirect("/partner/login");

  const langCookie = cookieStore.get("cb_partner_lang")?.value as Lang | undefined;
  const initialLang: Lang = (langCookie === "ru" || langCookie === "zh") ? langCookie : (session.language ?? "ru");

  return (
    <I18nProvider initialLang={initialLang}>
      <PartnerNav session={session} />
      {/* Desktop: offset for sidebar; Mobile: offset for top + bottom bars */}
      <main className="md:ml-60 min-h-screen bg-slate-50">
        <div className="px-4 py-6 pt-20 pb-24 md:pt-8 md:pb-8 md:px-8 max-w-4xl">
          {children}
        </div>
      </main>
    </I18nProvider>
  );
}
