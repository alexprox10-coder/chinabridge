import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const DEMO_LEADS = [
  { name: "Алексей Воронов",  phone: "+7 905 123-45-67", company: "ТехноИмпорт LLC",  product: "LED-светильники промышленные",     category: "Электроника",   status: "QUALIFIED", priority: "HOT",  value: 145000, source: "telegram" },
  { name: "Мария Соколова",   phone: "+7 916 234-56-78", company: "ЭкоТорг",           product: "Экосумки и упаковка",             category: "Текстиль",     status: "NEW",       priority: "WARM", value: 87000,  source: "website"  },
  { name: "Дмитрий Кузнецов", phone: "+7 926 345-67-89", company: "ГлобалТрейд",       product: "Электроника оптом (ноутбуки)",    category: "Электроника",  status: "PROPOSAL",  priority: "HOT",  value: 234000, source: "referral" },
  { name: "Анна Петрова",     phone: "+7 903 456-78-90", company: "РусМаркет",          product: "Одежда и аксессуары",            category: "Текстиль",     status: "NEW",       priority: "WARM", value: 67000,  source: "email"    },
  { name: "Игорь Смирнов",    phone: "+7 917 567-89-01", company: "АзияЭкспорт",        product: "Промышленное оборудование",      category: "Оборудование", status: "WON",       priority: "HOT",  value: 189000, source: "telegram" },
  { name: "Елена Новикова",   phone: "+7 925 678-90-12", company: "МегаТрейд",          product: "Товары для дома, кухня",         category: "Товары дома",  status: "QUALIFIED", priority: "WARM", value: 123000, source: "website"  },
  { name: "Павел Захаров",    phone: "+7 968 789-01-23", company: "ТорговыйДом",        product: "Спортивные товары",              category: "Спорт",        status: "NEW",       priority: "COLD", value: 56000,  source: "referral" },
  { name: "Наталья Орлова",   phone: "+7 904 890-12-34", company: "ИмпортГрупп",        product: "Детские игрушки оптом",          category: "Игрушки",      status: "QUALIFIED", priority: "WARM", value: 98000,  source: "telegram" },
  { name: "Сергей Лебедев",   phone: "+7 911 901-23-45", company: "ПраймТрейдинг",      product: "Запчасти для техники",          category: "Автозапчасти", status: "NEW",       priority: "HOT",  value: 312000, source: "website"  },
  { name: "Ольга Козлова",    phone: "+7 919 012-34-56", company: "АльфаИмпорт",        product: "Косметика и парфюмерия",         category: "Красота",      status: "NEW",       priority: "WARM", value: 45000,  source: "email"    },
];

export async function ensureOnboardingTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS onboarding_events (
      id         SERIAL PRIMARY KEY,
      tenant_id  TEXT NOT NULL,
      step       TEXT NOT NULL,
      action     TEXT NOT NULL,
      data       JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function seedDemoLeads(tenantId: string): Promise<number> {
  const now  = new Date();
  let seeded = 0;

  for (let i = 0; i < DEMO_LEADS.length; i++) {
    const lead     = DEMO_LEADS[i];
    const daysAgo  = Math.floor(Math.random() * 28) + 1;
    const ts       = new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

    try {
      await sql`
        INSERT INTO crm_leads
          (lead_id, tenant_id, created_at, updated_at, name, phone, company, product, category, status, priority, estimated_value, source)
        VALUES
          (${"demo-" + tenantId.slice(0, 8) + "-" + i},
           ${tenantId}, ${ts}, ${ts},
           ${lead.name}, ${lead.phone}, ${lead.company},
           ${lead.product}, ${lead.category},
           ${lead.status}, ${lead.priority}, ${lead.value}, ${"demo"})
        ON CONFLICT (lead_id) DO NOTHING
      `;
      seeded++;
    } catch { /* skip — column may differ */ }
  }
  return seeded;
}

export async function logOnboardingEvent(
  tenantId: string, step: string, action: string, data: Record<string, unknown> = {}
): Promise<void> {
  try {
    await ensureOnboardingTable();
    await sql`
      INSERT INTO onboarding_events (tenant_id, step, action, data)
      VALUES (${tenantId}, ${step}, ${action}, ${JSON.stringify(data)})
    `;
  } catch { /* non-critical */ }
}
