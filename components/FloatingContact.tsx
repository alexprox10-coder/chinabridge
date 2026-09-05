"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackVkGoal } from "@/components/analytics/VkPixel";
import { trackGAEvent } from "@/lib/analytics/ga";

async function alertManager(payload: Record<string, string>) {
  try {
    await fetch("/api/contact-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch { /**/ }
}

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ contact: "", name: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const pathname = usePathname();

  useEffect(() => { setVisible(true); }, []);

  if (!visible) return null;
  if (pathname.startsWith("/client") || pathname.startsWith("/admin")) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact.trim()) return;
    setStatus("loading");

    try {
      await alertManager({
        contact: form.contact.trim(),
        name: form.name.trim(),
        page: pathname,
        type: "form",
      });
      trackVkGoal("lead");
      trackGAEvent("floatingContactSubmit", { source: "FLOATING_WIDGET" });
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  function onMessengerClick(messenger: string) {
    trackVkGoal("lead");
    trackGAEvent(`${messenger}Click`, { source: "FLOATING_WIDGET" });
    alertManager({ contact: messenger, page: pathname, type: "click" });
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Popup */}
      {open && (
        <div className="fixed bottom-20 left-4 sm:left-auto sm:right-4 sm:bottom-28 z-50 w-72 bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#00A86B]/10 border-b border-[#00A86B]/20 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Получить консультацию</p>
              <p className="text-xs text-[#8899aa]">Ответим за 15 минут</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#8899aa] hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {status === "ok" ? (
            <div className="px-4 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-white font-semibold text-sm mb-1">Готово!</p>
              <p className="text-[#8899aa] text-xs">Мы свяжемся с вами в течение 15 минут</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="@telegram или номер телефона"
                  value={form.contact}
                  onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                  className="w-full bg-[#060f1e] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#8899aa] focus:outline-none focus:border-[#00A86B]/60 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Имя (необязательно)"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#060f1e] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#8899aa] focus:outline-none focus:border-[#00A86B]/60 transition-colors"
                />
              </div>
              {status === "error" && (
                <p className="text-red-400 text-xs">Ошибка. Напишите напрямую в Telegram.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading" || !form.contact.trim()}
                className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {status === "loading" ? "Отправляем..." : "Перезвоним / напишем вам"}
              </button>

              <div className="flex gap-2">
                <a
                  href="https://t.me/ChinaBridgeLID_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onMessengerClick("Telegram")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#229ED9] text-xs font-medium py-2 rounded-xl transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
                <a
                  href="https://wa.me/79145889874?text=Здравствуйте%2C%20хочу%20узнать%20о%20доставке%20из%20Китая"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onMessengerClick("WhatsApp")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-medium py-2 rounded-xl transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-0.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); trackGAEvent("floatingContactOpen", { source: "FLOATING_BUTTON" }); }}
        className="fixed bottom-5 left-4 sm:left-auto sm:right-4 sm:bottom-24 z-50 flex items-center gap-2.5 bg-[#00A86B] hover:bg-[#009060] active:scale-95 text-white text-sm font-semibold pl-4 pr-5 py-3 rounded-full shadow-xl shadow-[#00A86B]/30 transition-all duration-200"
        aria-label="Получить консультацию"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        )}
        <span className="hidden sm:inline">Консультация</span>
      </button>
    </>
  );
}
