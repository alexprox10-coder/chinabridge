import { NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 30;

const DEMO_LEADS = [
  { id: "dl-1", name: "ООО ТехноТрейд", contact: "Иван Петров", phone: "+7 (903) 123-45-67", status: "new",        route: "Шанхай → Москва",    cargo: "Электроника", weight: 500,  value: 2800000 },
  { id: "dl-2", name: "АО АзияЛогист",  contact: "Мария Сидорова", phone: "+7 (916) 234-56-78", status: "qualified", route: "Гуанчжоу → Алматы", cargo: "Одежда",      weight: 1200, value: 1200000 },
  { id: "dl-3", name: "ИП Громов",       contact: "Алексей Громов", phone: "+7 (999) 345-67-89", status: "proposal",  route: "Иу → Екатеринбург", cargo: "Игрушки",     weight: 800,  value: 650000 },
  { id: "dl-4", name: "ООО СилкРоуд",   contact: "Дарья Козлова",  phone: "+7 (925) 456-78-90", status: "closed",    route: "Шэньчжэнь → СПб",  cargo: "Запчасти",    weight: 350,  value: 4100000 },
  { id: "dl-5", name: "ЗАО ВостокТорг", contact: "Сергей Новиков", phone: "+7 (903) 567-89-01", status: "new",        route: "Пекин → Ташкент",  cargo: "Химия",       weight: 2000, value: 890000 },
];

const DEMO_DOCS = [
  { id: "dd-1", name: "Коносамент BL-2026-001",   type: "bill_of_lading", status: "active", date: "2026-07-15" },
  { id: "dd-2", name: "CMR накладная №4521",        type: "cmr",            status: "active", date: "2026-07-20" },
  { id: "dd-3", name: "Инвойс INV-2026-0087",      type: "invoice",        status: "paid",   date: "2026-07-18" },
  { id: "dd-4", name: "Таможенная декларация 145",  type: "customs",        status: "draft",  date: "2026-07-22" },
];

const DEMO_TASKS = [
  { id: "dt-1", title: "Оформить таможенную декларацию для груза ТехноТрейд", priority: "high",   status: "pending" },
  { id: "dt-2", title: "Подготовить коммерческое предложение для АзияЛогист", priority: "medium", status: "pending" },
  { id: "dt-3", title: "Проверить статус прохождения границы — груз Громова",  priority: "high",   status: "in_progress" },
  { id: "dt-4", title: "Выставить счёт ООО СилкРоуд за доставку",             priority: "medium", status: "done" },
];

export async function POST() {
  // Seed to localStorage via response (client-side seeding through API)
  return NextResponse.json({
    ok: true,
    seeded: {
      leads:     DEMO_LEADS.length,
      documents: DEMO_DOCS.length,
      tasks:     DEMO_TASKS.length,
    },
    data: {
      leads:     DEMO_LEADS,
      documents: DEMO_DOCS,
      tasks:     DEMO_TASKS,
    },
    message: `Демо-данные загружены: ${DEMO_LEADS.length} лидов, ${DEMO_DOCS.length} документов, ${DEMO_TASKS.length} задач`,
  });
}
