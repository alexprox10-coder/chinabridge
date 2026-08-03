"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/partner-portal/i18n";
import type { PartnerTask, TaskStatus } from "@/lib/partner-portal/types";
import { ru } from "@/lib/partner-portal/translations";
import { ArrowLeft, Send, Save } from "lucide-react";

const STATUS_COLORS: Record<TaskStatus, string> = {
  NEW:           "bg-blue-100 text-blue-700",
  IN_PROGRESS:   "bg-yellow-100 text-yellow-700",
  WAITING_REPLY: "bg-orange-100 text-orange-700",
  COMPLETED:     "bg-green-100 text-green-700",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();

  const [task, setTask] = useState<PartnerTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Response form state
  const [productName, setProductName] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [moq, setMoq] = useState("");
  const [factory, setFactory] = useState("");
  const [productionTime, setProductionTime] = useState("");
  const [inStock, setInStock] = useState(false);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState("");
  const [factoryPhotos, setFactoryPhotos] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // AI translation
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState("");

  useEffect(() => {
    fetch(`/api/partner/tasks/${id}`)
      .then((r) => r.json())
      .then((data: PartnerTask) => {
        setTask(data);
        setProductName(data.response_product_name ?? "");
        setPriceUsd(data.response_price_usd ?? "");
        setMoq(data.response_moq ?? "");
        setFactory(data.response_factory ?? "");
        setProductionTime(data.response_production_time ?? "");
        setInStock(data.response_in_stock === "true");
        setComment(data.response_comment ?? "");
        setPhotos(data.response_photos ?? "");
        setFactoryPhotos(data.response_factory_photos ?? "");
        setVideoUrl(data.response_video_url ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(complete = false) {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch(`/api/partner/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complete,
        response_product_name: productName,
        response_price_usd: priceUsd,
        response_moq: moq,
        response_factory: factory,
        response_production_time: productionTime,
        response_in_stock: String(inStock),
        response_comment: comment,
        response_photos: photos,
        response_factory_photos: factoryPhotos,
        response_video_url: videoUrl,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg(t("saved"));
      if (complete) {
        setTimeout(() => router.push("/partner/tasks"), 1000);
      } else {
        setTimeout(() => setSavedMsg(""), 3000);
        // Refresh task status
        fetch(`/api/partner/tasks/${id}`)
          .then((r) => r.json())
          .then((data: PartnerTask) => setTask(data));
      }
    }
  }

  async function handleTranslate() {
    if (!comment.trim()) return;
    setTranslating(true);
    setTranslated("");
    const target = lang === "zh" ? "zh" : "ru";
    const res = await fetch("/api/partner/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment, target }),
    });
    if (res.ok) {
      const data = await res.json() as { translation: string };
      setTranslated(data.translation);
    }
    setTranslating(false);
  }

  if (loading) return <p className="text-slate-400 text-sm">{t("loading")}</p>;
  if (!task) return <p className="text-red-500 text-sm">Task not found</p>;

  const isCompleted = task.status === "COMPLETED";

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-200 transition text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{t("task_detail")}</h1>
      </div>

      {/* Task info card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            {t("request_id")}: {task.task_id}
          </span>
          <span className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
            {t(`task_type_${task.type}` as keyof typeof ru)}
          </span>
          <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
            {t(`status_${task.status}` as keyof typeof ru)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t("product")}</p>
            <p className="font-semibold text-slate-800 text-lg">{task.product_display}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t("quantity")}</p>
            <p className="font-semibold text-slate-800">{task.quantity} {t("pcs")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t("deadline")}</p>
            <p className="font-semibold text-slate-800">{task.deadline_hours}{t("hours")}</p>
          </div>
        </div>

        {task.description && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">{t("description")}</p>
            <p className="text-sm text-slate-700">{task.description}</p>
          </div>
        )}
      </div>

      {/* Response form */}
      {!isCompleted && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-800">{t("response_title")}</h2>

          <Field label={t("product_name")}>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              className={inputCls} placeholder={t("product_name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("price_per_unit")}>
              <input value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)}
                className={inputCls} placeholder="0.00" type="number" min="0" step="0.01" />
            </Field>
            <Field label={t("moq")}>
              <input value={moq} onChange={(e) => setMoq(e.target.value)}
                className={inputCls} placeholder="100" type="number" min="0" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("factory")}>
              <input value={factory} onChange={(e) => setFactory(e.target.value)}
                className={inputCls} placeholder={t("factory")} />
            </Field>
            <Field label={t("production_time")}>
              <input value={productionTime} onChange={(e) => setProductionTime(e.target.value)}
                className={inputCls} placeholder="15 days" />
            </Field>
          </div>

          {/* In stock */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setInStock(!inStock)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${inStock ? "bg-blue-600" : "bg-slate-200"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStock ? "translate-x-7" : "translate-x-1"}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">{t("in_stock")}</span>
          </label>

          <Field label={t("product_photos")}>
            <input value={photos} onChange={(e) => setPhotos(e.target.value)}
              className={inputCls} placeholder="https://..." />
          </Field>

          <Field label={t("factory_photos")}>
            <input value={factoryPhotos} onChange={(e) => setFactoryPhotos(e.target.value)}
              className={inputCls} placeholder="https://..." />
          </Field>

          <Field label={t("video_url")}>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
              className={inputCls} placeholder="https://..." />
          </Field>

          {/* Comment + AI translation */}
          <Field label={t("comment")}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              rows={3} className={`${inputCls} resize-none`}
              placeholder={lang === "zh" ? "在此输入备注..." : "Введите комментарий..."} />
          </Field>

          {comment.trim() && (
            <div>
              <button onClick={handleTranslate} disabled={translating}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50">
                {translating ? t("translating") : t("translate_btn")}
              </button>
              {translated && (
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-500 mb-0.5">{t("translated_label")}</p>
                  <p className="text-sm text-blue-800">{translated}</p>
                </div>
              )}
            </div>
          )}

          {savedMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{savedMsg}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 rounded-xl text-sm transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? t("saving") : t("save_draft")}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50">
              <Send className="w-4 h-4" />
              {t("complete_task")}
            </button>
          </div>
        </div>
      )}

      {/* Show existing response if completed */}
      {isCompleted && (task.response_price_usd || task.response_factory) && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-green-800">{t("response_title")}</h2>
          {task.response_product_name && <ResponseRow label={t("product_name")} value={task.response_product_name} />}
          {task.response_price_usd && <ResponseRow label={t("price_per_unit")} value={`$${task.response_price_usd}`} />}
          {task.response_moq && <ResponseRow label={t("moq")} value={`${task.response_moq} ${t("pcs")}`} />}
          {task.response_factory && <ResponseRow label={t("factory")} value={task.response_factory} />}
          {task.response_production_time && <ResponseRow label={t("production_time")} value={task.response_production_time} />}
          {task.response_comment && <ResponseRow label={t("comment")} value={task.response_comment} />}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ResponseRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-green-600 font-medium min-w-28">{label}:</span>
      <span className="text-green-900">{value}</span>
    </div>
  );
}
