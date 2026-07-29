import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("placeholder")) {
    throw new Error("Supabase не настроен. Укажите реальные ключи в .env.local");
  }
  _client = createClient(url, key);
  return _client;
}

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
  const client = getClient();
  const { data, error } = await client.from("leads").insert([lead]).select();
  if (error) throw error;
  return data;
}
