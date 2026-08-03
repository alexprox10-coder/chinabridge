"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ru, zh } from "@/lib/partner-portal/translations";
import type { Lang } from "@/lib/partner-portal/types";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Ошибка авторизации через Google. / Google登录失败。",
  account_inactive: "Аккаунт заблокирован. / 账号已被禁用。",
  no_email: "Google не предоставил email. / Google未提供邮箱。",
  oauth_not_configured: "Google вход временно недоступен. / Google登录暂不可用。",
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

function PartnerLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [lang, setLangState] = useState<Lang>("ru");
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regInvite, setRegInvite] = useState("");

  const [error, setError] = useState(
    OAUTH_ERRORS[params.get("error") ?? ""] ?? ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cb_partner_lang") as Lang | null;
    if (saved === "ru" || saved === "zh") { setLangState(saved); return; }
    if (navigator.language.toLowerCase().startsWith("zh")) setLangState("zh");
  }, []);

  const t = (key: keyof typeof ru) => (lang === "zh" ? zh : ru)[key];

  function switchLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("cb_partner_lang", l);
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, language: lang }),
      });
      if (res.ok) {
        localStorage.setItem("cb_partner_lang", lang);
        router.push("/partner/dashboard");
        router.refresh();
      } else {
        setError(t("error_login"));
      }
    } catch {
      setError(t("connection_error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      setError(t("error_password_match"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, language: lang, invite_code: regInvite }),
      });
      if (res.ok) {
        localStorage.setItem("cb_partner_lang", lang);
        router.push("/partner/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (data.error === "email_taken") {
          setError(t("error_email_taken"));
        } else if (data.error === "invalid_invite_code") {
          setError(t("error_invalid_invite"));
        } else {
          setError(t("connection_error"));
        }
      }
    } catch {
      setError(t("connection_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + lang switcher */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">CB</div>
            <span className="font-bold text-2xl text-slate-800">
              China<span className="text-blue-600">Bridge</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            {mode === "login" ? t("login_title") : t("register_title")}
          </p>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm font-medium">
            <button onClick={() => switchLang("ru")}
              className={`px-4 py-1.5 transition ${lang === "ru" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              🇷🇺 RU
            </button>
            <button onClick={() => switchLang("zh")}
              className={`px-4 py-1.5 transition ${lang === "zh" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              🇨🇳 中文
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
          {/* Google button */}
          <a
            href="/api/partner/auth/google"
            className="flex items-center justify-center gap-3 w-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition text-sm"
          >
            <GoogleIcon />
            {mode === "login"
              ? (lang === "zh" ? "通过 Google 登录" : "Войти через Google")
              : (lang === "zh" ? "通过 Google 注册" : "Зарегистрироваться через Google")}
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{lang === "zh" ? "或" : "или"}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="partner@example.com"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? "..." : t("login")}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("name")}</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder={lang === "zh" ? "张三 / Ivan Ivanov" : "Иван Иванов"}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("email")}</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="partner@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("password")}</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("confirm_password")}</label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("invite_code")}</label>
                <input
                  type="text"
                  value={regInvite}
                  onChange={(e) => setRegInvite(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono tracking-widest"
                  placeholder={lang === "zh" ? "请输入邀请码" : "Введите код от менеджера"}
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
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? "..." : t("register")}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p className="text-sm text-slate-500">
              {t("no_account")}{" "}
              <button onClick={() => switchMode("register")} className="text-blue-600 hover:underline font-medium">
                {t("register")}
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              {t("already_have_account")}{" "}
              <button onClick={() => switchMode("login")} className="text-blue-600 hover:underline font-medium">
                {t("login")}
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
          <a href="https://chinabridge.pro"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("back_to_site")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense>
      <PartnerLoginForm />
    </Suspense>
  );
}
