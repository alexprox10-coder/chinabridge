import { NextRequest, NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-portal/auth";
import { getTaskById, updateTaskResponse, deletePartnerTask } from "@/lib/partner-portal/api";
import { markPartnerTaskDeleted } from "@/lib/partner-portal/status-store";
import { createLead } from "@/lib/crm/client";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await getTaskById(id, session.partnerId);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await getTaskById(id, session.partnerId);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, string | boolean>;
  const { complete, ...fields } = body as { complete?: boolean } & Record<string, string>;

  const now = new Date().toISOString();
  const ok = await updateTaskResponse(task.id, {
    ...fields,
    status: complete ? "COMPLETED" : "IN_PROGRESS",
    ...(complete ? { completed_at: now } : {}),
  });

  // При завершении задачи — копируем в основную CRM
  let crmLeadId: string | null = null;
  if (complete && ok) {
    try {
      const taskType: Record<string, string> = {
        SEARCH:     "Поиск товара",
        BUYOUT:     "Выкуп товара",
        INSPECTION: "Инспекция",
      };
      const responseLines: string[] = [];
      if (fields.response_product_name) responseLines.push(`Товар: ${fields.response_product_name}`);
      if (fields.response_price_usd)    responseLines.push(`Цена: $${fields.response_price_usd}/шт`);
      if (fields.response_moq)          responseLines.push(`MOQ: ${fields.response_moq} шт`);
      if (fields.response_factory)      responseLines.push(`Фабрика: ${fields.response_factory}`);
      if (fields.response_production_time) responseLines.push(`Срок производства: ${fields.response_production_time}`);
      if (fields.response_in_stock === "true") responseLines.push("Есть в наличии: Да");
      if (fields.response_comment)      responseLines.push(`Комментарий: ${fields.response_comment}`);
      if (fields.response_photos)       responseLines.push(`Фото: ${fields.response_photos}`);

      const comment = [
        `📦 ОТЧЁТ ПАРТНЁРА — ${taskType[task.type] ?? task.type}`,
        `Партнёр: ${session.partnerId}`,
        `Задача: ${task.task_id}`,
        "",
        ...responseLines,
      ].join("\n");

      const newLead = await createLead({
        lead_id:             `partner-${task.task_id}`,
        created_at:          now,
        updated_at:          now,
        name:                String(fields.response_product_name ?? task.product_display),
        company:             String(fields.response_factory ?? ""),
        phone:               "",
        email:               "",
        telegram:            "",
        product:             String(fields.response_product_name ?? task.product_display),
        product_link:        String(fields.response_photos ?? ""),
        category:            taskType[task.type] ?? task.type,
        quantity:            String(task.quantity ?? ""),
        weight:              "",
        volume:              "",
        country_destination: "CN",
        city_destination:    "",
        delivery_type:       "",
        service_type:        "",
        status:              "NEW",
        priority:            "WARM",
        estimated_value:     0,
        manager:             "",
        comment,
        source:              `partner-task:${task.type.toLowerCase()}`,
        utm_source:          "partner-portal",
        utm_campaign:        session.partnerId,
      }, "tenant-chinabridge");
      crmLeadId = newLead.lead_id;
    } catch (e) {
      console.error("[Partner→CRM] createLead failed:", e);
    }
  }

  return NextResponse.json({ ok, crmLeadId });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await getTaskById(id, session.partnerId);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [ok] = await Promise.all([
    deletePartnerTask(task.id),
    markPartnerTaskDeleted(task.task_id).catch(() => {}),
  ]);
  return NextResponse.json({ ok });
}
