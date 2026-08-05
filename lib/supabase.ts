// Legacy public lead intake — now backed by Neon instead of Supabase.
// The Lead type here is the public form Lead (not CRMLead).
import { createLead } from "./crm/client";

export type Lead = {
  id?: string;
  created_at?: string;
  name: string;
  phone: string;
  telegram?: string;
  product: string;
  quantity?: string;
  weight?: string;
  country: string;
  status?: string;
  notes?: string;
};

export async function saveLead(lead: Omit<Lead, "id" | "created_at" | "status">) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await createLead({
    lead_id:            id,
    created_at:         now,
    updated_at:         now,
    name:               lead.name,
    phone:              lead.phone,
    telegram:           lead.telegram ?? "",
    email:              "",
    company:            "",
    product:            lead.product,
    product_link:       "",
    category:           "",
    quantity:           lead.quantity ?? "",
    weight:             lead.weight ?? "",
    volume:             "",
    country_destination: lead.country,
    city_destination:   "",
    delivery_type:      "",
    service_type:       "",
    status:             "NEW",
    priority:           "WARM",
    estimated_value:    0,
    manager:            "",
    comment:            lead.notes ?? "",
    source:             "website_form",
    utm_source:         "",
    utm_campaign:       "",
  });
  return [{ id }];
}
