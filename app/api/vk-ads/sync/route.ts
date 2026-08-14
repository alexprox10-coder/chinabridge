import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';
import { createLead } from '@/lib/crm/client';

export const runtime     = 'nodejs';
export const maxDuration = 60;

const VK_ADS_API = 'https://target.my.com/api/v2';

interface VkLead {
  id:           number;
  ad_id?:       number;
  campaign_id?: number;
  group_id?:    number;
  date?:        number; // unix timestamp
  answers?:     { key: string; answer: string }[];
  user_id?:     number;
  name?:        string;
  phone?:       string;
  email?:       string;
}

interface VkLeadForm {
  id:   number;
  name: string;
}

async function getToken(): Promise<string | null> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
    SELECT key, value FROM integration_tokens WHERE key IN ('vk_ads_access_token', 'vk_ads_expires_at')
  `.catch(() => [])) as { key: string; value: string }[];

  const data: Record<string, string> = {};
  for (const r of rows) data[r.key] = r.value;

  const token = data['vk_ads_access_token'];
  if (!token) return null;

  const expiresAt = data['vk_ads_expires_at'];
  if (expiresAt && new Date(expiresAt) < new Date()) {
    console.warn('[VK-ADS] access token expired');
    return null;
  }

  return token;
}

async function mtGet(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${VK_ADS_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`myTarget API ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

function extractContact(lead: VkLead, field: string): string {
  if (field === 'phone' && lead.phone) return lead.phone;
  if (field === 'email' && lead.email) return lead.email;
  if (field === 'name'  && lead.name)  return lead.name;

  const ans = lead.answers?.find(a =>
    a.key.toLowerCase().includes(field) ||
    a.answer?.toLowerCase().includes(field)
  );
  return ans?.answer ?? '';
}

function leadToContact(lead: VkLead): { name: string; phone: string; email: string; product: string } {
  const answers = lead.answers ?? [];

  const name    = lead.name  ?? answers.find(a => /имя|name|фио/i.test(a.key))?.answer ?? '';
  const phone   = lead.phone ?? answers.find(a => /телефон|phone|тел/i.test(a.key))?.answer ?? '';
  const email   = lead.email ?? answers.find(a => /email|почта|mail/i.test(a.key))?.answer ?? '';
  const product = answers.find(a => /товар|product|груз|cargo/i.test(a.key))?.answer ?? '';

  return { name, phone, email, product };
}

async function sendTgNotify(lead: VkLead, formName: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const contact = leadToContact(lead);
  const date    = lead.date ? new Date(lead.date * 1000).toLocaleString('ru-RU') : '—';
  const answers = (lead.answers ?? [])
    .map(a => `• ${a.key}: ${a.answer}`)
    .join('\n');

  const text = [
    `📢 <b>Новый лид — VK Реклама</b>`,
    ``,
    `📋 Форма: ${formName}`,
    contact.name  ? `👤 ${contact.name}`  : '',
    contact.phone ? `📞 ${contact.phone}` : '',
    contact.email ? `✉️ ${contact.email}` : '',
    `📅 ${date}`,
    answers ? `\n<pre>${answers}</pre>` : '',
  ].filter(Boolean).join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(6000),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return runSync();
}

// Cron вызывает GET с x-cron-secret
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return runSync();
}

async function runSync(): Promise<NextResponse> {
  const sql   = neon(process.env.DATABASE_URL!);
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ ok: false, error: 'VK Ads не подключён или токен истёк. Переподключите через /api/vk-ads/auth' });
  }

  const results: Record<string, unknown> = { synced: [], errors: [] };
  let totalNew = 0;

  try {
    const formsData = await mtGet('/lead_ads.json?limit=50', token) as { items?: VkLeadForm[] };
    const forms: VkLeadForm[] = formsData?.items ?? [];

    if (!forms.length) {
      return NextResponse.json({ ok: true, message: 'Lead-формы не найдены в аккаунте VK Ads', synced: 0 });
    }

    // Читаем уже синхронизированные external_id
    await sql`
      CREATE TABLE IF NOT EXISTS crm_leads_ext (
        lead_id     text NOT NULL,
        external_id text NOT NULL,
        source      text NOT NULL,
        PRIMARY KEY (source, external_id)
      )`;

    const existingRows = (await sql`
      SELECT external_id FROM crm_leads_ext WHERE source = 'VK_ADS'`) as { external_id: string }[];
    const existingIds = new Set(existingRows.map(r => r.external_id));

    for (const form of forms) {
      try {
        const leadsData = await mtGet(`/lead_ads/${form.id}/leads.json?limit=200`, token) as { items?: VkLead[] };
        const leads: VkLead[] = leadsData?.items ?? [];

        for (const lead of leads) {
          const extId = String(lead.id);
          if (existingIds.has(extId)) continue;

          const contact = leadToContact(lead);
          const now     = new Date().toISOString();
          const leadId  = `vk-${lead.id}`;

          // Создаём лид в CRM
          await createLead({
            lead_id:             leadId,
            created_at:          lead.date ? new Date(lead.date * 1000).toISOString() : now,
            updated_at:          now,
            name:                contact.name,
            phone:               contact.phone,
            email:               contact.email,
            telegram:            '',
            company:             '',
            product:             contact.product,
            product_link:        '',
            category:            '',
            quantity:            '',
            weight:              '',
            volume:              '',
            country_destination: 'Russia',
            city_destination:    '',
            delivery_type:       '',
            service_type:        'delivery_only',
            status:              'NEW',
            priority:            'WARM',
            estimated_value:     0,
            manager:             '',
            comment:             JSON.stringify({
              vk_form_id:    form.id,
              vk_form_name:  form.name,
              vk_lead_id:    lead.id,
              vk_ad_id:      lead.ad_id,
              vk_answers:    lead.answers,
              source:        'vk_ads',
            }),
            source:              'VK_ADS',
            utm_source:          'vk_ads',
            utm_campaign:        String(lead.campaign_id ?? ''),
            delivery_cost:       undefined,
            carrier_cost:        undefined,
            markup_percent:      undefined,
            profit:              undefined,
            margin_percent:      undefined,
            pricing_rule:        undefined,
          }, 'tenant-chinabridge').catch(() => null);

          // Помечаем как синхронизированный
          await sql`
            INSERT INTO crm_leads_ext (lead_id, external_id, source)
            VALUES (${leadId}, ${extId}, 'VK_ADS')
            ON CONFLICT DO NOTHING`;

          existingIds.add(extId);
          totalNew++;

          // TG уведомление
          await sendTgNotify(lead, form.name);
        }

        (results.synced as unknown[]).push({ form_id: form.id, form: form.name, leads: leads.length });
      } catch (e) {
        (results.errors as string[]).push(`form ${form.id}: ${String(e)}`);
      }
    }

  } catch (e) {
    (results.errors as string[]).push(String(e));
    return NextResponse.json({ ok: false, ...results, error: String(e) });
  }

  return NextResponse.json({ ok: true, new_leads: totalNew, ...results });
}
