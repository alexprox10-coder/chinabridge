"use client";
import { useState, useEffect } from "react";

interface Profile {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  telegram?: string;
  inn?: string;
  country?: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [inn, setInn] = useState("");
  const [country, setCountry] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/client/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setName(p.name ?? "");
        setCompany(p.company ?? "");
        setPhone(p.phone ?? "");
        setTelegram(p.telegram ?? "");
        setInn(p.inn ?? "");
        setCountry(p.country ?? "");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          phone,
          telegram,
          inn,
          country,
          ...(newPassword.trim() ? { new_password: newPassword } : {}),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setNewPassword("");
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Не удалось сохранить");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Профиль</h1>
        <p className="text-slate-500 text-sm mt-1">Управляйте данными вашего аккаунта</p>
      </div>

      {/* Account info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
            {(profile.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile.name}</p>
            <p className="text-sm text-slate-400">{profile.email}</p>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 mt-1 inline-block">
              {profile.role === "CLIENT" ? "Клиент" : profile.role === "MANAGER" ? "Менеджер" : "Администратор"}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          {profile.created_at
            ? `Аккаунт создан ${new Date(profile.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`
            : ""}
        </p>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Редактировать данные</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Ваше имя"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Компания</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Название компании (необязательно)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="+7 999 000 00 00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Telegram</label>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="@username"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ИНН компании</label>
            <input
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="1234567890"
              maxLength={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Страна доставки</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">Не выбрано</option>
              <option value="RU">🇷🇺 Россия</option>
              <option value="KZ">🇰🇿 Казахстан</option>
              <option value="BY">🇧🇾 Беларусь</option>
              <option value="OTHER">Другая</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Новый пароль</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Оставьте пустым, чтобы не менять"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            ✓ Данные сохранены
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </button>
      </form>
    </div>
  );
}
