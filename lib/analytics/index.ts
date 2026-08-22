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
  phoneClick: () => {
    fire("phone_click", "phone_click", { category: "contact" });
    if (typeof window !== "undefined") {
      const page = window.location.pathname;
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "☎️ Клик по телефону",
          product: `Нажал на номер +7 (914) 581-96-61 — страница: ${page}`,
          source: "phone_click",
        }),
      }).catch(() => {});
    }
  },

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

  // ── AI Product Analyzer v1.1 — воронка без промежуточной формы ───────────
  productUrlSubmitted:       ()                                          => fire("product_url_submitted",       "product_url_submitted",       { category: "product_analyzer" }),
  productScrapeStarted:      ()                                          => fire("product_scrape_started",      "product_scrape_started",      { category: "product_analyzer" }),
  productScrapeSuccess:      (p?: { platform?: string })                => fire("product_scrape_success",      "product_scrape_success",      { category: "product_analyzer", ...p }),
  productScrapeFailed:       (p?: { reason?: string })                  => fire("product_scrape_failed",       "product_scrape_failed",       { category: "product_analyzer", ...p }),
  productExtractionSuccess:  (p?: { confidence?: string })              => fire("product_extraction_success",  "product_extraction_success",  { category: "product_analyzer", ...p }),
  productExtractionPartial:  (p?: { missing?: string })                 => fire("product_extraction_partial",  "product_extraction_partial",  { category: "product_analyzer", ...p }),
  unitEconomicsAutoStarted:  ()                                          => fire("unit_economics_auto_started", "unit_economics_auto_started", { category: "product_analyzer" }),
  unitEconomicsAutoCompleted:(p?: { verdict?: string; score?: number }) => fire("unit_economics_auto_completed","unit_economics_auto_completed",{ category: "product_analyzer", ...p }),
  manualCorrectionOpened:    ()                                          => fire("manual_correction_opened",    "manual_correction_opened",    { category: "product_analyzer" }),
  manualCorrectionSaved:     ()                                          => fire("manual_correction_saved",     "manual_correction_saved",     { category: "product_analyzer" }),
  unitEconomicsRecalculated: (p?: { verdict?: string })                 => fire("unit_economics_recalculated", "unit_economics_recalculated", { category: "product_analyzer", ...p }),
};
