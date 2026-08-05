import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { crmLeads } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";

export const runtime     = "nodejs";
export const maxDuration = 30;

function makeId() {
  return `lead-demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => new Date().toISOString();

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("cb_tenant_id")?.value;

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Нет сессии тенанта" }, { status: 401 });
  }

  try {
    await ensureSchema();
    const db = getDb();

    const demoLeads = [
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Иван Петров", phone: "+7 (903) 123-45-67", telegram: "@ivanpetrov",
        email: "petrov@technotrade.ru", company: "ООО ТехноТрейд",
        product: "Электроника", category: "electronics", quantity: "500 кг", weight: "500", volume: "3",
        countryDestination: "Россия", cityDestination: "Москва",
        deliveryType: "авиа", serviceType: "под ключ",
        status: "NEW", priority: "HOT", estimatedValue: "2800000",
        manager: "Менеджер AI", source: "website",
        comment: "Крупный клиент, нужна быстрая доставка",
      },
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Мария Сидорова", phone: "+7 (916) 234-56-78", telegram: "@mariasid",
        email: "maria@azialogist.kz", company: "АО АзияЛогист",
        product: "Одежда и текстиль", category: "textile", quantity: "1200 кг", weight: "1200", volume: "8",
        countryDestination: "Казахстан", cityDestination: "Алматы",
        deliveryType: "авто", serviceType: "карго",
        status: "QUALIFIED", priority: "WARM", estimatedValue: "1200000",
        manager: "Менеджер AI", source: "telegram",
        comment: "Регулярные поставки раз в месяц",
      },
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Алексей Громов", phone: "+7 (999) 345-67-89", telegram: "@agromov",
        email: "gromov@mail.ru", company: "ИП Громов",
        product: "Детские игрушки", category: "toys", quantity: "800 кг", weight: "800", volume: "12",
        countryDestination: "Россия", cityDestination: "Екатеринбург",
        deliveryType: "ж/д", serviceType: "карго",
        status: "PROPOSAL", priority: "WARM", estimatedValue: "650000",
        manager: "Менеджер AI", source: "referral",
        comment: "Запрошено КП, ждёт ответа",
      },
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Дарья Козлова", phone: "+7 (925) 456-78-90", telegram: "@darykoz",
        email: "kozlova@silkroad.ru", company: "ООО СилкРоуд",
        product: "Автозапчасти", category: "auto_parts", quantity: "350 кг", weight: "350", volume: "2",
        countryDestination: "Россия", cityDestination: "Санкт-Петербург",
        deliveryType: "море", serviceType: "под ключ",
        status: "WON", priority: "HOT", estimatedValue: "4100000",
        manager: "Менеджер AI", source: "website",
        comment: "Сделка закрыта. Постоянный клиент",
      },
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Сергей Новиков", phone: "+7 (903) 567-89-01", telegram: "@sergnovikov",
        email: "novikov@vostoktorg.uz", company: "ЗАО ВостокТорг",
        product: "Химическое сырьё", category: "chemicals", quantity: "2000 кг", weight: "2000", volume: "5",
        countryDestination: "Узбекистан", cityDestination: "Ташкент",
        deliveryType: "авто", serviceType: "карго",
        status: "NEW", priority: "COLD", estimatedValue: "890000",
        manager: "Менеджер AI", source: "cold_call",
        comment: "Первый контакт, требует прогрева",
      },
      {
        leadId: makeId(), tenantId,
        createdAt: now(), updatedAt: now(),
        name: "Олег Захаров", phone: "+7 (911) 678-90-12", telegram: "@olzakh",
        email: "zakharov@import-pro.ru", company: "ООО ИмпортПро",
        product: "Промышленное оборудование", category: "equipment", quantity: "1500 кг", weight: "1500", volume: "6",
        countryDestination: "Россия", cityDestination: "Новосибирск",
        deliveryType: "авто", serviceType: "под ключ",
        status: "NEGOTIATION", priority: "HOT", estimatedValue: "7200000",
        manager: "Менеджер AI", source: "exhibition",
        comment: "Переговоры по цене, высокий потенциал",
      },
    ];

    await db.insert(crmLeads).values(demoLeads).onConflictDoNothing();

    return NextResponse.json({
      ok: true,
      seeded: demoLeads.length,
      message: `Загружено ${demoLeads.length} демо-лидов в CRM`,
    });
  } catch (e) {
    console.error("[demo/seed] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
