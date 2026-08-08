import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic  = "force-dynamic";
export const metadata = { title: "Добро пожаловать — ChinaBridge" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const params   = await searchParams;
  const preview  = params.preview === "1";

  const store    = await cookies();
  const isAdmin  = store.get("cb_admin")?.value;
  const isTenant = store.get("cb_tenant_session")?.value;
  const isDone   = store.get("cb_onboarding")?.value;

  // ?preview=1 — владелец смотрит онбординг, редиректы отключены
  if (!preview) {
    if (isAdmin && !isTenant) redirect("/admin/dashboard");
    if (isDone)               redirect("/admin/dashboard");
    if (!isTenant && !isAdmin) redirect("/admin/login");
  }

  return <OnboardingWizard />;
}
