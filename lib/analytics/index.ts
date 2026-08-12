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

  // ── AI Unit Economics Funnel ───────────────────────────────────────────────
  aiFunnelStart:         ()                               => fire("ai_funnel_start",          "ai_funnel_start",          { category: "ai_funnel" }),
  aiFunnelUrlEntered:    ()                               => fire("ai_funnel_url_entered",     "ai_funnel_url_entered",    { category: "ai_funnel" }),
  aiFunnelDescEntered:   ()                               => fire("ai_funnel_desc_entered",    "ai_funnel_desc_entered",   { category: "ai_funnel" }),
  aiFunnelAnalyzed:      (p?: { confidence?: string })   => fire("ai_funnel_analyzed",        "ai_funnel_analyzed",       { category: "ai_funnel", ...p }),
  aiFunnelPreviewShown:  (p?: { verdict?: string })      => fire("ai_funnel_preview_shown",   "ai_funnel_preview_shown",  { category: "ai_funnel", ...p }),
  aiFunnelMpSelected:    (p?: { marketplace?: string })  => fire("ai_funnel_mp_selected",     "ai_funnel_mp_selected",    { category: "ai_funnel", ...p }),
  aiFunnelFullCalc:      (p?: { verdict?: string })      => fire("ai_funnel_full_calc",       "ai_funnel_full_calc",      { category: "ai_funnel", ...p }),
  aiFunnelContactOpen:   ()                               => fire("ai_funnel_contact_open",    "ai_funnel_contact_open",   { category: "ai_funnel" }),
  aiFunnelLeadCreated:   (p?: { priority?: string })     => fire("ai_funnel_lead_created",    "ai_funnel_lead_created",   { category: "ai_funnel", ...p }),
  aiFunnelSupplierClick: ()                               => fire("ai_funnel_supplier_click",  "ai_funnel_supplier_click", { category: "ai_funnel" }),
  aiFunnelImportClick:   ()                               => fire("ai_funnel_import_click",    "ai_funnel_import_click",   { category: "ai_funnel" }),

  // ── Unit Economics Engine — полная воронка (ТЗ §30) ───────────────────────
  unitEconomicsOpen:        ()                                          => fire("unit_economics_open",        "unit_economics_open",        { category: "unit_economics" }),
  productUrlEntered:        ()                                          => fire("product_url_entered",        "product_url_entered",        { category: "unit_economics" }),
  productAnalysisStarted:   ()                                          => fire("product_analysis_started",   "product_analysis_started",   { category: "unit_economics" }),
  productAnalysisCompleted: (p?: { confidence?: string })              => fire("product_analysis_completed",  "product_analysis_completed", { category: "unit_economics", ...p }),
  previewResultViewed:      (p?: { verdict?: string })                 => fire("preview_result_viewed",       "preview_result_viewed",      { category: "unit_economics", ...p }),
  marketplaceSelected:      (p?: { marketplace?: string })             => fire("marketplace_selected",        "marketplace_selected",       { category: "unit_economics", ...p }),
  destinationSelected:      (p?: { city?: string })                    => fire("destination_selected",        "destination_selected",       { category: "unit_economics", ...p }),
  fullCalculationStarted:   ()                                          => fire("full_calculation_started",   "full_calculation_started",   { category: "unit_economics" }),
  fullCalculationCompleted: (p?: { verdict?: string; score?: number }) => fire("full_calculation_completed",  "full_calculation_completed", { category: "unit_economics", ...p }),
  saveAnalysisClicked:      ()                                          => fire("save_analysis_clicked",      "save_analysis_clicked",      { category: "unit_economics" }),
  supplierSearchClicked:    ()                                          => fire("supplier_search_clicked",    "supplier_search_clicked",    { category: "unit_economics" }),
  similarProductsClicked:   ()                                          => fire("similar_products_clicked",   "similar_products_clicked",   { category: "unit_economics" }),
  importStarted:            (p?: { priority?: string })                => fire("import_started",              "import_started",             { category: "unit_economics", ...p }),
  scenarioSwitched:         (p?: { scenario?: string })                => fire("scenario_switched",           "scenario_switched",          { category: "unit_economics", ...p }),
  targetPriceViewed:        ()                                          => fire("target_price_viewed",        "target_price_viewed",        { category: "unit_economics" }),
};
