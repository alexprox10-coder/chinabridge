import SignupForm from "./SignupForm";

export const metadata = { title: "Регистрация — ChinaBridge Platform" };

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <SignupForm />
    </div>
  );
}
