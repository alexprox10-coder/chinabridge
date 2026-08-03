"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Ошибка авторизации через Google. Попробуйте снова.",
  account_inactive: "Аккаунт заблокирован. Свяжитесь с менеджером.",
  no_email: "Google не предоставил email. Используйте другой аккаунт.",
  oauth_not_configured: "Вход через Google временно недоступен.",
};

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function LoginRegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [error, setError] = useState(
    OAUTH_ERRORS[params.get("error") ?? ""] ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push(params.get("from") ?? "/client/dashboard");
        router.refresh();
      } else {
        setError("Неверный email или пароль");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      if (res.ok) {
        router.push("/client/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (data.error === "email_taken") {
          setError("Этот email уже зарегистрирован");
        } else {
          setError("Ошибка регистрации. Попробуйте снова.");
        }
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-3xl font-bold mb-2">
            <span className="text-slate-900">China</span>
            <span className="text-green-600">Bridge</span>
          </div>
          <p className="text-slate-500 text-sm">
            {mode === "login" ? "Войдите в личный кабинет" : "Создайте аккаунт"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
          {/* Google button */}
          <a
            href="/api/client/auth/google"
            className="flex items-center justify-center gap-3 w-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition text-sm"
          >
            <GoogleIcon />
            {mode === "login" ? "Войти через Google" : "Зарегистрироваться через Google"}
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">или</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="your@email.com"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? "Вход..." : "Войти"}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ваше имя</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Иван Иванов"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Минимум 8 символов"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Повторите пароль</label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p className="text-sm text-slate-500">
              Нет аккаунта?{" "}
              <button onClick={() => switchMode("register")} className="text-green-600 hover:underline font-medium">
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Уже есть аккаунт?{" "}
              <button onClick={() => switchMode("login")} className="text-green-600 hover:underline font-medium">
                Войти
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <a
            href="https://chinabridge.pro"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться на сайт
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense>
      <LoginRegisterForm />
    </Suspense>
  );
}
