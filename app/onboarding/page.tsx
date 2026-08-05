import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Настройка компании — ChinaBridge" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <OnboardingWizard />
    </div>
  );
}
