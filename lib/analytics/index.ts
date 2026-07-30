export { trackGAEvent as trackEvent, trackGAPageView, GA_ID } from "./ga";
export { reachGoal, trackMetrikaPageView, METRIKA_ID } from "./metrika";

import { trackGAEvent } from "./ga";
import { reachGoal } from "./metrika";

function fire(gaName: string, goal: string, params?: Record<string, unknown>) {
  trackGAEvent(gaName, { event_category: params?.category ?? "engagement", ...params });
  reachGoal(goal, params);
}

export const analytics = {
  calculatorClick:  () => fire("calculator_click",  "calculator_click",  { category: "engagement" }),
  formSubmit:       () => fire("form_submit",        "form_submit",       { category: "lead" }),
  telegramClick:    () => fire("telegram_click",     "telegram_click",    { category: "contact" }),
  whatsappClick:    () => fire("whatsapp_click",     "whatsapp_click",    { category: "contact" }),
  phoneClick:       () => fire("phone_click",        "phone_click",       { category: "contact" }),
  priceDownload:    () => fire("price_download",     "price_download",    { category: "content" }),
  servicesView:     () => fire("services_view",      "services_view",     { category: "content" }),
  casesView:        () => fire("cases_view",         "cases_view",        { category: "content" }),
};
