export { trackGAEvent as trackEvent, trackGAPageView, GA_ID } from "./ga";
export { reachGoal, trackMetrikaPageView, METRIKA_ID } from "./metrika";

import { trackGAEvent } from "./ga";
import { reachGoal } from "./metrika";

function fire(gaName: string, goal: string, params?: Record<string, unknown>) {
  trackGAEvent(gaName, { event_category: params?.category ?? "engagement", ...params });
  reachGoal(goal, params);
}

export const analytics = {
  // ── Форма заявки ──────────────────────────────────────────────────────────
  leadFormStart:  () => fire("lead_form_start",  "lead_form_start",  { category: "lead" }),
  leadFormSubmit: () => fire("lead_form_submit",  "lead_form_submit", { category: "lead" }),

  // ── Калькулятор ───────────────────────────────────────────────────────────
  calculatorStart: () => fire("calculator_start", "calculator_start", { category: "calculator" }),
  calculatorComplete: (params?: { route?: string; cost?: number; margin?: number }) =>
    fire("calculator_complete", "calculator_complete", { category: "calculator", ...params }),
  proposalDownload: (params?: { lead_id?: string }) =>
    fire("proposal_download", "proposal_download", { category: "calculator", ...params }),
  formSubmit: (params?: { form_id?: string }) =>
    fire("form_submit", "form_submit", { category: "lead", ...params }),

  // ── CTA-кнопки ────────────────────────────────────────────────────────────
  clickQuote:     () => fire("click_quote",       "click_quote",      { category: "engagement" }),

  // ── Контакты ──────────────────────────────────────────────────────────────
  telegramClick:  () => fire("telegram_click",    "telegram_click",   { category: "contact" }),
  whatsappClick:  () => fire("whatsapp_click",    "whatsapp_click",   { category: "contact" }),
  phoneClick:     () => fire("phone_click",       "phone_click",      { category: "contact" }),

  // ── Услуги (просмотр конкретных карточек) ─────────────────────────────────
  serviceSourcingView:      () => fire("service_sourcing_view",      "service_sourcing_view",      { category: "content" }),
  serviceConsolidationView: () => fire("service_consolidation_view", "service_consolidation_view", { category: "content" }),
  servicesView:             () => fire("services_view",              "services_view",              { category: "content" }),
  casesView:                () => fire("cases_view",                 "cases_view",                 { category: "content" }),

  // ── Прочее ────────────────────────────────────────────────────────────────
  priceDownload:  () => fire("price_download",    "price_download",   { category: "content" }),
};
