"use client";
import { useState } from "react";
import type { CompanyInfo } from "@/lib/documents/types";

const inp = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition";

const FIELDS: { key: keyof CompanyInfo; label: string; placeholder?: string }[] = [
  { key: "company_name",  label: "Название организации",  placeholder: "ИП Попков Виталий Михайлович" },
  { key: "director",      label: "ФИО руководителя",      placeholder: "Попков Виталий Михайлович" },
  { key: "inn",           label: "ИНН",                   placeholder: "280114439648" },
  { key: "ogrnip",        label: "ОГРНИП",                placeholder: "315280100005555" },
  { key: "address",       label: "Юридический адрес",     placeholder: "г. Благовещенск, ул. ..." },
  { key: "phone",         label: "Телефон",               placeholder: "+7 914 000-00-00" },
  { key: "email",         label: "Email",                 placeholder: "info@chinabridge.pro" },
  { key: "bank_account",  label: "Расчётный счёт",        placeholder: "40802810..." },
  { key: "bank_name",     label: "Банк",                  placeholder: "АО «Тинькофф Банк»" },
  { key: "bik",           label: "БИК",                   placeholder: "044525974" },
  { key: "bank_corr",     label: "Корреспондентский счёт", placeholder: "30101810145250000974" },
];

export function CompanySettingsForm({ initial }: { initial: CompanyInfo }) {
  const [form, setForm]   = useState<CompanyInfo>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError("Не удалось сохранить. Проверьте соединение.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-xs font-medium mb-1">💡 Зачем это нужно</p>
        <p className="text-slate-400 text-xs">
          Эти реквизиты автоматически подставляются во все документы: счета, договоры, акты, инвойсы, доверенности.
          Заполните один раз — и документы будут генерироваться правильно.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Реквизиты ИП / организации</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-500 mb-1.5 block">{label}</label>
              <input
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className={inp}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
          }`}
        >
          {saved ? "✓ Реквизиты сохранены" : saving ? "Сохраняем..." : "Сохранить реквизиты"}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Предпросмотр реквизитов</h3>
        <div className="text-slate-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {form.company_name || "Название организации"}{"\n"}
          {"ИНН: "}{form.inn || "—"}{"  ОГРНИП: "}{form.ogrnip || "—"}{"\n"}
          {"Адрес: "}{form.address || "—"}{"\n"}
          {"Тел: "}{form.phone || "—"}{"  Email: "}{form.email || "—"}{"\n\n"}
          {"Р/сч: "}{form.bank_account || "—"}{"\n"}
          {"Банк: "}{form.bank_name || "—"}{"\n"}
          {"БИК: "}{form.bik || "—"}{"  К/сч: "}{form.bank_corr || "—"}
        </div>
      </div>
    </div>
  );
}
