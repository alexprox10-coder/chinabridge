"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/partner-portal/i18n";
import type { PartnerAccount } from "@/lib/partner-portal/types";

export default function PartnerProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Partial<PartnerAccount> | null>(null);
  const [nameRu, setNameRu] = useState("");
  const [nameCn, setNameCn] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/partner/profile")
      .then((r) => r.json())
      .then((p: Partial<PartnerAccount>) => {
        setProfile(p);
        setNameRu(p.name_ru ?? "");
        setNameCn(p.name_cn ?? "");
        setCompany(p.company ?? "");
        setCity(p.city ?? "");
        setPhone(p.phone ?? "");
        setWechat(p.wechat ?? "");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/partner/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name_ru: nameRu, name_cn: nameCn, company, city, phone, wechat }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  if (!profile) return <p className="text-slate-400 text-sm">{t("loading")}</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">{t("profile")}</h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {(nameRu || profile.email || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{nameRu || nameCn}</p>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("name_ru")}</label>
              <input value={nameRu} onChange={(e) => setNameRu(e.target.value)}
                className={inputCls} placeholder="Иван" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("name_cn")}</label>
              <input value={nameCn} onChange={(e) => setNameCn(e.target.value)}
                className={inputCls} placeholder="李伟" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("company")}</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)}
              className={inputCls} placeholder="Alibaba Co." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("city")}</label>
              <input value={city} onChange={(e) => setCity(e.target.value)}
                className={inputCls} placeholder="Guangzhou" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className={inputCls} placeholder="+86..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("wechat")}</label>
            <input value={wechat} onChange={(e) => setWechat(e.target.value)}
              className={inputCls} placeholder="WeChat ID" />
          </div>

          {saved && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{t("saved")}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
            {saving ? t("saving") : t("save")}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
