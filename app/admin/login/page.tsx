"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold text-white transition-all ${
            i < value.length ? "border-emerald-500 bg-emerald-900/30" : "border-slate-700 bg-slate-800"
          }`}
        >
          {i < value.length ? "●" : ""}
        </div>
      ))}
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="absolute opacity-0 w-0 h-0"
        autoFocus
      />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab,      setTab]      = useState<"owner" | "tenant">("tenant");
  const [password, setPassword] = useState("");
  const [email,    setEmail]    = useState("");
  const [pin,      setPin]      = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const dest = params.get("from") ?? "/admin/dashboard";

  async function handleOwner(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { router.push(dest); } else { setError("Неверный пароль"); }
    } catch { setError("Ошибка соединения"); }
    finally   { setLoading(false); }
  }

  async function handleTenant(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) { setError("Введите минимум 4 цифры"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tenant-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (data.ok) { router.push(dest); }
      else         { setError(data.error ?? "Ошибка входа"); }
    } catch { setError("Ошибка соединения"); }
    finally   { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🇨🇳</div>
          <h1 className="text-2xl font-bold text-white">ChinaBridge CRM</h1>
          <p className="text-slate-400 mt-1 text-sm">Войдите в рабочий кабинет</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 mb-5">
          <button
            onClick={() => { setTab("tenant"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "tenant" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            🏢 Мой кабинет
          </button>
          <button
            onClick={() => { setTab("owner"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "owner" ? "bg-red-700 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            🔐 Владелец
          </button>
        </div>

        {/* Tenant form */}
        {tab === "tenant" && (
          <form onSubmit={handleTenant} className="bg-slate-900 border border-slate-800 rounded-2xl p-7 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                placeholder="owner@company.ru"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">PIN-код</label>
              <div className="relative cursor-text" onClick={() => {
                const inp = document.querySelector<HTMLInputElement>("input[type=tel]");
                inp?.focus();
              }}>
                <PinInput value={pin} onChange={setPin} />
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">Нажмите на поле и введите цифры</p>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || pin.length < 4 || !email}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Вход..." : "Войти →"}
            </button>
            <p className="text-center text-xs text-slate-600">
              Нет аккаунта?{" "}
              <a href="/signup" className="text-emerald-400 hover:text-emerald-300">Зарегистрироваться</a>
            </p>
          </form>
        )}

        {/* Owner form */}
        {tab === "owner" && (
          <form onSubmit={handleOwner} className="bg-slate-900 border border-slate-800 rounded-2xl p-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Пароль платформы</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
                placeholder="Введите пароль"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
